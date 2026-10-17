import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/*
 * اختبارات عزل المؤسسات (IDOR/BOLA) على قاعدة PostgreSQL مؤقتة: مؤسستان حقيقيتان،
 * وجلسة موقّعة حقيقية لمدير المؤسسة A تحاول قراءة/تعديل/حذف/تصدير/تنزيل بيانات المؤسسة B
 * عبر مسارات الـ API الفعلية. بعد كل محاولة نتحقق من بقاء سجل B كما هو — لا رمز الرد وحده.
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

const RUN = randomUUID().slice(0, 8);
type Org = { id: string; slug: string };
let A: Org, B: Org;
const ids: Record<string, string> = {};

const json = (method: string, body?: unknown) => new Request('https://masraos.test/api', {
  method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function signInAs(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { organization: true } });
  jar.token = serializeSession({ userId: u.id, email: u.email, name: u.name, role: u.role, organizationId: u.organizationId, organizationSlug: u.organization?.slug ?? null, sessionVersion: u.sessionVersion });
}

async function seed(label: string): Promise<Org> {
  const org = await prisma.organization.create({ data: { name: `QA ${label}`, slug: `qa-${label.toLowerCase()}-${RUN}`, type: 'MOSQUE' } });
  const p = `${label}_`;
  const admin = await prisma.user.create({ data: { name: `Admin ${label}`, email: `admin-${label}-${RUN}@example.test`, passwordHash: 'not-a-login-hash', role: 'ORG_ADMIN', organizationId: org.id } });
  const halaqa = await prisma.halaqa.create({ data: { name: `Halaqa ${label}`, organizationId: org.id } });
  const student = await prisma.student.create({ data: { name: `Student ${label}`, organizationId: org.id, halaqaId: halaqa.id, guardianPhone: `05000000${label === 'A' ? '01' : '02'}` } });
  const teacher = await prisma.teacher.create({ data: { name: `Teacher ${label}`, organizationId: org.id } });
  const guardian = await prisma.guardian.create({ data: { fullName: `Guardian ${label}`, organizationId: org.id } });
  const task = await prisma.task.create({ data: { title: `Task ${label}`, organizationId: org.id } });
  const fin = await prisma.financeTransaction.create({ data: { kind: 'INCOME', amount: 100, organizationId: org.id } });
  const fee = await prisma.studentFee.create({ data: { title: `Fee ${label}`, amount: 50, organizationId: org.id, studentId: student.id } });
  const mem = await prisma.memorizationEntry.create({ data: { content: `Mem ${label}`, organizationId: org.id, studentId: student.id } });
  const asm = await prisma.assessment.create({ data: { title: `Exam ${label}`, organizationId: org.id, studentId: student.id } });
  const dept = await prisma.department.create({ data: { name: `Dept ${label}`, organizationId: org.id } });
  const doc = await prisma.document.create({ data: { name: `Doc ${label}`, fileKey: `documents/${org.id}/${randomUUID()}-x.pdf`, fileName: 'x.pdf', contentType: 'application/pdf', size: 10, organizationId: org.id } });
  const don = await prisma.donation.create({ data: { donorName: `Donor ${label}`, amount: 10, organizationId: org.id } });
  Object.assign(ids, {
    [`${p}admin`]: admin.id, [`${p}halaqa`]: halaqa.id, [`${p}student`]: student.id, [`${p}teacher`]: teacher.id,
    [`${p}guardian`]: guardian.id, [`${p}task`]: task.id, [`${p}fin`]: fin.id, [`${p}fee`]: fee.id, [`${p}mem`]: mem.id,
    [`${p}asm`]: asm.id, [`${p}dept`]: dept.id, [`${p}doc`]: doc.id, [`${p}don`]: don.id,
  });
  return org;
}

/** لقطة لسجلات المؤسسة B قبل/بعد — أي اختلاف يعني تسربًا. */
async function snapshotB() {
  const [s, h, t, g, k, f, fee, m, a, d, doc, don, u] = await Promise.all([
    prisma.student.findUnique({ where: { id: ids.B_student }, select: { name: true, halaqaId: true, organizationId: true } }),
    prisma.halaqa.findUnique({ where: { id: ids.B_halaqa }, select: { name: true } }),
    prisma.teacher.findUnique({ where: { id: ids.B_teacher }, select: { name: true } }),
    prisma.guardian.findUnique({ where: { id: ids.B_guardian }, select: { fullName: true } }),
    prisma.task.findUnique({ where: { id: ids.B_task }, select: { title: true } }),
    prisma.financeTransaction.findUnique({ where: { id: ids.B_fin }, select: { id: true } }),
    prisma.studentFee.findUnique({ where: { id: ids.B_fee }, select: { title: true } }),
    prisma.memorizationEntry.findUnique({ where: { id: ids.B_mem }, select: { id: true } }),
    prisma.assessment.findUnique({ where: { id: ids.B_asm }, select: { id: true } }),
    prisma.department.findUnique({ where: { id: ids.B_dept }, select: { name: true } }),
    prisma.document.findUnique({ where: { id: ids.B_doc }, select: { id: true } }),
    prisma.donation.findUnique({ where: { id: ids.B_don }, select: { donorName: true } }),
    prisma.user.findUnique({ where: { id: ids.B_admin }, select: { role: true, isActive: true, organizationId: true } }),
  ]);
  return JSON.stringify({ s, h, t, g, k, f, fee, m, a, d, doc, don, u });
}

