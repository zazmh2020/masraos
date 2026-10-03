import { describe, expect, it } from 'vitest';
import { normalizeDigits } from './normalize-digits';

describe('normalizeDigits', () => {
  it('accepts Arabic-Indic, Persian and English digits', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(normalizeDigits('12٣۴')).toBe('1234');
  });
  it('preserves leading zeros, empty values and non-digit text', () => {
    expect(normalizeDigits('٠٠١٢')).toBe('0012');
    expect(normalizeDigits('')).toBe('');
    expect(normalizeDigits(' ID-١٢ ')).toBe(' ID-12 ');
  });
});
