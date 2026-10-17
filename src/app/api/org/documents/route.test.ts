import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ actor: vi.fn(), unique: vi.fn(), dept: vi.fn(), create: vi.fn(), configured: vi.fn(), stat: vi.fn(), head: vi.fn(), del: vi.fn(), presign: vi.fn() }));
vi.mock('@/lib/org', () => ({ getOrgActor: m.actor }));
vi.mock('@/lib/prisma', () => ({ prisma: { document: { findUnique: m.unique, create: m.create }, department: { findFirst: m.dept } } }));
vi.mock('@/lib/s3', () => ({
  isS3Configured: m.configured, statObject: m.stat, readObjectHead: m.head, deleteObject: m.del, presignUpload: m.presign,
  orgObjectPrefix: (orgId: string) => `documents/${orgId}/`,
}));
import { POST as register } from './route';
import { POST as presign } from './presign/route';

const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const KEY = `documents/org1/${UUID}-report.pdf`;
const PDF = new TextEncoder().encode('%PDF-1.7\n');
const req = (body: unknown) => new Request('https://center.test/api/org/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const doc = (over: Record<string, unknown> = {}) => ({ name: 'تقرير', key: KEY, fileName: 'report.pdf', contentType: 'application/pdf', size: 1000, ...over });

describe('document upload security', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'u1', role: 'ORG_ADMIN', organization: { id: 'org1' } });
    m.configured.mockReturnValue(true);
    m.unique.mockResolvedValue(null);
    m.stat.mockResolvedValue({ size: 1000, contentType: 'application/pdf' });
    m.head.mockResolvedValue(PDF);
    m.create.mockResolvedValue({ id: 'd1' });
    m.presign.mockResolvedValue('https://s3.test/upload');
    m.del.mockResolvedValue(undefined);
  });

  it('presign refuses disallowed types and signs the exact type and size', async () => {
    expect((await presign(req({ fileName: 'x.html', contentType: 'text/html', size: 10 }))).status).toBe(415);
    expect((await presign(req({ fileName: 'x.svg', contentType: 'image/svg+xml', size: 10 }))).status).toBe(415);
    expect((await presign(req({ fileName: 'big.pdf', contentType: 'application/pdf', size: 25 * 1024 * 1024 + 1 }))).status).toBe(400);
    const ok = await presign(req({ fileName: '../../x.pdf', contentType: '', size: 10 }));
    expect(ok.status).toBe(200);
    const [key, type, size] = m.presign.mock.calls[0];
    expect(key).toMatch(new RegExp(`^documents/org1/[0-9a-f-]{36}-[^/]+$`));
    expect(key).not.toContain('..');
    expect([type, size]).toEqual(['application/pdf', 10]);
  });

  it('registers a verified file under the caller organization', async () => {
    const res = await register(req(doc()));
    expect(res.status).toBe(200);
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: 'org1', fileKey: KEY, contentType: 'application/pdf', size: 1000 }) }));
  });

  it('refuses a key belonging to another organization or a traversal key', async () => {
    expect((await register(req(doc({ key: `documents/org2/${UUID}-report.pdf` })))).status).toBe(400);
    expect((await register(req(doc({ key: `documents/org1/../org2/${UUID}-r.pdf` })))).status).toBe(400);
    expect(m.stat).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });

  it('rejects and deletes an upload whose real size differs from the declared size', async () => {
    m.stat.mockResolvedValue({ size: 900_000_000, contentType: 'application/pdf' });
    expect((await register(req(doc()))).status).toBe(422);
    expect(m.del).toHaveBeenCalledWith(KEY);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('rejects and deletes HTML disguised as PDF (signature check)', async () => {
    m.head.mockResolvedValue(new TextEncoder().encode('<html><script>steal()</script>'));
    expect((await register(req(doc()))).status).toBe(422);
    expect(m.del).toHaveBeenCalledWith(KEY);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('rejects metadata for a file that was never uploaded', async () => {
    m.stat.mockResolvedValue(null);
    expect((await register(req(doc()))).status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('denies members without document permission before touching storage', async () => {
    m.actor.mockResolvedValue({ id: 'u2', role: 'MEMBER', organization: { id: 'org1' } });
    expect((await register(req(doc()))).status).toBe(403);
    expect((await presign(req({ fileName: 'a.pdf', size: 10 }))).status).toBe(403);
    expect(m.stat).not.toHaveBeenCalled();
    expect(m.presign).not.toHaveBeenCalled();
  });
});
