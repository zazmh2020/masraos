'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { PlatformSettings } from '@/lib/platform-settings';

/** تخصيص المحتوى العام للمنصّة — لمالك المنصّة. */
export default function PlatformContentForm({ initial }: { initial: PlatformSettings }) {
  const t = useT();
  const router = useRouter();

  const [heroTitle1, setHeroTitle1] = useState(initial.heroTitle1 ?? '');
  const [heroTitle2, setHeroTitle2] = useState(initial.heroTitle2 ?? '');
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle ?? '');
  const [announcement, setAnnouncement] = useState(initial.announcement ?? '');
  const [announcementLink, setAnnouncementLink] = useState(initial.announcementLink ?? '');
  const [announcementActive, setAnnouncementActive] = useState(initial.announcementActive);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(initial.contactPhone ?? '');
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? '');
  const [twitterUrl, setTwitterUrl] = useState(initial.twitterUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(initial.instagramUrl ?? '');

  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroTitle1, heroTitle2, heroSubtitle,
          announcement, announcementLink, announcementActive,
          contactEmail, contactPhone, whatsapp, twitterUrl, instagramUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setStatus({ kind: 'error', msg: data.error ?? t('form.saveErr') });
      else { setStatus({ kind: 'ok', msg: t('brand.saved') }); router.refresh(); }
    } catch {
      setStatus({ kind: 'error', msg: t('form.netErr') });
    } finally { setBusy(false); }
  }

  return (
    <form className="org-form oid-form" onSubmit={save}>
      {status && <div className={`org-alert ${status.kind === 'ok' ? 'is-ok' : ''}`}>{status.msg}</div>}

      {/* ===== شريط الإعلان ===== */}
      <h3 className="oid-h">{t('apc.announcement')}</h3>
      <label className="brand-toggle">
        <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} />
        {t('apc.announcementActive')}
      </label>
      <div className="org-field">
        <label htmlFor="pc-ann">{t('apc.announcementText')}</label>
        <input id="pc-ann" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} maxLength={300} placeholder={t('apc.announcementPlaceholder')} />
      </div>
      <div className="org-field">
        <label htmlFor="pc-ann-link">{t('apc.announcementLink')}</label>
        <input id="pc-ann-link" dir="ltr" value={announcementLink} onChange={(e) => setAnnouncementLink(e.target.value)} maxLength={2048} placeholder="/pricing  ·  https://…" />
        <span className="field-hint">{t('apc.announcementLinkHint')}</span>
      </div>

      {/* ===== نصوص الصفحة الرئيسية ===== */}
      <h3 className="oid-h">{t('apc.hero')}</h3>
      <div className="org-field-row">
        <div className="org-field">
          <label htmlFor="pc-h1">{t('apc.heroTitle1')}</label>
          <input id="pc-h1" value={heroTitle1} onChange={(e) => setHeroTitle1(e.target.value)} maxLength={120} placeholder={t('apc.overrideHint')} />
        </div>
        <div className="org-field">
          <label htmlFor="pc-h2">{t('apc.heroTitle2')}</label>
          <input id="pc-h2" value={heroTitle2} onChange={(e) => setHeroTitle2(e.target.value)} maxLength={120} placeholder={t('apc.overrideHint')} />
        </div>
      </div>
      <div className="org-field">
        <label htmlFor="pc-sub">{t('apc.heroSubtitle')}</label>
        <textarea id="pc-sub" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} maxLength={400} rows={2} placeholder={t('apc.overrideHint')} />
      </div>

      {/* ===== بيانات التواصل ===== */}
      <h3 className="oid-h">{t('apc.contact')}</h3>
      <div className="org-field-row">
        <div className="org-field">
          <label htmlFor="pc-email">{t('apc.email')}</label>
          <input id="pc-email" type="email" dir="ltr" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@example.com" />
        </div>
        <div className="org-field">
          <label htmlFor="pc-phone">{t('apc.phone')}</label>
          <input id="pc-phone" dir="ltr" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+9665…" />
        </div>
      </div>
      <div className="org-field-row">
        <div className="org-field">
          <label htmlFor="pc-wa">{t('aorg.id.whatsapp')}</label>
          <input id="pc-wa" dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+9665…" />
        </div>
        <div className="org-field">
          <label htmlFor="pc-x">{t('aorg.id.twitter')}</label>
          <input id="pc-x" dir="ltr" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/…" />
        </div>
      </div>
      <div className="org-field">
        <label htmlFor="pc-ig">{t('aorg.id.instagram')}</label>
        <input id="pc-ig" dir="ltr" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" />
      </div>

      <div className="org-form-actions">
        <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
          {busy ? t('form.saving') : t('brand.save')}
        </button>
      </div>
    </form>
  );
}
