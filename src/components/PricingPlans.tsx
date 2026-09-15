'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLANS, yearlyPrice } from '@/lib/plans';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { convertRounded, currencySymbol, formatAmount } from '@/lib/currency';

export default function PricingPlans() {
  const { t, locale } = useLocale();
  const { currency } = useCurrency();
  const [yearly, setYearly] = useState(false);
  const cur = currencySymbol(currency, locale);
  const en = locale === 'en';
  // يحوّل مبلغًا بالريال إلى العملة المختارة وينسّقه
  const money = (sar: number) => formatAmount(convertRounded(sar, currency), locale);

  return (
    <div className="pricing-wrap">
      <div className="pricing-controls">
        {/* مفتاح التبديل شهري / سنوي */}
        <div className="billing-toggle" role="group" aria-label={t('plan.billing.monthly')}>
          <button
            type="button"
            className={`billing-opt ${!yearly ? 'is-active' : ''}`}
            onClick={() => setYearly(false)}
            aria-pressed={!yearly}
          >
            {t('plan.billing.monthly')}
          </button>
          <button
            type="button"
            className={`billing-opt ${yearly ? 'is-active' : ''}`}
            onClick={() => setYearly(true)}
            aria-pressed={yearly}
          >
            {t('plan.billing.yearly')}
            <span className="billing-save">{t('plan.billing.save')}</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {PLANS.map((p) => {
          const year = yearlyPrice(p);
          const isPaid = p.price !== null && p.price > 0;
          const name = en ? p.en : p.name;
          const tag = en ? p.name : p.en;
          const tagline = en ? (p.tagEn ?? p.tagline) : p.tagline;
          const features = en ? (p.featuresEn ?? p.features) : p.features;
          return (
            <article key={p.id} className={`plan-card ${p.highlighted ? 'is-featured' : ''}`}>
              {p.highlighted && <span className="plan-badge">{t('plan.badge')}</span>}
              <div className="plan-name-row">
                <h3 className="plan-name">{name}</h3>
                <span className="plan-tag">{tag}</span>
              </div>
              <p className="plan-tagline">{tagline}</p>

              <div className="plan-price">
                {p.price === null ? (
                  <span className="plan-custom">{t('plan.custom')}</span>
                ) : p.price === 0 ? (
                  <span className="plan-custom">{t('plan.free')}</span>
                ) : yearly ? (
                  <>
                    <span className="plan-amount">{money(year as number)}</span>
                    <span className="plan-period">{cur} {t('plan.perYear')}</span>
                    <span className="plan-permonth">
                      {t('plan.approxMonth', { v: money(Math.round((year as number) / 12)), c: cur })}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="plan-amount">{money(p.price)}</span>
                    <span className="plan-period">{cur} {t('plan.perMonth')}</span>
                  </>
                )}
              </div>

              <ul className="plan-features">
                {features.map((f) => (
                  <li key={f}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
                    {f}
                  </li>
                ))}
              </ul>

              {p.entitlementYears != null && (
                <div className="plan-entitlement">
                  <span className="plan-ent-label">{t('plan.entitlement', { n: p.entitlementYears })}</span>
                  <span className="plan-ent-optional">{t('ent.optional')}</span>
                </div>
              )}

              {p.price === 0 ? (
                <Link href="/login" className={`plan-cta ${p.highlighted ? 'is-primary' : ''}`}>{t('plan.cta.free')}</Link>
              ) : (
                <a href="#contact" className={`plan-cta ${p.highlighted ? 'is-primary' : ''}`}>
                  {isPaid ? t('plan.cta.subscribe') : t('plan.cta.contact')}
                </a>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
