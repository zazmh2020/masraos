import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OtpDelivery } from '../src/lib/otp-delivery';

const mocks = vi.hoisted(() => ({ deliver: vi.fn(), session: vi.fn(), set: vi.fn() }));
vi.mock('@/lib/otp-delivery', () => ({ deliverOtp: mocks.deliver }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.set }) }));
vi.mock('@/lib/session', () => ({ createSession: mocks.session, sessionCookieDomain: () => undefined, tenantDestination: () => '/org/test' }));

dotenv.config({ path: '.env.local', quiet: true });
const db = new URL(process.env.DATABASE_URL ?? '');
if (db.hostname !== '127.0.0.1' || db.port !== '5433' || db.pathname !== '/masra_preview_20261013' || db.username !== 'masra_preview') {
  throw new Error('These integration tests require the isolated preview database.');
}
const { prisma } = await import('../src/lib/prisma');
const { hashOtp, OTP_MAX_ATTEMPTS, OTP_MAX_SENDS } = await import('../src/lib/otp');
const { POST: verify } = await import('../src/app/api/auth/signup/verify/route');
const { POST: resend } = await import('../src/app/api/auth/signup/resend/route');
const ids: string[] = [];
const slugs: string[] = [];
const originalCode = '123456';
const request = (id: string, code?: string) => new Request('http://localhost/api/auth/signup/test', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id, code }),
});
async function fixture(overrides: { attempts?: number; sendCount?: number; expiresAt?: Date; consumedAt?: Date } = {}) {
  const id = randomUUID();
  const slug = `auth-qa-${id.slice(0, 8)}`;
  ids.push(id); slugs.push(slug);
  return prisma.signupRequest.create({ data: {
    id, slug, name: 'Disposable authentication QA', orgName: 'Disposable authentication QA',
    email: `${id}@example.test`, channel: 'EMAIL', passwordHash: 'test-only-not-a-login-hash',
    codeHash: hashOtp(id, originalCode), expiresAt: new Date(Date.now() + 600000),
    lastSentAt: new Date(Date.now() - 61000), ...overrides,
  } });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.deliver.mockImplementation(async (_channel: string, _target: string, code: string): Promise<OtpDelivery> => ({ ok: true, via: 'dev', devCode: code }));
});
afterEach(async () => {
  await prisma.organization.deleteMany({ where: { slug: { in: slugs }, name: 'Disposable authentication QA' } });
  await prisma.signupRequest.deleteMany({ where: { id: { in: ids } } });
  ids.length = 0; slugs.length = 0;
});
afterAll(async () => { await prisma.$disconnect(); });

