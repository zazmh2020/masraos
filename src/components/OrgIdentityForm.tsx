'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';

type Props = {
  apiBase: string;
  subdomain: string; // العنوان الفرعي التلقائي (للعرض فقط)
  brandColor?: string | null;
  brandAccent?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  coverUrl?: string | null;
  tagline?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  whatsapp?: string | null;
  customDomain?: string | null;
  allowCustomDomain?: boolean; // تسمح باقة المؤسسة بالدومين المخصّص؟
  name: string;
};

/** تخصيص شامل لهوية المؤسسة: بصرية + رقمية + الدومين — يستخدمه مالك المنصّة. */
export default function OrgIdentityForm(p: Props) {
  const t = useT();
  const router = useRouter();

  const [enabled, setEnabled] = useState(!!p.brandColor);
  const [color, setColor] = useState((p.brandColor ?? '') || '#6B57A0');
  const [accent, setAccent] = useState((p.brandAccent ?? '') || '#2F9E7E');
  const [logoUrl, setLogoUrl] = useState(p.logoUrl ?? '');
  const [faviconUrl, setFaviconUrl] = useState(p.faviconUrl ?? '');
  const [coverUrl, setCoverUrl] = useState(p.coverUrl ?? '');
  const [tagline, setTagline] = useState(p.tagline ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(p.websiteUrl ?? '');
  const [twitterUrl, setTwitterUrl] = useState(p.twitterUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(p.instagramUrl ?? '');
  const [whatsapp, setWhatsapp] = useState(p.whatsapp ?? '');
  const [customDomain, setCustomDomain] = useState(p.customDomain ?? '');

  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch(p.apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandColor: enabled ? color : '',
          brandAccent: enabled ? accent : '',
          logoUrl, faviconUrl, coverUrl,
          tagline, websiteUrl, twitterUrl, instagramUrl, whatsapp,
          // لا نرسل الدومين إلا إن كانت الباقة تسمح (وإلا يبقى بلا تغيير)
          ...(p.allowCustomDomain ? { customDomain } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setStatus({ kind: 'error', msg: data.error ?? t('form.saveErr') });
      else { setStatus({ kind: 'ok', msg: t('brand.saved') }); router.refresh(); }
    } catch {
      setStatus({ kind: 'error', msg: t('form.netErr') });
    } finally { setBusy(false); }
  }

  const primary = enabled ? color : '#6B57A0';
  const secondary = enabled ? accent : '#2F9E7E';

  return (
    <form className="org-form oid-form" onSubmit={save}>
      {status && <div className={`org-alert ${status.kind === 'ok' ? 'is-ok' : ''}`}>{status.msg}</div>}

      {/* معاينة حيّة */}
      <div className="oid-preview" style={{ ['--bc' as string]: primary, ['--ac' as string]: secondary }}>
        {coverUrl.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="oid-cover" />
        )}
        <div className="oid-preview-bar">
          {logoUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="oid-preview-logo" />
          ) : (
            <span className="oid-preview-mark">{p.name.slice(0, 1)}</span>
          )}
          <span className="oid-preview-titles">
            <span className="oid-preview-name">{p.name}</span>
            {tagline.trim() && <span className="oid-preview-tag">{tagline}</span>}
          </span>
        </div>
        <div className="oid-preview-body">
          <span className="oid-preview-btn">{t('brand.previewBtn')}</span>
          <span className="oid-preview-chip">{t('brand.previewChip')}</span>
        </div>
      </div>

      {/* ===== الهوية البصرية ===== */}
      <h3 className="oid-h">{t('aorg.id.visual')}</h3>
      <label className="brand-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t('brand.useCustom')}
      </label>
      {enabled && (
        <div className="org-field-row">
          <div className="org-field">
            <label htmlFor="oid-color">{t('brand.primaryColor')}</label>
            <div className="brand-color-row">
              <input id="oid-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <input type="text" dir="ltr" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6B57A0" />
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="oid-accent">{t('aorg.id.accent')}</label>
            <div className="brand-color-row">
              <input id="oid-accent" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
              <input type="text" dir="ltr" value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#2F9E7E" />
            </div>
          </div>
        </div>
      )}
      <div className="org-field-row">
        <div className="org-field">
          <label htmlFor="oid-logo">{t('brand.logo')}</label>
          <input id="oid-logo" dir="ltr" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
        </div>
        <div className="org-field">
          <label htmlFor="oid-favicon">{t('aorg.id.favicon')}</label>
          <input id="oid-favicon" dir="ltr" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} placeholder="https://…/favicon.png" />
        </div>
      </div>
      <div className="org-field">
        <label htmlFor="oid-cover">{t('aorg.id.cover')}</label>
        <input id="oid-cover" dir="ltr" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…/cover.jpg" />
      </div>

      {/* ===== الهوية الرقمية ===== */}
      <h3 className="oid-h">{t('aorg.id.digital')}</h3>
      <div className="org-field">
        <label htmlFor="oid-tag">{t('aorg.id.tagline')}</label>
        <input id="oid-tag" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={t('aorg.id.taglinePlaceholder')} maxLength={160} />
      </div>
      <div className="org-field-row">
        <div className="org-field">
          <label htmlFor="oid-web">{t('aorg.id.website')}</label>
          <input id="oid-web" dir="ltr" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="org-field">
          <label htmlFor="oid-wa">{t('aorg.id.whatsapp')}</label>
          <input id="oid-wa" dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+9665…" />
        </div>
      </div>
      <div className="org-field-row">
        <div className="org-field">
          <label htmlFor="oid-x">{t('aorg.id.twitter')}</label>
          <input id="oid-x" dir="ltr" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/…" />
        </div>
        <div className="org-field">
          <label htmlFor="oid-ig">{t('aorg.id.instagram')}</label>
          <input id="oid-ig" dir="ltr" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" />
        </div>
      </div>

      {/* ===== الدومين ===== */}
      <h3 className="oid-h">{t('aorg.id.domain')}</h3>
      <div className="org-field">
        <label>{t('aorg.id.subdomain')}</label>
        <div className="oid-subdomain" dir="ltr">{p.subdomain}</div>
        <span className="org-hint">{t('aorg.id.subdomainHint')}</span>
      </div>
      <div className="org-field">
        <label htmlFor="oid-domain">{t('aorg.id.customDomain')}</label>
        {p.allowCustomDomain ? (
          <>
            <input id="oid-domain" dir="ltr" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="example.com" />
            <span className="org-hint">{t('aorg.id.customDomainHint')}</span>
          </>
        ) : (
          <div className="oid-locked">{t('aorg.id.customDomainLocked')}</div>
        )}
      </div>

      <div className="org-form-actions">
        <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
          {busy ? t('form.saving') : t('brand.save')}
        </button>
      </div>
    </form>
  );
}
