import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/*
 * P01 — إغلاق الوصول (H1، H2، H4، MAS-008/043/240/244) على قاعدة PostgreSQL مؤقتة.
 * مؤسستان حقيقيتان وأدوار حقيقية (مدير، مفوَّض بقدرة users.manage، معلم، موظف، طالب) بجلسات موقّعة،
 * وتُستدعى المسارات الفعلية. بعد كل محاولة منعٍ نتحقق من الحالة في القاعدة لا من رمز الرد وحده.
 */
if (process.env.MASRA_DISPOSABLE_DB !== '1') throw new Error('Run only against a disposable test database (MASRA_DISPOSABLE_DB=1).');
process.env.AUTH_SECRET ??= 'disposable-test-secret-not-used-anywhere-else';

const jar = vi.hoisted(() => ({ token: '' }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'midad_session' && jar.token ? { value: jar.token } : undefined), set: () => undefined }),
  headers: async () => new Headers(),
}));

const { prisma } = await import('../src/lib/prisma');
const { serializeSession } = await import('../src/lib/session');
const { getOrgActor } = await import('../src/lib/org');
const { searchOrg } = await import('../src/lib/org-search');
const users = await import('../src/app/api/org/users/route');
const userById = await import('../src/app/api/org/users/[id]/route');
const roles = await import('../src/app/api/org/roles/route');
const roleById = await import('../src/app/api/org/roles/[id]/route');
const exportRoute = await import('../src/app/api/org/export/route');

const RUN = randomUUID().slice(0, 8);
const ids: Record<string, string> = {};
let orgA = '', orgB = '';

const json = (method: string, body?: unknown) => new Request('https://masraos.test/api', {
  method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (url: string) => new Request(`https://masraos.test${url}`);

async function signInAs(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { organization: true } });
  jar.token = serializeSession({ userId: u.id, email: u.email, name: u.name, role: u.role, organizationId: u.organizationId, organizationSlug: u.organization?.slug ?? null, sessionVersion: u.sessionVersion });
}
async function actorOf(key: string) {
  await signInAs(ids[key]);
  const a = await getOrgActor();
  if (!a) throw new Error(`actor ${key} not resolved`);
  return a;
}
const email = (n: string) => `${n}-${RUN}@example.test`;

beforeAll(async () => {
  orgA = (await prisma.organization.create({ data: { name: 'P01 A', slug: `p01-a-${RUN}`, type: 'MOSQUE', plan: 'ENTERPRISE' } })).id;
  orgB = (await prisma.organization.create({ data: { name: 'P01 B', slug: `p01-b-${RUN}`, type: 'MOSQUE', plan: 'ENTERPRISE' } })).id;
  const mk = async (key: string, role: 'ORG_ADMIN' | 'STAFF' | 'TEACHER' | 'STUDENT', organizationId: string, extra: Record<string, unknown> = {}) => {
    ids[key] = (await prisma.user.create({ data: { name: key, email: email(key), passwordHash: 'not-a-login-hash', role, organizationId, ...extra } })).id;
  };
  await mk('adminA', 'ORG_ADMIN', orgA);
  await mk('adminA2', 'ORG_ADMIN', orgA);
  await mk('adminB', 'ORG_ADMIN', orgB);
  const delegateRole = await prisma.customRole.create({ data: { name: 'مفوَّض مستخدمين', permissions: ['users.view', 'users.manage'], organizationId: orgA } });
  ids.delegateRole = delegateRole.id;
  await mk('delegate', 'STAFF', orgA, { customRoleId: delegateRole.id });
  await mk('teacher', 'TEACHER', orgA);
  await mk('staff', 'STAFF', orgA);
  await mk('studentUser', 'STUDENT', orgA);
  await mk('targetStaff', 'STAFF', orgA);
  const powerRole = await prisma.customRole.create({ data: { name: 'قوي', permissions: ['settings.manage', 'finance.manage', 'users.manage'], organizationId: orgA } });
  ids.powerRole = powerRole.id;

  const teacherRec = await prisma.teacher.create({ data: { name: 'Teacher', organizationId: orgA, userId: ids.teacher } });
  const h1 = await prisma.halaqa.create({ data: { name: 'حلقة المعلم', organizationId: orgA, teacherId: teacherRec.id } });
  const h2 = await prisma.halaqa.create({ data: { name: 'حلقة أخرى', organizationId: orgA } });
  ids.s1 = (await prisma.student.create({ data: { name: 'طالب حلقتي', organizationId: orgA, halaqaId: h1.id, guardianName: 'ولي 1', guardianPhone: '0500000111' } })).id;
  ids.s2 = (await prisma.student.create({ data: { name: 'طالب حلقة غيري', organizationId: orgA, halaqaId: h2.id, guardianName: 'ولي 2', guardianPhone: '0500000222' } })).id;
  await prisma.donation.create({ data: { donorName: 'متبرع سري', amount: 5000, organizationId: orgA } });
  await prisma.task.create({ data: { title: 'مهمة داخلية', organizationId: orgA } });
  await prisma.donation.create({ data: { donorName: 'متبرع المؤسسة ب', amount: 7000, organizationId: orgB } });
});
afterAll(async () => {
  await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB].filter(Boolean) } } });
  await prisma.$disconnect();
});

