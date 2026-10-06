'use client';

import type { KeyboardEvent } from 'react';
import Icon, { IconShape } from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';
import { brandVars } from '@/lib/brand-palette';
import {
  BUTTON_STYLES, ICON_STYLES, SHAPE_FORMS, SHAPE_STYLES, SIDEBAR_STYLES,
  uiThemeAttrs, type UiTheme,
} from '@/lib/ui-theme';
import '@/styles/calm.css';
import '@/styles/ui-theme-picker.css';

/* ============================================================
   منتقي «النمط العام للواجهة» ومعاينته الحيّة — مشترك بين إعدادات الجهة
   ولوحة مالك المنصة. المعاينة تستخدم ألوان الجهة المشتقة (brand-palette).
   ============================================================ */

/** معاينة مصغّرة للوحة: شريط جانبي + بطاقتا إحصاء + زران. */
export function UiThemePreview({ theme, color, logoUrl, name }: { theme: UiTheme; color: string; logoUrl?: string; name?: string }) {
  const t = useT();
  return (
    <div className="calm bm" style={brandVars(color)} {...uiThemeAttrs(theme)} aria-label={t('theme.preview')} role="img">
      <div className="bm-side">
        <span className="bm-logo">
          {logoUrl?.trim()
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logoUrl} alt="" />
            : <span className="ph">م</span>}
          {name || t('brand.previewName')}
        </span>
        <span className="bm-nav is-active"><Icon name="home" size={16} tone="duo" />{t('onav.dashboard')}</span>
        <span className="bm-nav"><Icon name="students" size={16} tone="duo" />{t('home.strip.students')}</span>
        <span className="bm-nav"><Icon name="halaqat" size={16} tone="duo" />{t('home.strip.halaqat')}</span>
        <span className="bm-nav"><Icon name="settings" size={16} tone="duo" />{t('onav.settings')}</span>
      </div>
      <div className="bm-main">
        <div className="bm-stats">
          <span className="bm-stat"><IconShape name="students" variant="soft" size="sm" /><span><b>24</b>{t('home.strip.students')}</span></span>
          <span className="bm-stat"><IconShape name="attendance" variant="soft" size="sm" /><span><b>92%</b>{t('home.strip.attendance')}</span></span>
        </div>
        <div className="bm-btns">
          <span className="bm-btn is-primary">{t('brand.previewBtn')}</span>
          <span className="bm-btn">{t('shell.cancel')}</span>
        </div>
      </div>
    </div>
  );
}

/** مجموعات الاختيار الخمس. */
export function UiThemeOptions({ theme, onChange, color }: { theme: UiTheme; onChange: (next: UiTheme) => void; color: string }) {
  const t = useT();
  const set = <K extends keyof UiTheme>(k: K, v: UiTheme[K]) => onChange({ ...theme, [k]: v });
  // غلاف .calm يعرّف رموز --c-* حتى تعمل الأزرار خارج لوحة الجهة (لوحة مالك المنصة)
  return (
    <div className="calm ui-theme-options" style={brandVars(color)}>
      <div className="org-field">
        <span className="org-label-strong">{t('theme.title')}</span>
        <span className="org-hint">{t('theme.hint')}</span>
      </div>
      <ThemeChoice legend={t('theme.sidebar')} value={theme.sidebar} options={SIDEBAR_STYLES} label={(v) => t(`theme.sidebar.${v}`)} onChange={(v) => set('sidebar', v)}
        swatch={(v) => (v === 'brand' ? color : v === 'deep' ? (brandVars(color) as Record<string, string> | undefined)?.['--purple-900'] ?? '#1B0140' : '#ffffff')} />
      <ThemeChoice legend={t('theme.icons')} value={theme.icons} options={ICON_STYLES} label={(v) => t(`theme.icons.${v}`)} onChange={(v) => set('icons', v)} />
      <ThemeChoice legend={t('theme.shape')} value={theme.shape} options={SHAPE_STYLES} label={(v) => t(`theme.shape.${v}`)} onChange={(v) => set('shape', v)} />
      <ThemeChoice legend={t('theme.shapeForm')} value={theme.shapeForm} options={SHAPE_FORMS} label={(v) => t(`theme.shapeForm.${v}`)} onChange={(v) => set('shapeForm', v)} />
      <ThemeChoice legend={t('theme.buttons')} value={theme.buttons} options={BUTTON_STYLES} label={(v) => t(`theme.buttons.${v}`)} onChange={(v) => set('buttons', v)} />
    </div>
  );
}

/** مجموعة اختيار واحدة — أزرار راديو بلوحة المفاتيح (أسهم، مع مراعاة RTL). */
function ThemeChoice<T extends string>({
  legend, value, options, label, onChange, swatch,
}: {
  legend: string;
  value: T;
  options: readonly T[];
  label: (v: T) => string;
  onChange: (v: T) => void;
  swatch?: (v: T) => string;
}) {
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = options.indexOf(value);
    const next = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const dir = document.documentElement.dir === 'rtl' ? next : -next;
    onChange(options[(i + dir + options.length) % options.length]);
  }
  return (
    <fieldset className="theme-group">
      <legend>{legend}</legend>
      <div className="theme-options" role="radiogroup" aria-label={legend} onKeyDown={onKey}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} tabIndex={value === o ? 0 : -1}
            className="theme-option" onClick={() => onChange(o)}>
            {swatch && <span className="theme-swatch" style={{ background: swatch(o) }} aria-hidden="true" />}
            {label(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
