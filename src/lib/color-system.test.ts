import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}
/** مزج لونين كما يفعل color-mix(in srgb, a p%, b) — للتحقق من الألوان المشتقة. */
function mix(a: string, p: number, b: string) {
  const ca = a.match(/[a-f\d]{2}/gi)!.map(v => parseInt(v, 16));
  const cb = b.match(/[a-f\d]{2}/gi)!.map(v => parseInt(v, 16));
  return ca.map((v, i) => Math.round(v * p + cb[i] * (1 - p)).toString(16).padStart(2, '0')).join('');
}

describe('official MASRA brand color system', () => {
  it('defines the official brand primitives and roles', () => {
    for (const [name, hex] of Object.entries({ soft: 'D3B3F2', primary: '61428C', deep: '1B0140', support: 'AE8FD9', ink: '1A1126' })) {
      expect(tokens).toContain(`--masra-${name}: #${hex};`);
    }
    expect(tokens).toContain('--brand-primary: var(--masra-primary);');
    expect(tokens).toContain('--brand-primary-dark: var(--masra-deep);');
    for (const hex of ['22C55E', 'EF4444', 'F59E0B', '3B82F6']) expect(tokens).toContain(`#${hex}`);
  });
  it.each([
    ['61428C', 'FFFFFF'], ['FFFFFF', '61428C'], ['FFFFFF', '1B0140'],
    ['1A1126', 'FAF7FE'], ['61428C', 'F8F5FF'], ['1B0140', 'D3B3F2'],
    [mix('334155', .78, '94A3B8'), 'FFFFFF'], [mix('334155', .78, '94A3B8'), 'FAF7FE'],
  ])('keeps readable text contrast for %s on %s', (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
  it.each([
    ['success', mix('22C55E', .52, '000000'), mix('22C55E', .12, 'FFFFFF')],
    ['warning', mix('F59E0B', .5, '000000'), mix('F59E0B', .12, 'FFFFFF')],
    ['error', mix('EF4444', .72, '000000'), mix('EF4444', .1, 'FFFFFF')],
    ['info', mix('3B82F6', .72, '000000'), mix('3B82F6', .1, 'FFFFFF')],
  ])('derives a readable %s text color from the official shade', (_name, ink, soft) => {
    expect(contrast(ink, 'FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ink, soft)).toBeGreaterThanOrEqual(4.5);
  });
  it('reserves gray and support purple for nonessential or decorative content', () => {
    expect(contrast('94A3B8', 'FFFFFF')).toBeLessThan(4.5);
    expect(contrast('AE8FD9', 'FFFFFF')).toBeLessThan(4.5);
    expect(tokens).toContain('--text-muted: var(--gray-500);');
    expect(tokens).toContain('--gray-500: var(--gray-600);');
  });
  it('uses the same semantic primary color for landing and plan CTAs', () => {
    expect(readFileSync('src/styles/masra.css', 'utf8')).toContain('--p: var(--brand-primary);');
    expect(readFileSync('src/components/landing/pricing-preview.module.css', 'utf8'))
      .toContain('background: var(--brand-primary); color: var(--on-brand);');
  });
});
