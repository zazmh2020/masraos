import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSession, serializeSession, type SessionData } from './session';

const secret = 'test-only-session-key';
const user: SessionData = { userId: 'u1', email: 'test@example.test', name: 'Test', role: 'TEACHER', organizationId: 'o1', organizationSlug: 'center', sessionVersion: 0 };
const signed = (data: unknown) => {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
};
beforeEach(() => { vi.stubEnv('AUTH_SECRET', secret); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-05T00:00:00Z')); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('server-enforced session lifetime', () => {
  it('accepts a newly issued signed session', () => { expect(parseSession(serializeSession(user))).toMatchObject(user); });
  it('accepts just before expiry and rejects at expiry', () => {
    const token = serializeSession(user);
    vi.advanceTimersByTime(7 * 86400 * 1000 - 1000);
    expect(parseSession(token)).not.toBeNull();
    vi.advanceTimersByTime(1000);
    expect(parseSession(token)).toBeNull();
  });
  it('rejects legacy sessions without signed timestamps', () => { expect(parseSession(signed(user))).toBeNull(); });
  it('rejects tampered or malformed signatures', () => {
    const token = serializeSession(user);
    expect(parseSession(`${token}x`)).toBeNull();
    expect(parseSession('invalid')).toBeNull();
    expect(parseSession('a'.repeat(8193))).toBeNull();
  });
  it('rejects a session after signing-key rotation', () => {
    const token = serializeSession(user); vi.stubEnv('AUTH_SECRET', 'rotated-test-key');
    expect(parseSession(token)).toBeNull();
  });
  it.each([null, [], 'text', 7])('rejects non-object signed payload %j', data => { expect(parseSession(signed(data))).toBeNull(); });
  it.each([
    { userId: '' }, { role: 'INVALID_ROLE' }, { demo: 'false' }, { organizationSlug: null },
    { expiresAt: 0 }, { issuedAt: 9999999999 }, { expiresAt: 9999999999 }, { issuedAt: 1.5 },
    { sessionVersion: -1 }, { sessionVersion: 1.5 }, { sessionVersion: '0' }, { sessionVersion: undefined },
  ])('rejects malformed signed claims %j', override => {
    const token = serializeSession(user);
    const data = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(parseSession(signed({ ...data, ...override }))).toBeNull();
  });
  it('preserves signed demo restrictions', () => { expect(parseSession(serializeSession({ ...user, demo: true }))?.demo).toBe(true); });
  it('allows platform owner without an organization', () => {
    expect(parseSession(serializeSession({ ...user, role: 'PLATFORM_OWNER', organizationId: null, organizationSlug: null }))).not.toBeNull();
  });
});
