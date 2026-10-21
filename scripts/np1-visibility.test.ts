import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/*
 * NP1 — الحقول الحساسة لا تظهر إلا بقدرة صريحة (MAS-339/430): هاتف الطالب وهاتف/بريد الولي،
 * الرقم الوطني للمستفيد، وهوية المتبرع. على PostgreSQL مؤقتة بجلسات وأدوار حقيقية؛
 * تُستدعى المسارات (التصدير، البحث، صندوق الإشعارات، تعديل المستفيد).
 */
if (process.env.MASRA_DISPOSABLE_DB !== '1') throw new Error('Run only against a disposable test database (MASRA_DISPOSABLE_DB=1).');
process.env.AUTH_SECRET ??= 'disposable-test-secret-not-used-anywhere-else';

const jar = vi.hoisted(() => ({ token: '' }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'midad_session' && jar.token ? { value: jar.token } : undefined), set: () => undefined }),
  headers: async () => new Headers(),
}));
// صندوق الإشعارات يترجم عبر i18n الخادم (يعتمد على next/headers وملفات تعريف الارتباط)
vi.mock('../src/lib/i18n/server', () => ({
  getT: async () => ({ t: (k: string, v?: Record<string, string>) => `${k}|${v?.name ?? ''}`, locale: 'ar' }),
  getLocale: async () => 'ar',
}));

const { prisma } = await import('../src/lib/prisma');
const { serializeSession } = await import('../src/lib/session');
const { getOrgActor } = await import('../src/lib/org');
const { searchOrg } = await import('../src/lib/org-search');
const { getOrgInbox } = await import('../src/lib/inbox');
const exportRoute = await import('../src/app/api/org/export/route');
const benById = await import('../src/app/api/org/beneficiaries/[id]/route');

const RUN = randomUUID().slice(0, 8);
const ids: Record<string, string> = {};
let orgA = '';

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

beforeAll(async () => {
  orgA = (await prisma.organization.create({ data: { name: 'NP1 A', slug: `np1-a-${RUN}`, type: 'MOSQUE', plan: 'ENTERPRISE' } })).id;
  const mk = async (key: string, role: 'ORG_ADMIN' | 'STAFF' | 'TEACHER', extra: Record<string, unknown> = {}) => {
    ids[key] = (await prisma.user.create({ data: { name: key, email: `${key}-${RUN}@example.test`, passwordHash: 'not-a-login-hash', role, organizationId: orgA, ...extra } })).id;
  };
  const viewOnly = await prisma.customRole.create({ data: { name: 'اطلاع بلا حساس', permissions: ['education.view', 'donations.view', 'beneficiaries.view', 'beneficiaries.manage'], organizationId: orgA } });
  const withSensitive = await prisma.customRole.create({ data: { name: 'اطلاع مع حساس', permissions: ['education.view', 'donations.view', 'beneficiaries.view', 'beneficiaries.manage', 'students.contact', 'donations.donors', 'beneficiaries.sensitive'], organizationId: orgA } });
  await mk('admin', 'ORG_ADMIN');
  await mk('staff', 'STAFF');
  await mk('teacher', 'TEACHER');
  await mk('viewer', 'STAFF', { customRoleId: viewOnly.id });
  await mk('sensitive', 'STAFF', { customRoleId: withSensitive.id });

  const teacherRec = await prisma.teacher.create({ data: { name: 'Teacher', organizationId: orgA, userId: ids.teacher } });
  const h1 = await prisma.halaqa.create({ data: { name: 'حلقة', organizationId: orgA, teacherId: teacherRec.id } });
  await prisma.student.create({ data: { name: 'طالب الاختبار', organizationId: orgA, halaqaId: h1.id, phone: '0599999001', guardianName: 'ولي', guardianPhone: '0500000333', guardianEmail: 'guardian@contact.test' } });
  await prisma.donation.create({ data: { donorName: 'متبرع اسمه سري', amount: 777, organizationId: orgA } });
  ids.ben = (await prisma.beneficiary.create({ data: { name: 'مستفيد', nationalId: 'NID-123456', organizationId: orgA } })).id;
});
afterAll(async () => {
  await prisma.organization.deleteMany({ where: { id: orgA } });
  await prisma.$disconnect();
});

describe('student and guardian contacts need students.contact', () => {
  it('a custom role with education.view but no contact capability exports empty contact columns', async () => {
    await signInAs(ids.viewer);
    const res = await exportRoute.GET(get('/api/org/export?type=students'));
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain('طالب الاختبار');
    expect(csv).not.toMatch(/0599999001|0500000333|guardian@contact\.test/);
  });

  it('control: admin, staff, a role that lists the capability, and the teacher (own halaqat) still get the contacts', async () => {
    for (const key of ['admin', 'staff', 'sensitive', 'teacher']) {
      await signInAs(ids[key]);
      const csv = await (await exportRoute.GET(get('/api/org/export?type=students'))).text();
      expect(csv, key).toContain('0500000333');
      expect(csv, key).toContain('guardian@contact.test');
    }
  });
});

describe('donor identity needs donations.donors', () => {
  it('a donations.view role without it sees the amount but not the name, in export, search and inbox', async () => {
    await signInAs(ids.viewer);
    const csv = await (await exportRoute.GET(get('/api/org/export?type=donations'))).text();
    expect(csv).toContain('777');
    expect(csv).not.toContain('متبرع اسمه سري');

    const found = await searchOrg(await actorOf('viewer'), orgA, 'متبرع');
    expect(found.donations).toEqual([]); // لا بحث باسم المتبرع: يكشف وجوده

    const inbox = await getOrgInbox(orgA, await actorOf('viewer'));
    expect(JSON.stringify(inbox)).not.toContain('متبرع اسمه سري');
    expect(JSON.stringify(inbox)).toContain('inbox.newDonation|متبرع');
  });

  it('control: staff and a role with the capability still see donors everywhere', async () => {
    for (const key of ['staff', 'sensitive', 'admin']) {
      const a = await actorOf(key);
      expect((await searchOrg(a, orgA, 'متبرع')).donations.length, key).toBe(1);
      expect(JSON.stringify(await getOrgInbox(orgA, a)), key).toContain('متبرع اسمه سري');
      const csv = await (await exportRoute.GET(get('/api/org/export?type=donations'))).text();
      expect(csv, key).toContain('متبرع اسمه سري');
    }
  });
});

describe('beneficiary national id needs beneficiaries.sensitive', () => {
  it('a manager without the capability cannot overwrite or blank the id they cannot see', async () => {
    await signInAs(ids.viewer);
    expect((await benById.PATCH(json('PATCH', { nationalId: 'HACK-1', notes: 'مدوّنة' }), ctx(ids.ben))).status).toBe(200);
    expect((await benById.PATCH(json('PATCH', { nationalId: '' }), ctx(ids.ben))).status).toBe(400); // لا تغيير فعلي بعد تجاهل الحقل
    const row = await prisma.beneficiary.findUniqueOrThrow({ where: { id: ids.ben } });
    expect(row.nationalId).toBe('NID-123456');
    expect(row.notes).toBe('مدوّنة'); // بقية الحقول تُحفظ
  });

  it('control: with the capability the id can be edited', async () => {
    await signInAs(ids.sensitive);
    expect((await benById.PATCH(json('PATCH', { nationalId: 'NID-654321' }), ctx(ids.ben))).status).toBe(200);
    expect((await prisma.beneficiary.findUniqueOrThrow({ where: { id: ids.ben } })).nationalId).toBe('NID-654321');
  });
});
