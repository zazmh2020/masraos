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
describe('approved MASRA color identity', () => {
  it('keeps the approved purple primitives and primary CTA role', () => {
    for (const [level, hex] of Object.entries({100:'EEE8F5',300:'A893C4',500:'6B4B95',700:'4B2F73',900:'2C1B4F'})) {
      expect(tokens).toContain(`--purple-${level}: #${hex};`);
    }
    expect(tokens).toContain('--brand-primary: #4B2F73;');
  });
  it.each([
    ['4B2F73','FFFFFF'], ['FFFFFF','2C1B4F'],
    ['666A75','FFFFFF'], ['6B4B95','EEE8F5'],
    ['666A75','EEE8F5'],
  ])('keeps readable text contrast for %s on %s', (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
  it('reserves gray 400 for nonessential or disabled content', () => {
    expect(contrast('A8ABB3', 'FFFFFF')).toBeLessThan(4.5);
    expect(tokens).toContain('--text-muted: var(--gray-500);');
    expect(tokens).toContain('--gray-500: var(--gray-600);');
  });
  it('uses the same semantic primary color for landing and plan CTAs', () => {
    expect(readFileSync('src/styles/masra.css','utf8')).toContain('--p: var(--brand-primary);');
    expect(readFileSync('src/components/landing/pricing-preview.module.css','utf8'))
      .toContain('background: var(--brand-primary); color: var(--on-brand);');
  });
});
