import { describe, expect, it } from 'vitest';
import { isTextMetric } from './metric-value';

describe('isTextMetric', () => {
  it('treats wording without digits as text', () => {
    expect(isTextMetric('Not recorded yet')).toBe(true);
    expect(isTextMetric('لم يُسجَّل بعد')).toBe(true);
  });
  it('treats Western and Arabic-Indic numerals as numbers', () => {
    for (const v of ['0', '85%', '٨٥٪', '١٢', '1,250']) expect(isTextMetric(v)).toBe(false);
  });
  it('ignores non-string values', () => {
    expect(isTextMetric(12)).toBe(false);
    expect(isTextMetric(null)).toBe(false);
  });
});
