import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), student: vi.fn(), registration: vi.fn(), transaction: vi.fn(), update: vi.fn(), upsert: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/org', () => ({ getOrgActor: mocks.actor }));
vi.mock('@/lib/prisma', () => ({ prisma: { student: { findFirst: mocks.student, update: mocks.update },
  studentRegistration: { findUnique: mocks.registration, upsert: mocks.upsert },
  auditLog: { create: mocks.audit }, $transaction: mocks.transaction } }));
import { PUT } from './route';
const request = () => new Request('https://center.test/api', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'طالب تجريبي' }) });
const context = { params: Promise.resolve({ id: 'student-a' }) };
describe('registration endpoint', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.actor.mockResolvedValue({ role: 'ORG_ADMIN', name: 'مدير', organization: { id: 'org-a' } }); });
  it('denies unauthorized roles before querying private data', async () => {
    mocks.actor.mockResolvedValue({ role: 'TEACHER', organization: { id: 'org-a' } });
    expect((await PUT(request(), context)).status).toBe(403);
    expect(mocks.student).not.toHaveBeenCalled();
  });
  it('cannot write a student from another institution', async () => {
    mocks.student.mockResolvedValue(null);
    expect((await PUT(request(), context)).status).toBe(404);
    expect(mocks.student).toHaveBeenCalledWith({ where: { id: 'student-a', organizationId: 'org-a' }, select: { id: true } });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('writes registration and audit in one transaction', async () => {
    mocks.student.mockResolvedValue({ id: 'student-a' }); mocks.registration.mockResolvedValue(null);
    expect((await PUT(request(), context)).status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: 'org-a', entity: 'StudentRegistration' }) }));
  });
});
