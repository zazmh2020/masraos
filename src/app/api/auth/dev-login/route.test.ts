import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), createSession: vi.fn(), set: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.set }) }));
vi.mock('@/lib/session', () => ({ createSession: mocks.createSession, sessionCookieDomain: () => undefined, tenantDestination: () => 'http://localhost:3017/org/test', DEMO_COOKIE: 'midad_demo' }));
import { GET } from './route';
import { GET as demo } from '../demo/route';

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('passwordless development access', () => {
  it.each([undefined, '0', '1'])('blocks production before database or cookie access with flag %s', async (flag) => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_DEMO_LOGIN', flag);
    for (const role of ['PLATFORM_OWNER', 'ORG_ADMIN', 'TEACHER', 'MEMBER', 'EMPLOYEE', 'SUPERVISOR']) {
      mocks.findUnique.mockResolvedValue({ id: 'test', role });
      const response = await GET(new Request(`http://localhost/api/auth/dev-login?email=${role}@example.test`));
      expect(response.status).toBe(404);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it('preserves development login', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.findUnique.mockResolvedValue({ id: 'test', role: 'ORG_ADMIN', organization: { slug: 'test' } });
    expect((await GET(new Request('http://localhost/api/auth/dev-login?email=local@example.test'))).status).toBe(307);
    expect(mocks.createSession).toHaveBeenCalledOnce();
  });

  it('keeps public demo separate, fixed to the configured account and marked read-only', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DEMO_LOGIN_EMAIL', 'demo@example.test');
    mocks.findUnique.mockResolvedValue({ id: 'demo', role: 'ORG_ADMIN', organization: { slug: 'test' } });
    expect((await demo(new Request('http://localhost/api/auth/demo?email=owner@example.test'))).status).toBe(307);
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'demo@example.test' } }));
    expect(mocks.createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: 'demo', demo: true }), true, undefined);
  });
});
