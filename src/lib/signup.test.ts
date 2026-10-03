import { describe, expect, it, beforeAll } from 'vitest';
import { normalizePhone, normalizeOtpInput, validateSignup } from './signup';
import { generateOtp, hashOtp, maskEmail, maskPhone, verifyOtp } from './otp';

const base = { name: 'خالد', orgName: 'مركز النور', slug: 'alnoor', email: 'Khalid@Example.com', phone: '', password: 'secret123', channel: 'EMAIL' };

describe('validateSignup', () => {
  it('accepts valid input and normalizes email/slug', () => {
    const v = validateSignup({ ...base, slug: 'AlNoor' });
    expect(v.ok).toBe(true);
    if (v.ok) { expect(v.data.email).toBe('khalid@example.com'); expect(v.data.slug).toBe('alnoor'); expect(v.data.phone).toBeNull(); }
  });
  it('rejects reserved and malformed slugs', () => {
    expect(validateSignup({ ...base, slug: 'admin' })).toMatchObject({ ok: false, field: 'slug' });
    expect(validateSignup({ ...base, slug: '-bad' })).toMatchObject({ ok: false, field: 'slug' });
    expect(validateSignup({ ...base, slug: 'ab' })).toMatchObject({ ok: false, field: 'slug' });
    expect(validateSignup({ ...base, slug: 'مركز' })).toMatchObject({ ok: false, field: 'slug' });
  });
  it('requires a phone when the channel is PHONE', () => {
    expect(validateSignup({ ...base, channel: 'PHONE' })).toMatchObject({ ok: false, field: 'phone' });
    const v = validateSignup({ ...base, channel: 'PHONE', phone: '0551234567' });
    expect(v.ok && v.data.phone).toBe('+966551234567');
  });
  it('rejects short passwords, bad email and unknown channel', () => {
    expect(validateSignup({ ...base, password: 'short' })).toMatchObject({ ok: false, field: 'password' });
    expect(validateSignup({ ...base, email: 'nope' })).toMatchObject({ ok: false, field: 'email' });
    expect(validateSignup({ ...base, channel: 'FAX' })).toMatchObject({ ok: false, field: 'channel' });
    expect(validateSignup(null)).toMatchObject({ ok: false });
  });
});

describe('normalizePhone', () => {
  it('handles Saudi local, international and Arabic-Indic digits', () => {
    expect(normalizePhone('055 123 4567')).toBe('+966551234567');
    expect(normalizePhone('00966551234567')).toBe('+966551234567');
    expect(normalizePhone('٠٥٥١٢٣٤٥٦٧')).toBe('+966551234567');
    expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
    expect(normalizePhone('12')).toBeNull();
  });
});

describe('normalizeOtpInput', () => {
  it('accepts 6 digits incl. Arabic-Indic, rejects others', () => {
    expect(normalizeOtpInput('123456')).toBe('123456');
    expect(normalizeOtpInput('١٢٣٤٥٦')).toBe('123456');
    expect(normalizeOtpInput('12345')).toBeNull();
    expect(normalizeOtpInput(123456)).toBeNull();
  });
});

describe('otp', () => {
  beforeAll(() => { process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret'; });
  it('generates 6-digit codes', () => {
    for (let i = 0; i < 50; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });
  it('verifies only the right code for the right request', () => {
    const h = hashOtp('req-1', '424242');
    expect(verifyOtp('req-1', '424242', h)).toBe(true);
    expect(verifyOtp('req-1', '424243', h)).toBe(false);
    expect(verifyOtp('req-2', '424242', h)).toBe(false);
    expect(h).not.toContain('424242');
  });
  it('masks targets', () => {
    expect(maskEmail('khalid@example.com')).toBe('k•••••@example.com');
    expect(maskPhone('+966551234567')).toMatch(/^\+9665•+67$/);
  });
});
