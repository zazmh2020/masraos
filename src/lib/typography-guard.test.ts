import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/* حارس نظام الأوزان: قمرة متاحة بخمسة أوزان فقط (300/400/500/700/900).
   أي وزن آخر يجعل المتصفح يستبدل ملفًا آخر فيختلّ التدرج — DESIGN.md §3. */
const ALLOWED = new Set(['300', '400', '500', '700', '900']);
const TOKENS = new Set(['--fw-light', '--fw-regular', '--fw-medium', '--fw-bold', '--fw-black']);

function files(dir: string, ext: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!/generated|node_modules/.test(p)) files(p, ext, out); }
    else if (ext.test(name) && !name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

const withoutFontFace = (css: string) => css.replace(/@font-face\s*\{[^}]*\}/g, '');

describe('Qomra weight system', () => {
  it('declares exactly the five real font files', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    const faces = [...tokens.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => [m[1].match(/itfQomraArabic-(\w+)\.woff2/)?.[1], m[1].match(/font-weight:\s*(\d+)/)?.[1]]);
    expect(faces).toEqual([['Light', '300'], ['Regular', '400'], ['Medium', '500'], ['Bold', '700'], ['Black', '900']]);
  });

  it('uses only weight tokens in CSS (no literal or unsupported weights)', () => {
    const bad: string[] = [];
    for (const f of files('src', /\.css$/)) {
      const css = withoutFontFace(readFileSync(f, 'utf8'));
      for (const m of css.matchAll(/font-weight:\s*([^;}\n]+)/g)) {
        const v = m[1].trim();
        const token = v.match(/^var\((--fw-[a-z]+)\)$/)?.[1];
        if (!token || !TOKENS.has(token)) bad.push(`${f}: font-weight: ${v}`);
      }
      for (const m of css.matchAll(/\bfont:\s*(\d{3})\s/g)) if (!ALLOWED.has(m[1])) bad.push(`${f}: font: ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it('uses only supported weights in components', () => {
    const bad: string[] = [];
    for (const f of files('src', /\.(tsx|ts)$/)) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/fontWeight:\s*['"]?([0-9a-z]+)/g)) if (!ALLOWED.has(m[1])) bad.push(`${f}: fontWeight ${m[1]}`);
      for (const m of src.matchAll(/font-weight:\s*([0-9a-z]+)/g)) if (!ALLOWED.has(m[1]) && !m[1].startsWith('var')) bad.push(`${f}: font-weight ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it('never asks the browser to synthesize a missing weight', () => {
    expect(readFileSync('src/styles/base.css', 'utf8')).toMatch(/font-synthesis:\s*none/);
  });
});
