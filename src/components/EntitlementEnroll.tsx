'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { ENTITLEMENT_AGREEMENT } from '@/lib/entitlement-agreement';

interface Props {
  eligible: boolean;
  enrolled: boolean;
  years: number | null;
  planName: string;
  startPreview: string;   // ISO — اليوم
  targetPreview: string;  // ISO — التاريخ المتوقّع
  detailsHref: string;
  agreementVersion: string;
  termsVersion: string;
}

export default function EntitlementEnroll(p: Props) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [want, setWant] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [readOpened, setReadOpened] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const df = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  if (!p.eligible && !p.enrolled) return null; // الباقة المجانية غير مؤهّلة

  if (p.enrolled) {
    return (
      <div className="org-panel ent-enrolled">
        <div>
          <h2>{t('ent.title')}</h2>
          <p className="org-panel-sub" style={{ margin: '0.3rem 0 0' }}>{t('ent.alreadyEnrolled')}</p>
        </div>
        <Link href={p.detailsHref} className="org-btn org-btn-primary">{t('ent.viewDetails')}</Link>
      </div>
    );
  }

  async function enroll() {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/org/entitlement/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed: true, agreementVersion: p.agreementVersion, termsVersion: p.termsVersion }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { router.refresh(); }
      else setError(d.error ?? t('form.saveErr'));
    } catch { setError(t('form.netErr')); }
    finally { setBusy(false); }
  }

  return (
    <div className="org-panel ent-optin">
      <div className="ent-optin-head">
        <div>
          <span className="ent-optin-badge">{t('ent.optional')}</span>
          <h2>{t('ent.title')}</h2>
          <p>{t('ent.blurb')}</p>
        </div>
      </div>

      <label className="ent-toggle">
        <input type="checkbox" checked={want} onChange={(e) => { setWant(e.target.checked); if (!e.target.checked) { setAgreed(false); } }} />
        <span>{t('ent.wantJoin')}</span>
      </label>

      {want && (
        <div className="ent-detail">
          <div className="ent-years">{t('ent.durationForPlan')}<strong>{t('ent.years', { n: p.years ?? 0 })}</strong></div>

          <div className="ent-summary">
            <div className="ent-row"><span>{t('ent.currentPlan')}</span><strong>{p.planName}</strong></div>
            <div className="ent-row"><span>{t('ent.duration')}</span><strong>{t('ent.years', { n: p.years ?? 0 })}</strong></div>
            <div className="ent-row"><span>{t('ent.startDate')}</span><strong>{df.format(new Date(p.startPreview))}</strong></div>
            <div className="ent-row"><span>{t('ent.targetDate')}</span><strong>{df.format(new Date(p.targetPreview))}</strong></div>
          </div>

          <div className="ent-gets">
            <h4>{t('ent.getsTitle')}</h4>
            <ul>
              <li>{t('ent.get1')}</li>
              <li>{t('ent.get2')}</li>
              <li>{t('ent.get3')}</li>
            </ul>
          </div>

          <div className="ent-agree">
            <h4>{ENTITLEMENT_AGREEMENT.title}</h4>
            <button type="button" className="org-btn org-btn-outline" onClick={() => { setShowAgreement(true); setReadOpened(true); }}>
              {t('ent.readFull')}
            </button>
            <label className={`ent-check ${readOpened ? '' : 'is-disabled'}`}>
              <input type="checkbox" checked={agreed} disabled={!readOpened} onChange={(e) => setAgreed(e.target.checked)} />
              <span>{t('ent.consent')}</span>
            </label>
            {!readOpened && <p className="ent-hint">{t('ent.mustRead')}</p>}
          </div>

          {error && <div className="org-alert" style={{ marginTop: '0.6rem' }}>{error}</div>}

          <button className="org-btn org-btn-primary ent-confirm" disabled={!agreed || busy} onClick={enroll}>
            {busy ? t('form.saving') : t('ent.confirmJoin')}
          </button>
        </div>
      )}

      {showAgreement && (
        <div className="ent-modal-scrim" onClick={() => setShowAgreement(false)}>
          <div className="ent-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ent-modal-head">
              <h3>{ENTITLEMENT_AGREEMENT.title}</h3>
              <button type="button" className="ent-modal-x" aria-label={t('shell.cancel')} onClick={() => setShowAgreement(false)}>×</button>
            </div>
            <div className="ent-modal-body">
              <p className="ent-modal-intro">{ENTITLEMENT_AGREEMENT.intro}</p>
              {ENTITLEMENT_AGREEMENT.sections.map((s, i) => (
                <section key={i} className="ent-modal-sec">
                  <h4>{s.heading}</h4>
                  {s.paragraphs?.map((para, j) => <p key={j}>{para}</p>)}
                  {s.bullets && <ul>{s.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                </section>
              ))}
              <p className="ent-modal-ver">{t('ent.version', { v: ENTITLEMENT_AGREEMENT.version })}</p>
            </div>
            <div className="ent-modal-foot">
              <button type="button" className="org-btn org-btn-primary" onClick={() => setShowAgreement(false)}>{t('ent.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
