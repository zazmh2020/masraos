'use client';

import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';
import { readLogoFile, removeBackground } from '@/lib/image-file';
import ImageCropper from '@/components/ImageCropper';
import Icon, { IconShape } from '@/components/Icon';
import { brandVars } from '@/lib/brand-palette';
import {
  BUTTON_STYLES, ICON_STYLES, SHAPE_FORMS, SHAPE_STYLES, SIDEBAR_STYLES,
  normalizeUiTheme, uiThemeAttrs, type UiTheme,
} from '@/lib/ui-theme';

/**
 * تخصيص الهوية البصرية للجهة: لون أساسي + شعار + النمط العام للواجهة
 * (الشريط الجانبي، الأيقونات، أشكالها، الأزرار) مع معاينة حيّة.
 * apiBase: نقطة الحفظ (org أو admin).
 */
export default function BrandingForm({
  brandColor: initialColor = '',
  logoUrl: initialLogo = '',
  uiTheme: initialTheme = null,
  apiBase = '/api/org/branding',
}: {
  brandColor?: string | null;
  logoUrl?: string | null;
  uiTheme?: unknown;
  apiBase?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [color, setColor] = useState((initialColor ?? '') || '#61428C');
  const [enabled, setEnabled] = useState(!!initialColor);
  const [logoUrl, setLogoUrl] = useState(initialLogo ?? '');
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [logoDims, setLogoDims] = useState<{ w: number; h: number } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<UiTheme>(() => normalizeUiTheme(initialTheme));
  const setPart = <K extends keyof UiTheme>(k: K, v: UiTheme[K]) => setTheme((th) => ({ ...th, [k]: v }));

  async function onPickLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { setStatus({ kind: 'error', msg: t('brand.logoTooBig') }); return; }
    try {
      // SVG متجّه — يُحفظ كما هو بلا اقتصاص؛ الصور النقطية تُفتح في أداة الضبط
      if (file.type === 'image/svg+xml') { setLogoUrl(await readLogoFile(file)); return; }
      setCropSrc(await readLogoFile(file, 1024));
    } catch { setStatus({ kind: 'error', msg: t('brand.logoReadErr') }); }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandColor: enabled ? color : '', logoUrl, uiTheme: theme }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setStatus({ kind: 'error', msg: data.error ?? t('form.saveErr') });
      else { setStatus({ kind: 'ok', msg: t('brand.saved') }); router.refresh(); }
    } catch {
      setStatus({ kind: 'error', msg: t('form.netErr') });
    } finally { setBusy(false); }
  }

  const shown = enabled ? color : '#61428C';

  return (
    <form className="org-form brand-form" onSubmit={save}>
      {status && <div className={`org-alert ${status.kind === 'ok' ? 'is-ok' : ''}`}>{status.msg}</div>}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          outputSize={512}
          onCancel={() => setCropSrc(null)}
          onConfirm={(dataUrl) => { setLogoUrl(dataUrl); setLogoDims(null); setCropSrc(null); }}
        />
      )}

      {/* معاينة حيّة: نفس قواعد اللوحة الفعلية بألوان الجهة المختارة */}
      <div className="calm bm" style={brandVars(shown)} {...uiThemeAttrs(theme)} aria-label={t('theme.preview')} role="img">
        <div className="bm-side">
          <span className="bm-logo">
            {logoUrl.trim()
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt="" />
              : <span className="ph">م</span>}
            {t('brand.previewName')}
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

      <label className="brand-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t('brand.useCustom')}
      </label>

      {enabled && (
        <div className="org-field">
          <label htmlFor="bc">{t('brand.primaryColor')}</label>
          <div className="brand-color-row">
            <input id="bc" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <input type="text" dir="ltr" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#61428C" />
          </div>
        </div>
      )}

      {/* النمط العام للواجهة */}
      <div className="org-field">
        <span className="org-label-strong">{t('theme.title')}</span>
        <span className="org-hint">{t('theme.hint')}</span>
      </div>
      <ThemeChoice legend={t('theme.sidebar')} value={theme.sidebar} options={SIDEBAR_STYLES} label={(v) => t(`theme.sidebar.${v}`)} onChange={(v) => setPart('sidebar', v)}
        swatch={(v) => (v === 'brand' ? shown : v === 'deep' ? 'var(--c-ink)' : '#ffffff')} />
      <ThemeChoice legend={t('theme.icons')} value={theme.icons} options={ICON_STYLES} label={(v) => t(`theme.icons.${v}`)} onChange={(v) => setPart('icons', v)} />
      <ThemeChoice legend={t('theme.shape')} value={theme.shape} options={SHAPE_STYLES} label={(v) => t(`theme.shape.${v}`)} onChange={(v) => setPart('shape', v)} />
      <ThemeChoice legend={t('theme.shapeForm')} value={theme.shapeForm} options={SHAPE_FORMS} label={(v) => t(`theme.shapeForm.${v}`)} onChange={(v) => setPart('shapeForm', v)} />
      <ThemeChoice legend={t('theme.buttons')} value={theme.buttons} options={BUTTON_STYLES} label={(v) => t(`theme.buttons.${v}`)} onChange={(v) => setPart('buttons', v)} />

      <div className="org-field">
        <label htmlFor="lg">{t('brand.logo')}</label>
        <div className="brand-logo-upload">
          <span className="brand-logo-thumb brand-logo-thumb-lg">
            {logoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" onLoad={(e) => setLogoDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
            ) : <span className="brand-logo-ph">م</span>}
          </span>
          <div className="brand-logo-controls">
            <button type="button" className="org-btn org-btn-outline" onClick={() => fileRef.current?.click()}>{t('brand.uploadLogo')}</button>
            {logoUrl.trim() && logoUrl.startsWith('data:') && (
              <button type="button" className="org-btn org-btn-ghost" onClick={async () => { try { setLogoUrl(await removeBackground(logoUrl)); setLogoDims(null); } catch { /* */ } }}>
                {t('brand.removeBg')}
              </button>
            )}
            {logoUrl.trim() && <button type="button" className="org-btn org-btn-ghost" onClick={() => { setLogoUrl(''); setLogoDims(null); }}>{t('view.delete')}</button>}
            {logoUrl.trim() && logoDims && <span className="brand-logo-dims" dir="ltr">{logoDims.w}×{logoDims.h}px</span>}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={onPickLogo} />
          </div>
        </div>
        <input id="lg" dir="ltr" value={logoUrl.startsWith('data:') ? '' : logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
        <span className="org-hint">{t('brand.logoUploadHint')}</span>
      </div>

      <div className="org-form-actions">
        <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
          {busy ? t('form.saving') : t('brand.save')}
        </button>
      </div>
    </form>
  );
}

/** مجموعة اختيار واحدة للنمط — أزرار راديو بلوحة المفاتيح (أسهم) وعلامة اختيار واضحة. */
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
    // RTL: السهم الأيسر يتقدّم للخيار التالي
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