describe('H4 — search is capability-scoped on the server', () => {
  it('a student account finds nothing: no donors, amounts, tasks, students or halaqat', async () => {
    const r = await searchOrg(await actorOf('studentUser'), orgA, 'متبرع');
    expect(r).toEqual({ students: [], halaqat: [], tasks: [], donations: [] });
    for (const q of ['مهمة', 'طالب', 'حلقة']) {
      const x = await searchOrg(await actorOf('studentUser'), orgA, q);
      expect([x.students.length, x.halaqat.length, x.tasks.length, x.donations.length]).toEqual([0, 0, 0, 0]);
    }
  });

  it('a teacher sees only own-halaqa students and no donations', async () => {
    const a = await actorOf('teacher');
    expect((await searchOrg(a, orgA, 'متبرع')).donations).toEqual([]);
    const names = (await searchOrg(a, orgA, 'طالب')).students.map((s) => s.name);
    expect(names).toEqual(['طالب حلقتي']);
    expect((await searchOrg(a, orgA, 'حلقة')).halaqat.map((h) => h.name)).toEqual(['حلقة المعلم']);
  });

  it('control: staff and admin keep full search; no cross-tenant results', async () => {
    const staff = await actorOf('staff');
    expect((await searchOrg(staff, orgA, 'متبرع')).donations.length).toBe(1);
    expect((await searchOrg(staff, orgA, 'طالب')).students.length).toBe(2);
    const admin = await actorOf('adminA');
    expect((await searchOrg(admin, orgA, 'المؤسسة ب')).donations).toEqual([]);
    expect((await searchOrg(admin, orgA, 'مهمة')).tasks.length).toBe(1);
  });
});

describe('H2 + MAS-240 — students export is scoped and audited', () => {
  it('teacher export contains only own-halaqa students; staff gets all; student is refused', async () => {
    await signInAs(ids.teacher);
    const t = await exportRoute.GET(get('/api/org/export?type=students'));
    expect(t.status).toBe(200);
    const tcsv = await t.text();
    expect(tcsv).toContain('0500000111');
    expect(tcsv).not.toContain('0500000222');

    await signInAs(ids.staff);
    const s = await (await exportRoute.GET(get('/api/org/export?type=students'))).text();
    expect(s).toContain('0500000111');
    expect(s).toContain('0500000222');

    await signInAs(ids.studentUser);
    expect((await exportRoute.GET(get('/api/org/export?type=students'))).status).toBe(403);
    await signInAs(ids.teacher);
    expect((await exportRoute.GET(get('/api/org/export?type=donations'))).status).toBe(403);
  });

  it('every successful export leaves an audit row without file contents', async () => {
    const rows = await prisma.auditLog.findMany({ where: { organizationId: orgA, action: 'exported' } });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((r) => r.entity === 'students' && /^\d+$/.test(r.label ?? ''))).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('0500000');
  });
});

