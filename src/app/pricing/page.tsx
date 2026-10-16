import type { Metadata } from 'next';
import V2Header from '@/components/v2/V2Header';
import SiteSplash from '@/components/SiteSplash';
import V2Footer from '@/components/v2/V2Footer';
import PricingPreview from '@/components/landing/PricingPreview';
import SiteAssistant from '@/components/v2/SiteAssistant';
import { getT } from '@/lib/i18n/server';
import '@/styles/masra.css';
import '@/styles/pricing.css';
import '@/styles/v2.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('nav.pricing')} — ${t('brand')}`, description: t('sec.pricing.lead') };
}

// صفحة الباقات الكاملة: مرشد اختيار الباقة، والخدمات والحدود، وبرنامج الاستحقاق — الرئيسية تعرض ملخصًا يقود إليها
export default async function PricingPage() {
  const { t } = await getT();
  return (
    <div className="v2">
      <SiteSplash />
      <V2Header />
      <main id="main">
        <section className="v2-page-hero">
          <div className="v2-wrap">
            <span className="v2-eyebrow is-onDeep">{t('sec.pricing.eyebrow')}</span>
            <h1>{t('sec.pricing.title')}</h1>
            <p className="v2-hero-sub">{t('sec.pricing.lead')}</p>
            <span className="v2-draft">{t('v2.pricing.tag')}</span>
          </div>
        </section>
        <section className="v2-section">
          {/* PricingPreview مبني على متغيّرات .mdl — display:contents يمرّرها دون صندوق إضافي */}
          <div className="v2-wrap"><div className="mdl v2-contents"><PricingPreview /></div></div>
        </section>
      </main>
      <V2Footer />
      <SiteAssistant />
    </div>
  );
}