let baseline = '';
beforeAll(async () => {
  A = await seed('A');
  B = await seed('B');
  baseline = await snapshotB();
  await signInAs(ids.A_admin);
});
afterAll(async () => {
  await prisma.organization.deleteMany({ where: { id: { in: [A?.id, B?.id].filter(Boolean) } } });
  await prisma.$disconnect();
});

const denied = (status: number) => expect([400, 403, 404]).toContain(status);

describe('cross-tenant writes and deletes are refused (org A admin -> org B records)', () => {
  const cases: [string, string, string, unknown][] = [
    ['education/students/[id]', 'PATCH', 'B_student', { name: 'hacked' }],
    ['education/students/[id]', 'DELETE', 'B_student', undefined],
    ['education/halaqat/[id]', 'PATCH', 'B_halaqa', { name: 'hacked' }],
    ['education/halaqat/[id]', 'DELETE', 'B_halaqa', undefined],
    ['education/teachers/[id]', 'PATCH', 'B_teacher', { name: 'hacked' }],
    ['education/teachers/[id]', 'DELETE', 'B_teacher', undefined],
    ['education/guardians/[id]', 'PATCH', 'B_guardian', { fullName: 'hacked' }],
    ['education/guardians/[id]', 'DELETE', 'B_guardian', undefined],
    ['education/memorization/[id]', 'DELETE', 'B_mem', undefined],
    ['education/assessments/[id]', 'DELETE', 'B_asm', undefined],
    ['tasks/[id]', 'PATCH', 'B_task', { title: 'hacked' }],
    ['tasks/[id]', 'DELETE', 'B_task', undefined],
    ['finance/[id]', 'DELETE', 'B_fin', undefined],
    ['fees/[id]', 'PATCH', 'B_fee', { title: 'hacked' }],
    ['fees/[id]', 'DELETE', 'B_fee', undefined],
    ['departments/[id]', 'PATCH', 'B_dept', { name: 'hacked' }],
    ['departments/[id]', 'DELETE', 'B_dept', undefined],
    ['donations/[id]', 'PATCH', 'B_don', { donorName: 'hacked' }],
    ['donations/[id]', 'DELETE', 'B_don', undefined],
    ['documents/[id]', 'DELETE', 'B_doc', undefined],
    ['users/[id]', 'PATCH', 'B_admin', { role: 'STAFF', isActive: false }],
    ['education/students/[id]/registration', 'PUT', 'B_student', { student: { name: 'hacked' } }],
  ];
  it('control: the same session CAN modify its own organization records (so the denials are meaningful)', async () => {
    const mod = await import('../src/app/api/org/education/halaqat/[id]/route');
    const res: Response = await mod.PATCH(json('PATCH', { name: 'Halaqa A renamed' }), ctx(ids.A_halaqa));
    expect(res.status).toBe(200);
    expect((await prisma.halaqa.findUniqueOrThrow({ where: { id: ids.A_halaqa } })).name).toBe('Halaqa A renamed');
  });

  for (const [route, method, key, body] of cases) {
    it(`${method} ${route} on org B`, async () => {
      const mod = await import(`../src/app/api/org/${route}/route`);
      const res: Response = await mod[method](json(method, body), ctx(ids[key]));
      denied(res.status);
      expect(await snapshotB()).toBe(baseline);
    });
  }
});

describe('cross-tenant reads, exports and files are refused', () => {
  it('cannot download another organization document', async () => {
    const { GET } = await import('../src/app/api/org/documents/[id]/download/route');
    expect((await GET(json('GET'), ctx(ids.B_doc))).status).toBe(404);
  });

  it('cannot read another organization student photo', async () => {
    const { GET } = await import('../src/app/api/org/education/students/[id]/photo/route');
    denied((await GET(json('GET'), ctx(ids.B_student))).status);
  });

  it('cannot export another organization student registration', async () => {
    const { POST } = await import('../src/app/api/org/education/students/[id]/registration/export/route');
    denied((await POST(json('POST', { mode: 'print' }), ctx(ids.B_student))).status);
  });

  it('CSV export contains only the caller organization', async () => {
    const { GET } = await import('../src/app/api/org/export/route');
    const csv = await (await GET(new Request('https://masraos.test/api/org/export?type=students'))).text();
    expect(csv).toContain('Student A');
    expect(csv).not.toContain('Student B');
    const don = await (await GET(new Request('https://masraos.test/api/org/export?type=donations'))).text();
    expect(don).toContain('Donor A');
    expect(don).not.toContain('Donor B');
  });
});

