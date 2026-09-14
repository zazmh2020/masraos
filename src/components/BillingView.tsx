'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type PlanOpt = { id: string; name: string; price: number | null; paid: boolean; current: boolean };

export default function BillingView({
  plans, statusMsg, configured, subscriptionStatus, renewsAt, currency,
}: {
  plans: PlanOpt[]; statusMsg: 'success' | 'cancel' | null; configured: boolean;
  subscriptionStatus: string | null; renewsAt: string | null; currency: string;
}) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function checkout(plan: string) {
    setBusy(plan); setMsg(null);
    try {
      const res = await fetch('/api/org/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
      const d = await res.json().catch(() => ({}));
      if (d.url) { window.location.assign(d.url); return; }
      setMsg(d.reason === 'not_configured' ? t('bill.notConfigured') : (d.error ?? t('bill.failed')));
    } catch { setMsg(t('form.netErr')); } finally { setBusy(null); }
  }
  async function portal() {
    setBusy('__portal'); setMsg(null);
    try {
      const res = await fetch('/api/org/billing/portal', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (d.url) { window.location.assign(d.url); return; }
      setMsg(d.reason === 'not_configured' ? t('bill.notConfigured') : d.reason === 'no_customer' ? t('bill.noSub') : t('bill.failed'));
    } catch { setMsg(t('form.netErr')); } finally { setBusy(null); }
  }

  const active = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return (
    <>
      {statusMsg === 'success' && <div className="qm-sendmsg is-ok">{t('bill.thanks')}</div>}
      {statusMsg === 'cancel' && <div className="qm-sendmsg is-err">{t('bill.canceled')}</div>}
      {msg && <div className="org-alert">{msg}</div>}
      {!configured && <div className="org-alert">{t('bill.notConfigured')}</div>}

      <div className="org-panel">
        <h2>{t('bill.current')}</h2>
        <div className="org-card-meta" style={{ fontSize: '0.95rem' }}>
          <span><strong>{plans.find((p) => p.current)?.name ?? '—'}</strong></span>
          {subscriptionStatus && <span className={`org-status ${active ? 'org-reqstatus-approved' : 'org-reqstatus-pending'}`}>{t(`bill.status.${subscriptionStatus}`, {})}</span>}
          {renewsAt && <span>{t('bill.renews', { d: dateFmt.format(new Date(renewsAt)) })}</span>}
        </div>
        {active && (
          <button className="org-btn org-btn-outline" disabled={busy === '__portal'} onClick={portal} style={{ marginTop: '0.8rem' }}>
            {busy === '__portal' ? t('form.saving') : t('bill.manage')}
          </button>
        )}
      </div>

      <div className="bill-plans">
        {plans.map((p) => (
          <div key={p.id} className={`org-panel bill-plan ${p.current ? 'is-current' : ''}`}>
            <h3>{p.name}</h3>
            <div className="bill-price">{p.price === null ? t('plan.custom') : p.price === 0 ? t('plan.free') : `${p.price} ${currency}`}<small>{p.price ? `/${t('plan.perMonthShort')}` : ''}</small></div>
            {p.current ? (
              <span className="bill-current-tag">{t('bill.yourPlan')}</span>
            ) : p.paid ? (
              <button className="org-btn org-btn-primary" disabled={busy === p.id} onClick={() => checkout(p.id)}>{busy === p.id ? t('form.saving') : t('bill.subscribe')}</button>
            ) : p.price === null ? (
              <span className="bill-current-tag">{t('bill.contactUs')}</span>
            ) : (
              <span className="bill-current-tag">{t('plan.free')}</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
