import { describe, expect, it } from 'vitest';
import { canManageRegistration, parseDateOnly, validateRegistration } from './student-registration';

describe('student registration privacy and validation', () => {
  it('only the org admin with effective education permission can access', () => {
    expect(canManageRegistration({ role: 'ORG_ADMIN' })).toBe(true);
    for (const role of ['TEACHER', 'STUDENT', 'MEMBER', 'STAFF', 'SUPERVISOR', 'PLATFORM_OWNER']) {
      expect(canManageRegistration({ role, permissions: ['education.manage'] })).toBe(false);
    }
    expect(canManageRegistration({ role: 'ORG_ADMIN', permissions: [] })).toBe(false);
  });
  it('rejects malformed and impossible dates', () => {
    expect(() => parseDateOnly('2026-02-30')).toThrow();
    expect(() => parseDateOnly('yesterday')).toThrow();
    expect(parseDateOnly('2024-02-29')?.toISOString()).toBe('2024-02-29T00:00:00.000Z');
  });
  it('requires consent for sensitive optional information', () => {
    expect(() => validateRegistration({ name: 'طالب تجريبي', address: 'عنوان' })).toThrow();
    expect(validateRegistration({ name: 'طالب تجريبي', address: 'عنوان', consentConfirmed: true }).registration.address).toBe('عنوان');
    expect(validateRegistration({ name: 'طالب تجريبي' }).registration.homeLocationUrl).toBeNull();
  });
  it('rejects executable links, credentials, oversized fields and invalid email', () => {
    for (const homeLocationUrl of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com']) {
      expect(() => validateRegistration({ name: 'طالب', homeLocationUrl, consentConfirmed: true })).toThrow();
    }
    expect(() => validateRegistration({ name: 'طالب', guardianEmail: 'invalid' })).toThrow();
    expect(() => validateRegistration({ name: 'طالب', city: 'x'.repeat(101) })).toThrow();
  });
  it('does not accept photo keys or tenant ids from the client', () => {
    const result = validateRegistration({ name: 'طالب', photoKey: 'other-org/photo.jpg', organizationId: 'other' });
    expect(result.registration).not.toHaveProperty('photoKey');
    expect(result.student).not.toHaveProperty('organizationId');
  });
});
