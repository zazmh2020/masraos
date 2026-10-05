import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deliverOtp } from './otp-delivery';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
beforeEach(() => { vi.stubEnv('OTP_EMAIL_PROVIDER', ''); vi.stubEnv('RESEND_API_KEY', ''); vi.stubEnv('EMAIL_FROM', ''); });
describe('signup verification delivery', () => {
  it('uses Resend for email with RTL markup and plain text, without exposing the code', async () => {
    vi.stubEnv('OTP_EMAIL_PROVIDER', 'resend'); vi.stubEnv('RESEND_API_KEY', 'test-key'); vi.stubEnv('EMAIL_FROM', 'MASRA <verify@example.test>');
    const send = vi.fn().mockResolvedValue(Response.json({ id: 'test-message' })); vi.stubGlobal('fetch', send);
    expect(await deliverOtp('EMAIL', 'user@example.test', '123456')).toEqual({ ok: true, via: 'resend' });
    const [url, options] = send.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const payload = JSON.parse(options.body);
    expect(payload.to).toBe('user@example.test'); expect(payload.html).toContain('dir="rtl"'); expect(payload.text).toContain('123456');
    expect(options.signal).toBeDefined();
  });
  it('does not fall back to dev codes or webhook if Resend is selected but unconfigured', async () => {
    vi.stubEnv('OTP_EMAIL_PROVIDER', 'resend'); vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('OTP_WEBHOOK_URL', 'https://example.test/hook');
    const send = vi.fn(); vi.stubGlobal('fetch', send);
    expect(await deliverOtp('EMAIL', 'user@example.test', '123456')).toEqual({ ok: false, reason: 'not_configured' }); expect(send).not.toHaveBeenCalled();
  });
  it('requires an explicit sender in production', async () => {
    vi.stubEnv('OTP_EMAIL_PROVIDER', 'resend'); vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('RESEND_API_KEY', 'test-key');
    const send = vi.fn(); vi.stubGlobal('fetch', send);
    expect(await deliverOtp('EMAIL', 'user@example.test', '123456')).toEqual({ ok: false, reason: 'not_configured' }); expect(send).not.toHaveBeenCalled();
  });
  it.each([400, 401, 429, 500])('rejects provider status %s without leaking errors', async status => {
    vi.stubEnv('OTP_EMAIL_PROVIDER', 'resend'); vi.stubEnv('RESEND_API_KEY', 'test-key'); vi.stubEnv('EMAIL_FROM', 'verify@example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'private provider details' }, { status })));
    expect(await deliverOtp('EMAIL', 'user@example.test', '123456')).toEqual({ ok: false, reason: 'failed' });
  });
  it('rejects malformed success responses and network errors', async () => {
    vi.stubEnv('OTP_EMAIL_PROVIDER', 'resend'); vi.stubEnv('RESEND_API_KEY', 'test-key'); vi.stubEnv('EMAIL_FROM', 'verify@example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})));
    expect(await deliverOtp('EMAIL', 'user@example.test', '123456')).toEqual({ ok: false, reason: 'failed' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    expect(await deliverOtp('EMAIL', 'user@example.test', '123456')).toEqual({ ok: false, reason: 'failed' });
  });
  it('does not route phone verification through Resend', async () => {
    vi.stubEnv('OTP_EMAIL_PROVIDER', 'resend'); vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('OTP_WEBHOOK_URL', '');
    const send = vi.fn(); vi.stubGlobal('fetch', send);
    expect(await deliverOtp('PHONE', '+966500000000', '123456')).toEqual({ ok: false, reason: 'not_configured' }); expect(send).not.toHaveBeenCalled();
  });
  it('fails closed in production without a provider', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('OTP_WEBHOOK_URL', '');
    expect(await deliverOtp('EMAIL', 'test@example.test', '123456')).toEqual({ ok: false, reason: 'not_configured' });
  });
  it('never logs the development code or recipient', async () => {
    vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('OTP_WEBHOOK_URL', '');
    const logger = vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(await deliverOtp('EMAIL', 'test@example.test', '123456')).toMatchObject({ ok: true, via: 'dev' });
    expect(logger).not.toHaveBeenCalled();
  });
  it('returns success without exposing a code when provider accepts', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('OTP_WEBHOOK_URL', 'https://example.test/otp');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
    expect(await deliverOtp('EMAIL', 'test@example.test', '123456')).toEqual({ ok: true, via: 'webhook' });
  });
  it('does not claim delivery on provider failure', async () => {
    vi.stubEnv('OTP_WEBHOOK_URL', 'https://example.test/otp');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    expect(await deliverOtp('EMAIL', 'test@example.test', '123456')).toEqual({ ok: false, reason: 'failed' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await deliverOtp('PHONE', '+966500000000', '123456')).toEqual({ ok: false, reason: 'failed' });
  });
});
