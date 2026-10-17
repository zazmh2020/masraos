import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * اختبارات تكامل على قاعدة PostgreSQL مؤقتة فقط: حماية الدخول من التخمين واستعادة كلمة المرور.
 * تُشغَّل عبر غلاف يضبط DATABASE_URL لقاعدة اختبار ويضع MASRA_DISPOSABLE_DB=1 بعد التحقق
 * أنها ليست قاعدة .env أو .env.local. بيانات وهمية تُحذف بعد الاختبارات.
 */
if (process.env.MASRA_DISPOSABLE_DB !== '1') throw new Error('Run only against a disposable test database (MASRA_DISPOSABLE_DB=1).');
process.env.AUTH_SECRET ??= 'disposable-test-secret-not-used-anywhere-else';

const mocks = vi.hoisted(() => ({ session: vi.fn(), send: vi.fn(), report: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: vi.fn() }) }));
vi.mock('@/lib/session', () => ({ createSession: mocks.session, sessionCookieDomain: () => undefined, tenantDestination: () => '/org/test' }));
vi.mock('@/lib/email', () => ({ sendEmail: mocks.send, emailConfigured: () => true }));
vi.mock('@/lib/observe', () => ({ reportError: mocks.report }));

const { prisma } = await import('../src/lib/prisma');
const { hit, blockedFor } = await import('../src/lib/auth-throttle');
const { POST: login } = await import('../src/app/api/auth/login/route');
const { POST: forgot } = await import('../src/app/api/auth/password/forgot/route');
const { POST: reset } = await import('../src/app/api/auth/password/reset/route');
const { hashResetToken, issueResetToken } = await import('../src/lib/password-reset');

const RUN = randomUUID().slice(0, 8);
const PASSWORD = `Correct-${RUN}-pw`;
let orgId = '';
const emails: string[] = [];
let ipCounter = 0;
const nextIp = () => `198.51.100.${(ipCounter++ % 250) + 1}`; // نطاق توثيقي غير حقيقي

const post = (body: unknown, ip: string) => new Request('http://localhost/api/test', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(body),
});

async function makeUser(over: { isActive?: boolean } = {}) {
  const email = `qa-${RUN}-${emails.length}@example.test`;
  emails.push(email);
  return prisma.user.create({ data: { email, name: 'Disposable QA', role: 'STAFF', organizationId: orgId, passwordHash: await bcrypt.hash(PASSWORD, 12), ...over } });
}

beforeAll(async () => {
  const org = await prisma.organization.create({ data: { name: 'Disposable QA org', slug: `qa-auth-${RUN}` } });
  orgId = org.id;
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.send.mockResolvedValue({ ok: true });
});
afterAll(async () => {
  await prisma.organization.deleteMany({ where: { id: orgId } }); // يحذف المستخدمين والرموز (cascade)
  await prisma.authThrottle.deleteMany({});
  await prisma.$disconnect();
});

describe('central throttle store (PostgreSQL)', () => {
  it('counts concurrent failures atomically and blocks after the limit', async () => {
    const key = `test:${RUN}:concurrent`;
    const rule = { limit: 5, windowSec: 900, blockSec: 900 };
    const results = await Promise.all(Array.from({ length: 20 }, () => hit(key, rule)));
    expect(Math.max(...results.map((r) => r.count))).toBe(20); // لا عدّاد ضائع تحت التزامن
    expect(results.filter((r) => !r.blocked)).toHaveLength(4); // المحاولة الخامسة تُقفل ما بعدها
    expect(await blockedFor([key])).toBeGreaterThan(800);
  });

  it('starts a fresh window after it expires', async () => {
    const key = `test:${RUN}:window`;
    const rule = { limit: 2, windowSec: 1, blockSec: 1 };
    await hit(key, rule); await hit(key, rule);
    await new Promise((r) => setTimeout(r, 1200));
    expect((await hit(key, rule)).count).toBe(1);
  });
});

