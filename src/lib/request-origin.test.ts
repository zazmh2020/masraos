import { describe, expect, it } from 'vitest';
import { isCrossSiteMutation } from './request-origin';

const ROOTS = ['masraos.com'];
const h = (init: Record<string, string>) => new Headers({ host: 'masraos.com', ...init });

describe('cross-site API mutation guard', () => {
  it('blocks a mutation sent from another site', () => {
    expect(isCrossSiteMutation('POST', '/api/org/students', h({ origin: 'https://evil.example' }), ROOTS)).toBe(true);
    expect(isCrossSiteMutation('DELETE', '/api/org/tasks/1', h({ origin: 'null' }), ROOTS)).toBe(true);
    expect(isCrossSiteMutation('PATCH', '/api/org/x', h({ 'sec-fetch-site': 'cross-site' }), ROOTS)).toBe(true);
    expect(isCrossSiteMutation('POST', '/api/x', h({ origin: 'https://masraos.com.evil.example' }), ROOTS)).toBe(true);
  });

  it('allows same-origin, platform subdomains and same-host custom domains', () => {
    expect(isCrossSiteMutation('POST', '/api/auth/login', h({ origin: 'https://masraos.com' }), ROOTS)).toBe(false);
    expect(isCrossSiteMutation('POST', '/api/x', h({ origin: 'https://center.masraos.com' }), ROOTS)).toBe(false);
    const custom = new Headers({ host: 'center-domain.example', origin: 'https://center-domain.example' });
    expect(isCrossSiteMutation('POST', '/api/consultation', custom, ROOTS)).toBe(false);
    expect(isCrossSiteMutation('POST', '/api/x', h({ 'sec-fetch-site': 'same-origin' }), ROOTS)).toBe(false);
  });

  it('never blocks reads, provider webhooks or origin-less server calls', () => {
    expect(isCrossSiteMutation('GET', '/api/org/export', h({ origin: 'https://evil.example' }), ROOTS)).toBe(false);
    expect(isCrossSiteMutation('POST', '/api/webhooks/stripe', h({ origin: 'https://evil.example' }), ROOTS)).toBe(false);
    expect(isCrossSiteMutation('POST', '/api/webhooks/stripe', h({}), ROOTS)).toBe(false);
  });
});
