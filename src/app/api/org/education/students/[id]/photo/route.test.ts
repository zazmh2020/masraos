import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
const m = vi.hoisted(() => ({ actor: vi.fn(), student: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn(), configured: vi.fn(), put: vi.fn(), read: vi.fn() }));
vi.mock('@/lib/org', () => ({ getOrgActor: m.actor }));
vi.mock('@/lib/prisma', () => ({ prisma: { student: { findFirst: m.student }, studentRegistration: { update: m.update }, auditLog: { create: m.audit }, $transaction: m.transaction } }));
vi.mock('@/lib/s3', () => ({ isS3Configured: m.configured, putStudentPhoto: m.put, readStudentPhoto: m.read }));
import { GET, POST, DELETE } from './route';
const ctx = { params: Promise.resolve({ id: 's1' }) };
const url = 'https://center.test/api';
describe('private student photo', () => {
  beforeEach(() => { vi.resetAllMocks(); m.actor.mockResolvedValue({ role: 'ORG_ADMIN', name: 'مدير', organization: { id: 'org1' } });
    m.student.mockResolvedValue({ id: 's1', registration: { consentConfirmed: true, photoKey: 'student-photos/org1/s1/p.jpg' } }); m.configured.mockReturnValue(true); });
  it('denies non-admins for every action', async () => {
    m.actor.mockResolvedValue({ role: 'STAFF' });
    for (const action of [GET, POST, DELETE]) expect((await action(new Request(url), ctx)).status).toBe(403);
    expect(m.student).not.toHaveBeenCalled();
  });
  it('denies foreign students and does not read storage', async () => {
    m.student.mockResolvedValue(null);
    expect((await GET(new Request(url), ctx)).status).toBe(404); expect(m.read).not.toHaveBeenCalled();
    expect(m.student).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's1', organizationId: 'org1' } }));
  });
  it('rejects a foreign object key even if stored accidentally', async () => {
    m.student.mockResolvedValue({ id: 's1', registration: { photoKey: 'student-photos/other/s1/p.jpg' } });
    expect((await GET(new Request(url), ctx)).status).toBe(404); expect(m.read).not.toHaveBeenCalled();
  });
  it('does not permit cached public images', async () => {
    m.read.mockResolvedValue(new Uint8Array([1, 2])); const res = await GET(new Request(url), ctx);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('rejects missing consent and unconfigured storage', async () => {
    m.configured.mockReturnValue(false);
    expect((await POST(new Request(url, { method: 'POST', body: 'x' }), ctx)).status).toBe(503);
    m.student.mockResolvedValue({ id: 's1', registration: { consentConfirmed: false } });
    expect((await POST(new Request(url, { method: 'POST', body: 'x' }), ctx)).status).toBe(400);
  });
  it('rejects SVG and oversized data', async () => {
    expect((await POST(new Request(url, { method: 'POST', body: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' }), ctx)).status).toBe(400);
    expect((await POST(new Request(url, { method: 'POST', body: new Uint8Array(2 * 1024 * 1024 + 1) }), ctx)).status).toBe(413);
    expect(m.put).not.toHaveBeenCalled();
  });
  it('decodes and re-encodes supported images to private JPEG objects', async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#777' } }).png().toBuffer();
    expect((await POST(new Request(url, { method: 'POST', body: png }), ctx)).status).toBe(200);
    expect(m.put.mock.calls[0][0]).toMatch(/^student-photos\/org1\/s1\/.+\.jpg$/);
    const metadata = await sharp(m.put.mock.calls[0][1]).metadata();
    expect(metadata.format).toBe('jpeg'); expect(metadata.exif).toBeUndefined();
  });
});