describe('login brute-force protection', () => {
  it('blocks the account from that address after 5 failures — even with the right password', async () => {
    const user = await makeUser();
    const ip = nextIp();
    for (let i = 0; i < 5; i++) expect((await login(post({ email: user.email, password: 'wrong' }, ip))).status).toBe(401);
    const blocked = await login(post({ email: user.email, password: PASSWORD }, ip));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('does not lock the account for the owner on another address after a per-address block', async () => {
    const user = await makeUser();
    const attacker = nextIp();
    for (let i = 0; i < 6; i++) await login(post({ email: user.email, password: 'wrong' }, attacker));
    expect((await login(post({ email: user.email, password: PASSWORD }, nextIp()))).status).toBe(200);
  });

  it('clears the counters after a successful login', async () => {
    const user = await makeUser();
    const ip = nextIp();
    for (let i = 0; i < 4; i++) await login(post({ email: user.email, password: 'wrong' }, ip));
    expect((await login(post({ email: user.email, password: PASSWORD }, ip))).status).toBe(200);
    for (let i = 0; i < 4; i++) expect((await login(post({ email: user.email, password: 'wrong' }, ip))).status).toBe(401);
  });

  it('keeps login available (and reports loudly) if the throttle migration was not applied yet', async () => {
    const user = await makeUser();
    await prisma.$executeRawUnsafe('ALTER TABLE "auth_throttles" RENAME TO "auth_throttles_hidden"');
    try {
      expect((await login(post({ email: user.email, password: 'wrong' }, nextIp()))).status).toBe(401);
      expect((await login(post({ email: user.email, password: PASSWORD }, nextIp()))).status).toBe(200);
      expect(mocks.report).toHaveBeenCalledWith(expect.objectContaining({ where: 'auth-throttle' }));
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE "auth_throttles_hidden" RENAME TO "auth_throttles"');
    }
  });

  it('answers unknown and known emails the same way and with comparable timing', async () => {
    const user = await makeUser();
    const t0 = Date.now(); const a = await login(post({ email: `nobody-${RUN}@example.test`, password: 'x' }, nextIp())); const unknownMs = Date.now() - t0;
    const t1 = Date.now(); const b = await login(post({ email: user.email, password: 'x' }, nextIp())); const knownMs = Date.now() - t1;
    expect([a.status, b.status]).toEqual([401, 401]);
    expect(await a.json()).toEqual(await b.json());
    expect(unknownMs).toBeGreaterThan(knownMs * 0.5); // تجزئة وهمية: لا رد فوري للبريد غير المسجّل
  });
});

describe('password reset', () => {
  it('gives the same answer for registered and unknown emails and never returns the link', async () => {
    const user = await makeUser();
    const known = await forgot(post({ email: user.email }, nextIp()));
    const unknown = await forgot(post({ email: `ghost-${RUN}@example.test` }, nextIp()));
    expect(await known.json()).toEqual(await unknown.json());
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(await (await forgot(post({ email: user.email }, nextIp()))).json())).not.toContain('token');
  });

  it('stores only a hash of the token and builds the link from the configured domain', async () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = 'masraos.example';
    const user = await makeUser();
    await forgot(new Request('http://evil.example/api', { method: 'POST', headers: { 'Content-Type': 'application/json', Host: 'evil.example', 'X-Forwarded-For': nextIp() }, body: JSON.stringify({ email: user.email }) }));
    const link: string = mocks.send.mock.calls[0][0].html.match(/href="([^"]+)"/)[1];
    expect(new URL(link).host).toBe('masraos.example'); // لا حقن مضيف
    const token = new URL(link).searchParams.get('token')!;
    const row = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.tokenHash).toBe(hashResetToken(token));
    expect(row.tokenHash).not.toContain(token);
    expect(row.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30 * 60 * 1000);
    delete process.env.NEXT_PUBLIC_APP_DOMAIN;
  });

  it('resets once, invalidates all sessions, and refuses reuse', async () => {
    const user = await makeUser();
    const token = await issueResetToken(user.id);
    expect((await reset(post({ token, password: 'New-password-123' }, nextIp()))).status).toBe(200);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.sessionVersion).toBe(user.sessionVersion + 1);
    expect(await bcrypt.compare('New-password-123', after.passwordHash)).toBe(true);
    expect((await reset(post({ token, password: 'Another-password-1' }, nextIp()))).status).toBe(400);
  });

  it('lets only one of two concurrent requests use the same token', async () => {
    const user = await makeUser();
    const token = await issueResetToken(user.id);
    const results = await Promise.all([1, 2].map((n) => reset(post({ token, password: `Concurrent-${n}-pass` }, nextIp()))));
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
  });

  it('rejects expired tokens, superseded tokens and weak passwords', async () => {
    const user = await makeUser();
    const old = await issueResetToken(user.id);
    const current = await issueResetToken(user.id); // يبطل السابق
    expect((await reset(post({ token: old, password: 'Valid-password-1' }, nextIp()))).status).toBe(400);
    expect((await reset(post({ token: current, password: 'short' }, nextIp()))).status).toBe(400);
    await prisma.passwordResetToken.updateMany({ where: { tokenHash: hashResetToken(current) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await reset(post({ token: current, password: 'Valid-password-1' }, nextIp()))).status).toBe(400);
  });

  it('does not reset suspended accounts', async () => {
    const user = await makeUser({ isActive: false });
    const token = await issueResetToken(user.id);
    expect((await reset(post({ token, password: 'Valid-password-1' }, nextIp()))).status).toBe(400);
    mocks.send.mockClear();
    await forgot(post({ email: user.email }, nextIp()));
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('limits repeated reset requests per email without revealing it', async () => {
    const user = await makeUser();
    const responses = [];
    for (let i = 0; i < 5; i++) responses.push(await (await forgot(post({ email: user.email }, nextIp()))).json());
    expect(new Set(responses.map((r) => JSON.stringify(r))).size).toBe(1);
    expect(mocks.send).toHaveBeenCalledTimes(3); // الحد: 3 رسائل في الساعة للبريد
  });

  it('throttles token guessing from one address', async () => {
    const ip = nextIp();
    const statuses = [];
    for (let i = 0; i < 22; i++) statuses.push((await reset(post({ token: `guess-${i}-${'x'.repeat(30)}`, password: 'Valid-password-1' }, ip))).status);
    expect(statuses.slice(0, 20).every((s) => s === 400)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
