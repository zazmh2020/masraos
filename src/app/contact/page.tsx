import Link from 'next/link';
import V2Header from '@/components/v2/V2Header';
import V2Footer from '@/components/v2/V2Footer';
import { getT } from '@/lib/i18n/server';
import '@/styles/masra.css';
import '@/styles/v2.css'; // الرأس والتذييل الموحّدان

export default async function ContactPage() {
  const { t } = await getT();
  return (
    <div className="mdl">
      <V2Header solid />
      <main id="main" className="mdl-contact">
        <div className="mdl-wrap">
          <span className="mdl-eyebrow">{t('contact.preview')}</span>
          <h1>{t('contact.title')}</h1>
          <p className="mdl-lead">{t('contact.lead')}</p>
          <div className="mdl-contact-grid">
            <section className="mdl-contact-card" aria-labelledby="contact-status">
              <h2 id="contact-status">{t('contact.status')}</h2>
              <p>{t('contact.detail')}</p>
            </section>
            <section className="mdl-contact-card" aria-labelledby="contact-next">
              <h2 id="contact-next">{t('contact.next')}</h2>
              <p>{t('contact.nextDetail')}</p>
              <div className="mdl-hero-actions">
                <Link className="mdl-btn mdl-btn-primary" href="/#systems">{t('hero.cta.explore')}</Link>
                <Link className="mdl-btn" href="/#pricing">{t('nav.pricing')}</Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <V2Footer />
    </div>
  );
}
