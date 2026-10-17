import { describe, expect, it } from 'vitest';
import { apiHeaders, contentSecurityPolicy, securityHeaders } from './security-headers';

const get = (isDev: boolean, key: string) => securityHeaders(isDev).find((h) => h.key === key)?.value;

describe('security headers', () => {
  it('production CSP blocks plugins, base hijacking, foreign form targets and foreign framing', () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('production CSP never allows eval or websockets (dev-only needs)', () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toMatch(/\bws:/);
  });

  it('development CSP allows what Next.js dev needs (eval for error overlays, HMR websocket)', () => {
    const csp = contentSecurityPolicy(true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws:');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('sends HSTS only in production, without includeSubDomains until every subdomain is verified', () => {
    expect(get(true, 'Strict-Transport-Security')).toBeUndefined();
    expect(get(false, 'Strict-Transport-Security')).toBe('max-age=31536000');
  });

  it('sets the baseline hardening headers', () => {
    expect(get(false, 'X-Content-Type-Options')).toBe('nosniff');
    expect(get(false, 'X-Frame-Options')).toBe('SAMEORIGIN');
    expect(get(false, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(get(false, 'Permissions-Policy')).toContain('camera=()');
  });

  it('marks API responses as not cacheable', () => {
    expect(apiHeaders).toEqual([{ key: 'Cache-Control', value: 'no-store' }]);
  });
});
