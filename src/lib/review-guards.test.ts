import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { serializeSession } from './session';
import { POST as consult } from '@/app/api/consultation/route';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('review fixes: demo write protection', () => {
  it('blocks a signed demo even after its unsigned marker is removed', async () => {
    vi.stubEnv('AUTH_SECRET', 'unit-test-only-secret');
    const token = serializeSession({ userId: 'demo', email: 'demo@example.test', name: 'Demo', role: 'ORG_ADMIN', organizationId: 'org', organizationSlug: 'demo', demo: true });
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      const res = proxy(new NextRequest('http://localhost:3000/api/profile', { method, headers: { cookie: `midad_session=${token}` } }));
      expect(res.status).toBe(403);
    }
    expect(proxy(new NextRequest('http://localhost:3000/api/auth/logout', { method: 'POST', headers: { cookie: `midad_session=${token}` } })).status).toBe(200);
    expect(proxy(new NextRequest('http://localhost:3000/api/org/points', { headers: { cookie: `midad_session=${token}` } })).status).toBe(200);
  });
});
describe('consultation delivery must be truthful', () => {
  const request = () => new Request('http://localhost/api/consultation', { method: 'POST', body: JSON.stringify({ name: 'Test', center: 'Test center', phone: 'test-only' }) });
  it('returns unavailable without a configured delivery channel', async () => {
    vi.stubEnv('CONSULT_WEBHOOK_URL', '');
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    expect((await consult(request())).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not claim delivery on non-success or a network failure', async () => {
    vi.stubEnv('CONSULT_WEBHOOK_URL', 'https://example.test/hook');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    expect((await consult(request())).status).toBe(502);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await consult(request())).status).toBe(502);
  });
  it('confirms only a successful delivery response', async () => {
    vi.stubEnv('CONSULT_WEBHOOK_URL', 'https://example.test/hook');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
    expect((await consult(request())).status).toBe(200);
  });
});
