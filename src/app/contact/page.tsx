import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import V2Header from '@/components/v2/V2Header';
import SiteSplash from '@/components/SiteSplash';
import V2Footer from '@/components/v2/V2Footer';
import SiteAssistant from '@/components/v2/SiteAssistant';
import { PageHero } from '@/components/v2/blocks';
import { getT } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/platform-settings';
import '@/styles/v2.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('nav.contact')} — ${t('brand')}`, description: t('contact.lead') };
}

/** روابط آمنة فقط: https للروابط الخارجية، وأرقام فقط لروابط الهاتف وواتساب. */
const safeUrl = (u: string | null) => (u && /^https:\/\//i.test(u.trim()) ? u.trim() : null);
const digits = (v: string) => v.replace(/[^\d+]/g, '');
const whatsappHref = (v: string) => safeUrl(v) ?? (digits(v).replace(/^\+/, '') ? `https://wa.me/${digits(v).replace(/^\+/, '')}` : null);

// «خطوتك التالية مع مَسرى» — لا نموذج ولا جمع بيانات (استقبال الطلبات غير مفعّل)؛
// قنوات التواصل تظهر فقط إن أدخلها مالك المنصة في الإعدادات.
export default async function ContactPage() {
  const [{ t }, settings] = await Promise.all([getT(), getPlatformSettings()]);
  const channels = [
    settings.contactEmail && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(settings.contactEmail.trim()) ? { label: t('pg.contact.email'), value: settings.contactEmail, href: `mailto:${settings.contactEmail.trim()}` } : null,
    settings.contactPhone && digits(settings.contactPhone) ? { label: t('pg.contact.phone'), value: settings.contactPhone, href: `tel:${digits(settings.contactPhone)}` } : null,
    settings.whatsapp && whatsappHref(settings.whatsapp) ? { label: t('pg.contact.whatsapp'), value: settings.whatsapp, href: whatsappHref(settings.whatsapp)!, external: true } : null,
    safeUrl(settings.twitterUrl) ? { label: 'X', value: settings.twitterUrl!, href: safeUrl(settings.twitterUrl)!, external: true } : null,
    safeUrl(settings.instagramUrl) ? { label: 'Instagram', value: settings.instagramUrl!, href: safeUrl(settings.instagramUrl)!, external: true } : null,
  ].filter((c): c is { label: string; value: string; href: string; external?: boolean } => !!c);

  return (
    <div className="v2">
      <SiteSplash />
      <V2Header />
      <main id="main">
        <PageHero eyebrow={t('contact.preview')} title={t('contact.title')} lead={t('contact.lead')} />

        <section className="v2-section">
          <div className="v2-wrap v2-duo-light">
            <Reveal>
              <div>
                <span className="v2-draft">{t('contact.status')}</span>
                <p className="v2-lead v2-mt">{t('contact.detail')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                <h2 className="v2-h3">{t('contact.next')}</h2>
                <p className="v2-lead v2-mt">{t('contact.nextDetail')}</p>
                <div className="v2-actions">
                  <Link href="/signup" className="v2-btn v2-btn-primary">{t('pg.cta.signup')}</Link>
                  <Link href="/pricing" className="v2-link">{t('pg.cta.compare')} <span className="v2-arrow" aria-hidden="true">←</span></Link>
                </div>
                <p className="v2-faq-more">{t('pg.contact.haveAccount')} <Link href="/login" className="v2-link">{t('nav.login')}</Link></p>
              </div>
            </Reveal>
          </div>
        </section>

        {channels.length > 0 && (
          <section className="v2-section v2-tint">
            <div className="v2-wrap">
              <h2 className="v2-h3">{t('pg.contact.channels')}</h2>
              <ul className="v2-channels">
                {channels.map((c) => (
                  <li key={c.label}>
                    <span>{c.label}</span>
                    <a href={c.href} dir="ltr" {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.value}</a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <V2Footer />
      <SiteAssistant />
    </div>
  );
}