describe('H1 — a delegated user manager cannot escalate', () => {
  it('cannot create an organization admin (nothing created)', async () => {
    await signInAs(ids.delegate);
    const r = await users.POST(json('POST', { name: 'x', email: email('rogue-admin'), password: '12345678', role: 'ORG_ADMIN' }));
    expect(r.status).toBe(403);
    expect(await prisma.user.findUnique({ where: { email: email('rogue-admin') } })).toBeNull();
  });

  it('cannot deactivate, demote or edit an admin; the admin stays active with the same session version', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: ids.adminA2 }, select: { isActive: true, role: true, sessionVersion: true } });
    await signInAs(ids.delegate);
    expect((await userById.PATCH(json('PATCH', { isActive: false }), ctx(ids.adminA2))).status).toBe(403);
    expect((await userById.PATCH(json('PATCH', { role: 'STAFF' }), ctx(ids.adminA2))).status).toBe(403);
    expect((await userById.PATCH(json('PATCH', { customRoleId: ids.delegateRole }), ctx(ids.adminA2))).status).toBe(403);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: ids.adminA2 }, select: { isActive: true, role: true, sessionVersion: true } })).toEqual(before);
  });

  it('cannot promote another user to organization admin', async () => {
    await signInAs(ids.delegate);
    expect((await userById.PATCH(json('PATCH', { role: 'ORG_ADMIN' }), ctx(ids.targetStaff))).status).toBe(403);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.targetStaff } })).role).toBe('STAFF');
  });

  it('cannot give anyone (or themselves) capabilities they lack, or edit their own role', async () => {
    await signInAs(ids.delegate);
    expect((await userById.PATCH(json('PATCH', { customRoleId: ids.powerRole }), ctx(ids.targetStaff))).status).toBe(403);
    expect((await userById.PATCH(json('PATCH', { customRoleId: ids.powerRole }), ctx(ids.delegate))).status).toBe(400);
    expect((await roles.POST(json('POST', { name: 'نسخة قوية', permissions: ['settings.manage', 'users.manage'] }))).status).toBe(403);
    expect((await roleById.PATCH(json('PATCH', { permissions: ['users.view', 'users.manage', 'settings.manage', 'finance.manage'] }), ctx(ids.delegateRole))).status).toBe(403);
    expect((await roleById.PATCH(json('PATCH', { permissions: ['users.view'] }), ctx(ids.powerRole))).status).toBe(403);
    expect((await roleById.DELETE(json('DELETE'), ctx(ids.delegateRole))).status).toBe(403);
    const own = await prisma.customRole.findUniqueOrThrow({ where: { id: ids.delegateRole } });
    expect(own.permissions.sort()).toEqual(['users.manage', 'users.view']);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.targetStaff } })).customRoleId).toBeNull();
  });

  it('control: the delegate can still do legitimate work within own capabilities', async () => {
    await signInAs(ids.delegate);
    const created = await users.POST(json('POST', { name: 'new-staff', email: email('new-staff'), password: '12345678', role: 'STAFF' }));
    expect(created.status).toBe(200);
    const sub = await roles.POST(json('POST', { name: 'مشاهد', permissions: ['users.view'] }));
    expect(sub.status).toBe(200);
    const subId = (await sub.json()).id as string;
    expect((await userById.PATCH(json('PATCH', { customRoleId: subId }), ctx(ids.targetStaff))).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.targetStaff } })).sessionVersion).toBeGreaterThan(0);
  });

  it('control: the organization admin keeps full control (create admin, edit powerful roles, deactivate another admin)', async () => {
    await signInAs(ids.adminA);
    expect((await users.POST(json('POST', { name: 'admin-3', email: email('admin-3'), password: '12345678', role: 'ORG_ADMIN' }))).status).toBe(200);
    expect((await roleById.PATCH(json('PATCH', { permissions: ['users.view', 'users.manage', 'settings.manage'] }), ctx(ids.powerRole))).status).toBe(200);
    expect((await userById.PATCH(json('PATCH', { isActive: false }), ctx(ids.adminA2))).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.adminA2 } })).isActive).toBe(false);
  });

  it('another tenant admin still cannot touch this tenant (unchanged isolation)', async () => {
    await signInAs(ids.adminB);
    expect((await userById.PATCH(json('PATCH', { isActive: false }), ctx(ids.staff))).status).toBe(404);
    expect((await roleById.DELETE(json('DELETE'), ctx(ids.powerRole))).status).toBe(404);
  });
});

describe('MAS-043/244 — user and role operations are audited without secrets', () => {
  it('records creation, update and role changes with the actor name', async () => {
    const rows = await prisma.auditLog.findMany({ where: { organizationId: orgA, entity: { in: ['user', 'role'] } } });
    const keys = rows.map((r) => `${r.actorName}:${r.action}:${r.entity}`);
    expect(keys).toContain('delegate:created:user');
    expect(keys).toContain('delegate:created:role');
    expect(keys).toContain('delegate:updated:user');
    expect(keys).toContain('adminA:created:user');
    expect(keys).toContain('adminA:updated:role');
    expect(keys.some((k) => k.endsWith(':updated:user') && k.startsWith('adminA'))).toBe(true);
    const blob = JSON.stringify(rows);
    expect(blob).not.toContain('12345678');
    expect(blob).not.toContain('@example.test');
  });

  it('denied attempts leave no audit row for the denied change', async () => {
    const rows = await prisma.auditLog.findMany({ where: { organizationId: orgA, entity: 'user', label: { contains: 'ORG_ADMIN' } } });
    // الوحيد المسموح: إنشاء admin-3 بيد المدير
    expect(rows.map((r) => r.actorName)).toEqual(['adminA']);
  });
});
