import { describe, expect, it } from 'vitest';
import { brandPalette, brandVars, contrastRatio } from './brand-palette';

describe('organization brand palette', () => {
  it('returns the official MASRA values for the official primary color', () => {
    expect(brandPalette('#61428C')).toMatchObject({ soft: '#D3B3F2', support: '#AE8FD9', primary: '#61428C', deep: '#1B0140' });
  });
  it.each(['#0E7C66', '#F2C94C', '#E11D48', '#38BDF8', '#111111', '#FFFFFF', '#7C3AED'])(
    'keeps white text readable on the primary and deep shades for %s', (hex) => {
      const p = brandPalette(hex)!;
      expect(contrastRatio(p.primary, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.deep, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      // الدرجات الفاتحة تبقى خلفيات للنص الداكن
      expect(contrastRatio(p.soft, '#1A1126')).toBeGreaterThanOrEqual(4.5);
    });
  it('rejects invalid colors', () => {
    expect(brandPalette('red')).toBeNull();
    expect(brandVars('#12')).toBeUndefined();
  });
});