describe('signup concurrency against PostgreSQL', () => {
  it('accepts only five wrong attempts from twelve simultaneous requests', async () => {
    const row = await fixture();
    const responses = await Promise.all(Array.from({ length: 12 }, () => verify(request(row.id, '000000'))));
    expect(responses.filter(r => r.status === 400)).toHaveLength(OTP_MAX_ATTEMPTS);
    expect(responses.filter(r => r.status === 429)).toHaveLength(7);
    expect((await prisma.signupRequest.findUniqueOrThrow({ where: { id: row.id } })).attempts).toBe(OTP_MAX_ATTEMPTS);
    expect((await verify(request(row.id, originalCode))).status).toBe(429);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('reserves one send from twelve requests at the final send allowance', async () => {
    const row = await fixture({ sendCount: OTP_MAX_SENDS - 1, attempts: OTP_MAX_ATTEMPTS });
    const responses = await Promise.all(Array.from({ length: 12 }, () => resend(request(row.id))));
    expect(responses.filter(r => r.status === 200)).toHaveLength(1);
    expect(responses.filter(r => r.status === 429)).toHaveLength(11);
    expect(mocks.deliver).toHaveBeenCalledOnce();
    const updated = await prisma.signupRequest.findUniqueOrThrow({ where: { id: row.id } });
    expect(updated.sendCount).toBe(OTP_MAX_SENDS);
    expect(updated.attempts).toBe(0);
    await prisma.signupRequest.update({ where: { id: row.id }, data: { lastSentAt: new Date(Date.now() - 61000) } });
    expect((await resend(request(row.id))).status).toBe(429);
    expect(mocks.deliver).toHaveBeenCalledOnce();
  });

  it('invalidates the old code and consumes the new code only once', async () => {
    const row = await fixture();
    const sent = await resend(request(row.id));
    const { devCode } = await sent.json();
    expect(devCode).not.toBe(originalCode);
    expect((await verify(request(row.id, originalCode))).status).toBe(400);
    const responses = await Promise.all(Array.from({ length: 8 }, () => verify(request(row.id, devCode))));
    expect(responses.filter(r => r.status === 200)).toHaveLength(1);
    expect(responses.filter(r => r.status === 400)).toHaveLength(7);
    expect(await prisma.organization.count({ where: { slug: row.slug } })).toBe(1);
    expect(mocks.session).toHaveBeenCalledOnce();
    expect((await resend(request(row.id))).status).toBe(400);
  });

  it('checks expiry after waiting for the row lock', async () => {
    const row = await fixture();
    let release!: () => void;
    let acquired!: () => void;
    const ready = new Promise<void>(resolve => { acquired = resolve; });
    const unlock = new Promise<void>(resolve => { release = resolve; });
    const blocker = prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM signup_requests WHERE id = ${row.id} FOR UPDATE`;
      acquired();
      await unlock;
      await tx.signupRequest.update({ where: { id: row.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    });
    await ready;
    const pending = verify(request(row.id, originalCode));
    // Force the verification request to overlap the transaction that expires it.
    await new Promise(resolve => setTimeout(resolve, 100));
    release(); await blocker;
    expect((await pending).status).toBe(410);
    expect(mocks.session).not.toHaveBeenCalled();
    expect((await resend(request(row.id))).status).toBe(200);
  });

  it('does not hold a database lock during delivery or allow the previous code while sending', async () => {
    const row = await fixture();
    let release!: (result: OtpDelivery) => void;
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    mocks.deliver.mockImplementationOnce(() => { started(); return new Promise<OtpDelivery>(resolve => { release = resolve; }); });
    const pending = resend(request(row.id));
    await ready;
    try {
      expect((await verify(request(row.id, originalCode))).status).toBe(400);
      expect((await resend(request(row.id))).status).toBe(429);
    } finally { release({ ok: false, reason: 'failed' }); }
    expect((await pending).status).toBe(502);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it.each(['failed', 'not_configured', 'throw'] as const)('retains reservation and invalidates old code on delivery %s', async reason => {
    const row = await fixture();
    if (reason === 'throw') mocks.deliver.mockRejectedValueOnce(new Error('simulated provider failure'));
    else mocks.deliver.mockResolvedValueOnce({ ok: false, reason });
    expect((await resend(request(row.id))).status).toBe(reason === 'not_configured' ? 503 : 502);
    expect((await resend(request(row.id))).status).toBe(429);
    expect((await verify(request(row.id, originalCode))).status).toBe(400);
    const updated = await prisma.signupRequest.findUniqueOrThrow({ where: { id: row.id } });
    expect(updated.sendCount).toBe(2);
    expect(updated.codeHash).not.toBe(row.codeHash);
    expect(mocks.deliver).toHaveBeenCalledOnce();
  });

  it('serializes simultaneous verification and resend without reviving a consumed request', async () => {
    const row = await fixture();
    const [verified, sent] = await Promise.all([verify(request(row.id, originalCode)), resend(request(row.id))]);
    const updated = await prisma.signupRequest.findUniqueOrThrow({ where: { id: row.id } });
    if (verified.status === 200) {
      expect(sent.status).toBe(400);
      expect(updated.consumedAt).not.toBeNull();
      expect(mocks.deliver).not.toHaveBeenCalled();
    } else {
      expect(verified.status).toBe(400);
      expect(sent.status).toBe(200);
      expect(updated.consumedAt).toBeNull();
      expect((await verify(request(row.id, (await sent.json()).devCode))).status).toBe(200);
    }
    expect(await prisma.organization.count({ where: { slug: row.slug } })).toBe(1);
  });

  it('rolls back consumption if creating the organization fails', async () => {
    const row = await fixture();
    await prisma.organization.create({ data: { slug: row.slug, name: row.orgName } });
    expect((await verify(request(row.id, originalCode))).status).toBe(409);
    expect((await prisma.signupRequest.findUniqueOrThrow({ where: { id: row.id } })).consumedAt).toBeNull();
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('rejects missing and consumed requests without sending or starting a session', async () => {
    const row = await fixture({ consumedAt: new Date() });
    for (const id of [randomUUID(), row.id]) {
      expect((await verify(request(id, originalCode))).status).toBe(400);
      expect((await resend(request(id))).status).toBe(400);
    }
    expect(mocks.deliver).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
  });
});
