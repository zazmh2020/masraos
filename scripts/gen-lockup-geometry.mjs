// Extracts exact lockup geometry from the supplied SVG artwork into a TS data module.
// usage: node gen-lockup.mjs <svgDir> <outFile>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, out] = process.argv.slice(2);
const SOURCES = { rtl: 'Asset 8.svg', ltr: 'Asset 10.svg', stacked: 'Asset 12.svg' };

function elements(chunk) {
  const re = /<(path|polygon|rect|circle)\b([^>]*?)\/?>/g;
  const list = [];
  for (const m of chunk.matchAll(re)) {
    const attrs = {};
    for (const a of m[2].matchAll(/([a-z-]+)="([^"]*)"/g)) if (a[1] !== 'class') attrs[a[1]] = a[2];
    list.push({ t: m[1], ...attrs });
  }
  return list;
}

const data = {};
for (const [key, file] of Object.entries(SOURCES)) {
  const svg = readFileSync(join(dir, file), 'utf8');
  const swatch = svg.slice(svg.indexOf('Swatch_Info_Layer'));
  const groups = [...swatch.matchAll(/<g>\s*((?:(?!<g>)[\s\S])*?)<\/g>/g)].map((m) => m[1]);
  if (groups.length < 2) throw new Error(`${file}: expected text and mark groups`);
  const text = elements(groups[0]);
  const mark = elements(groups[1]);
  if (text.length !== 33 || mark.length !== 4) throw new Error(`${file}: unexpected element counts ${text.length}/${mark.length}`);
  const paths = mark.filter((e) => e.t === 'path');
  const dot = mark.find((e) => e.t === 'circle');
  // the wings are the longest path; the two short ones are the legs
  const wings = paths.reduce((a, b) => (b.d.length > a.d.length ? b : a));
  const legs = paths.filter((p) => p !== wings);
  data[key] = {
    ar: text.slice(0, 15),
    en: text.slice(15),
    legs: legs.map((l) => l.d),
    wings: wings.d,
    dot: { cx: Number(dot.cx), cy: Number(dot.cy), r: Number(dot.r) },
  };
}

const header = `// GENERATED from the official artwork (Asset 8 / 10 / 12) — do not edit by hand.\n// rtl: mark right · ltr: mark left · stacked: mark above the name.\n`;
writeFileSync(out, `${header}export type Shape =\n  | { t: 'path'; d: string }\n  | { t: 'polygon'; points: string }\n  | { t: 'rect'; x: string; y: string; width: string; height: string };\n\nexport const LOCKUP_GEOMETRY = ${JSON.stringify(data)} as const satisfies Record<'rtl' | 'ltr' | 'stacked', { ar: readonly Shape[]; en: readonly Shape[]; legs: readonly string[]; wings: string; dot: { cx: number; cy: number; r: number } }>;\n`);
console.log('ok', Object.keys(data).map((k) => `${k}:${data[k].ar.length}+${data[k].en.length}`).join(' '));
