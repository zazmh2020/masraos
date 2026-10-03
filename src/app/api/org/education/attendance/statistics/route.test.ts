import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ actor: vi.fn(), halls: vi.fn(), roster: vi.fn(), monthly: vi.fn(), students: vi.fn() }));
vi.mock('@/lib/org', () => ({ getOrgActor: m.actor }));
vi.mock('@/lib/prisma', () => ({ prisma: { halaqa: { findMany: m.halls }, attendanceRecord: { findMany: m.roster }, quranDailyRecord: { findMany: m.monthly }, student: { findMany: m.students } } }));
import { GET } from './route';
describe('attendance statistics API isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks(); m.actor.mockResolvedValue({ role: 'ORG_ADMIN', organization: { id: 'org-a' } });
    m.halls.mockResolvedValue([{ id: 'h1', name: 'الحلقة' }]); m.monthly.mockResolvedValue([]); m.students.mockResolvedValue([]);
    m.roster.mockResolvedValue([{ studentId: 's1', halaqaId: 'h1', date: new Date('2026-09-25'), status: 'PRESENT', student: { name: 'PRIVATE NAME' } }]);
  });
  it('denies student/teacher accounts before querying', async () => {
    m.actor.mockResolvedValue({ role: 'TEACHER', organization: { id: 'org-a' } });
    expect((await GET(new Request('https://center.test/api?start=2026-09-25&end=2026-09-25'))).status).toBe(403);
    expect(m.halls).not.toHaveBeenCalled();
  });
  it('rejects excessive periods', async () => {
    expect((await GET(new Request('https://center.test/api?start=2025-01-01&end=2026-09-25'))).status).toBe(400);
  });
  it('filters all data to the current institution and allowed circles', async () => {
    await GET(new Request('https://center.test/api?start=2026-09-25&end=2026-09-25'));
    for (const query of [m.roster, m.monthly, m.students]) expect(query).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-a', halaqaId: { in: ['h1'] } }) }));
  });
  it('does not send student identifiers or names to screen mode', async () => {
    const response = await GET(new Request('https://center.test/api?start=2026-09-25&end=2026-09-25&display=1'));
    const body = await response.json();
    expect(body.total).toBe(1); expect(body).not.toHaveProperty('details');
    expect(JSON.stringify(body)).not.toContain('PRIVATE NAME'); expect(JSON.stringify(body)).not.toContain('studentId');
  });
  it('rejects a foreign circle before reading attendance', async () => {
    m.halls.mockResolvedValue([]);
    expect((await GET(new Request('https://center.test/api?start=2026-09-25&end=2026-09-25&halaqa=foreign'))).status).toBe(404);
    expect(m.roster).not.toHaveBeenCalled();
  });
});