describe('cross-tenant creation through foreign references is refused', () => {
  const creates: [string, unknown][] = [
    ['education/memorization', { studentId: 'B_student', content: 'x', kind: 'NEW', date: '2026-10-01' }],
    ['education/assessments', { studentId: 'B_student', title: 'x', score: 1, maxScore: 10, date: '2026-10-01' }],
    ['fees', { studentId: 'B_student', title: 'x', amount: 10 }],
    ['education/students', { name: 'Injected', halaqaId: 'B_halaqa' }],
    ['education/attendance', { halaqaId: 'B_halaqa', date: '2026-10-01', records: [{ studentId: 'B_student', status: 'PRESENT' }] }],
    ['tasks', { title: 'x', assigneeId: 'B_admin' }],
    ['tasks', { title: 'x', departmentId: 'B_dept' }],
  ];
  for (const [route, raw] of creates) {
    it(`POST ${route} with an org B reference`, async () => {
      const body = JSON.parse(JSON.stringify(raw), (_k, v) => (typeof v === 'string' && ids[v] ? ids[v] : v));
      const before = {
        mem: await prisma.memorizationEntry.count({ where: { studentId: ids.B_student } }),
        asm: await prisma.assessment.count({ where: { studentId: ids.B_student } }),
        fee: await prisma.studentFee.count({ where: { studentId: ids.B_student } }),
        att: await prisma.attendanceRecord.count({ where: { studentId: ids.B_student } }),
        inB: await prisma.student.count({ where: { halaqaId: ids.B_halaqa } }),
        tasksA: await prisma.task.count({ where: { organizationId: A.id } }),
      };
      const { POST } = await import(`../src/app/api/org/${route}/route`);
      denied((await POST(json('POST', body))).status);
      const after = {
        mem: await prisma.memorizationEntry.count({ where: { studentId: ids.B_student } }),
        asm: await prisma.assessment.count({ where: { studentId: ids.B_student } }),
        fee: await prisma.studentFee.count({ where: { studentId: ids.B_student } }),
        att: await prisma.attendanceRecord.count({ where: { studentId: ids.B_student } }),
        inB: await prisma.student.count({ where: { halaqaId: ids.B_halaqa } }),
        tasksA: await prisma.task.count({ where: { organizationId: A.id } }),
      };
      expect(after).toEqual(before);
    });
  }

  it('guardian linking ignores students of another organization', async () => {
    const { POST } = await import('../src/app/api/org/education/guardians/route');
    const res = await POST(json('POST', { fullName: 'Guardian injected', studentIds: [ids.B_student, ids.A_student] }));
    expect(res.status).toBeLessThan(500);
    const b = await prisma.student.findUniqueOrThrow({ where: { id: ids.B_student }, select: { guardianId: true } });
    expect(b.guardianId).toBeNull();
  });
});

describe('privilege boundaries inside one organization', () => {
  it('a staff member cannot promote themselves or deactivate the admin', async () => {
    const staff = await prisma.user.create({ data: { name: 'Staff A', email: `staff-a-${RUN}@example.test`, passwordHash: 'not-a-login-hash', role: 'STAFF', organizationId: A.id } });
    await signInAs(staff.id);
    try {
      const { PATCH } = await import('../src/app/api/org/users/[id]/route');
      expect((await PATCH(json('PATCH', { role: 'ORG_ADMIN' }), ctx(staff.id))).status).toBe(403);
      expect((await PATCH(json('PATCH', { isActive: false }), ctx(ids.A_admin))).status).toBe(403);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: staff.id } })).role).toBe('STAFF');
      expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.A_admin } })).isActive).toBe(true);
    } finally {
      await signInAs(ids.A_admin);
    }
  });

  it('a session for a user moved to another organization stops working', async () => {
    const mover = await prisma.user.create({ data: { name: 'Mover', email: `mover-${RUN}@example.test`, passwordHash: 'not-a-login-hash', role: 'ORG_ADMIN', organizationId: A.id } });
    await signInAs(mover.id); // جلسة صادرة له أثناء انتمائه للمؤسسة A
    await prisma.user.update({ where: { id: mover.id }, data: { organizationId: B.id } });
    try {
      const { GET } = await import('../src/app/api/org/export/route');
      expect((await GET(new Request('https://masraos.test/api/org/export?type=students'))).status).toBe(403);
    } finally {
      await signInAs(ids.A_admin);
    }
  });

  it('a forged session cookie is rejected', async () => {
    const saved = jar.token;
    jar.token = `${saved.split('.')[0]}.forged-signature`;
    try {
      const { GET } = await import('../src/app/api/org/export/route');
      expect((await GET(new Request('https://masraos.test/api/org/export?type=students'))).status).toBe(403);
    } finally {
      jar.token = saved;
    }
  });
});
