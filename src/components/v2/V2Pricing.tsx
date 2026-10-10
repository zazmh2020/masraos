'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { useLocale, useT } from '@/lib/i18n/LocaleProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { CURRENCIES, convertRounded, formatAmount } from '@/lib/currency';
import { CurrencySymbol } from '@/components/RiyalSign';
import { plans } from '@/components/landing/PricingPreview';
import AnimatedAmount from '@/components/v2/motion/AnimatedAmount';

/** ملخص الباقات (نفس بيانات العرض المقترح) — التفاصيل الكاملة والسياسة في /pricing. */
export default function V2Pricing() {
  const t = useT();
  const { locale } = useLocale();
  const { currency } = useCurrency();
  const lang = locale === 'en' ? 1 : 0;
  // الأسعار المقترحة بالدولار؛ المحوّل المشترك يستقبل مبالغ بالريال
  const amount = (usd: number) => convertRounded(usd / CURRENCIES.USD.rate, currency);
  const fmt = (n: number) => formatAmount(n, locale);

  return (
    <>
      <div className="v2-plans">
        {plans.map((plan, i) => (
          <article key={plan.price} className={`v2-plan ${i === 1 ? 'is-featured' : ''}`}>
            {i === 1 && <span className="v2-plan-flag">{t('v2.pricing.featured')}</span>}
            <h3>{plan.name[lang]}</h3>
            <p className="v2-plan-desc">{plan.description[lang]}</p>
            <div className="v2-plan-rule" aria-hidden="true" />
            <p className="v2-plan-price">
              <b dir="ltr"><AnimatedAmount value={amount(plan.price)} format={fmt} /></b>
              <span><CurrencySymbol code={currency} locale={locale} /> {t('v2.pricing.month')}</span>
            </p>
            <small className="v2-muted">{t('v2.pricing.proposed')}</small>
            <ul className="v2-plan-list">
              {plan.features.slice(0, 4).map((f) => <li key={f[1]}><span className="v2-tick" aria-hidden="true"><Icon name="check" size={13} /></span>{f[lang]}</li>)}
            </ul>
            <p className="v2-plan-limits">{plan.limits[lang]}</p>
            <Link href={`/pricing#preview-plan-${i}`} className={`v2-btn ${i === 1 ? 'v2-btn-light' : 'v2-btn-outline'} v2-plan-cta`}>{t('v2.pricing.preview')}</Link>
          </article>
        ))}
      </div>
      <div className="v2-plans-foot">
        <p className="v2-muted">{t('v2.pricing.impact')}</p>
        <Link href="/pricing" className="v2-link">{t('v2.pricing.more')} <span className="v2-arrow" aria-hidden="true">←</span></Link>
      </div>
    </>
  );
}
