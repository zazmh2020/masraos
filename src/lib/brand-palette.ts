import type { CSSProperties } from 'react';

/* ============================================================
   اشتقاق لوحة الجهة من لون هويتها — بنفس أدوار نظام الألوان الرسمي:
   الفاتح (Soft) · المساند (Support) · الأساسي (Primary) · الداكن (Deep).
   النِّسب مأخوذة من اللوحة الرسمية: لـ #61428C تعطي قيمًا قريبة جدًا من
   #D3B3F2 و#AE8FD9 و#1B0140. يُحافظ على درجة اللون (hue) ويُضبط السطوع
   ليبقى النص الأبيض مقروءًا فوق الأساسي والداكن مهما كان اللون المختار.
   ============================================================ */

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
function hexToRgb(h: string): [number, number, number] {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const l = (max + min) / 2; const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
export function relLum(hex: string) {
  return hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
    .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contrastRatio(a: string, b: string) {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export type BrandPalette = {
  soft: string; support: string; primary: string; deep: string;
  hover: string; subtle: string; onBrand: string;
};

/** القيم الرسمية (نظام الألوان المعتمد). */
const OFFICIAL: BrandPalette = {
  soft: '#D3B3F2', support: '#AE8FD9', primary: '#61428C', deep: '#1B0140',
  hover: '#42246D', subtle: '#F8F5FF', onBrand: '#ffffff',
};

/** لوحة كاملة من لون واحد — أو null إن كان اللون غير صالح. */
export function brandPalette(hex?: string | null): BrandPalette | null {
  if (!hex || !HEX_RE.test(hex)) return null;
  const base = hex.startsWith('#') ? hex : `#${hex}`;
  // لون الهوية الرسمي لمسرى: القيم الرسمية حرفيًا
  if (base.toUpperCase() === '#61428C') return { ...OFFICIAL };
  const [h, s0, l0] = rgbToHsl(...hexToRgb(base));
  const s = clamp(s0, 0.12, 0.95);
  const mk = (l: number, sat: number) => toHex(...hslToRgb(h, clamp(sat, 0, 1), l / 100));
  // الأساسي: لون الجهة نفسه مع سقف للسطوع حتى يبقى النص الأبيض بتباين ≥ 4.5:1
  let primaryL = clamp(l0 * 100, 18, 46);
  let primary = mk(primaryL, s);
  while (contrastRatio(primary, '#ffffff') < 4.5 && primaryL > 18) { primaryL -= 2; primary = mk(primaryL, s); }
  return {
    // سقف للتشبّع في الدرجات الفاتحة حتى تبقى هادئة مع الألوان المشبعة
    soft: mk(83, Math.min(s * 2.1, 0.72)),     // ≈ #D3B3F2 للون الرسمي
    support: mk(71, Math.min(s * 1.42, 0.56)), // ≈ #AE8FD9
    primary,
    deep: mk(13, s * 2.6),          // ≈ #1B0140
    hover: mk(Math.max(primaryL - 12, 10), s * 1.4),
    subtle: mk(97.5, Math.min(s * 2.1, 0.72)), // ≈ #F8F5FF
    onBrand: contrastRatio(primary, '#ffffff') >= 4.5 ? '#ffffff' : '#1a1126',
  };
}

/** متغيّرات CSS للوحة الجهة — تُطبَّق على غلاف اللوحة (.org-app) وفي معاينة الإعدادات. */
export function brandVars(hex?: string | null, accent?: string | null): CSSProperties | undefined {
  const p = brandPalette(hex);
  if (!p) return undefined;
  const accentHex = accent && HEX_RE.test(accent) ? (accent.startsWith('#') ? accent : `#${accent}`) : p.support;
  return {
    '--brand': p.primary,
    '--accent': accentHex,
    '--on-brand': p.onBrand,
    '--purple-100': p.soft,
    '--purple-300': p.support,
    '--purple-500': p.primary,
    '--purple-700': p.hover,
    '--purple-900': p.deep,
    '--brand-primary': p.primary,
    '--brand-primary-dark': p.deep,
    '--brand-primary-medium': p.support,
    '--brand-primary-soft': p.soft,
    '--brand-primary-subtle': p.subtle,
  } as CSSProperties;
}
