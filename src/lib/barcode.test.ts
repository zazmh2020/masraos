import { describe, it, expect } from 'vitest';
import { isCode39Value, code39Pattern, code39Svg } from './barcode';

describe('code39 barcode', () => {
  it('validates the Code 39 character set', () => {
    expect(isCode39Value('12345')).toBe(true);
    expect(isCode39Value('ABC-123')).toBe(true);
    expect(isCode39Value('abc')).toBe(true); // يُرفع لأحرف كبيرة
    expect(isCode39Value('=@!')).toBe(false);
  });

  it('wraps the value with start/stop and uses 9 elements per symbol', () => {
    // '*' + '1' + '*' = 3 رموز × 9 عناصر
    expect(code39Pattern('1').length).toBe(27);
    // كل رمز يحوي 3 عناصر عريضة بالضبط (خاصية Code 39)
    const one = code39Pattern('1').slice(9, 18);
    expect([...one].filter((c) => c === '1').length).toBe(3);
  });

  it('digit 0 matches the canonical Code 39 pattern', () => {
    expect(code39Pattern('0').slice(9, 18)).toBe('000110100');
  });

  it('emits a self-contained SVG with bars', () => {
    const svg = code39Svg('100');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<rect');
    expect(svg).toContain('viewBox');
  });
});
