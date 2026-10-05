import Link from 'next/link';
import MasraHeader from '@/components/landing/MasraHeader';
import { getT } from '@/lib/i18n/server';
import '@/styles/masra.css';

export default async function ContactPage() {
  const { t } = await getT();
  return (
    <div className="mdl">
      <MasraHeader />
      <main className="mdl-contact">
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
      <footer className="mdl-footer">
        <div className="mdl-wrap">
          <p>{t('footer.desc')}</p>
          <div className="mdl-contact-footer">
            <Link href="/">{t('nav.home')}</Link>
            <Link href="/privacy">{t('footer.privacy')}</Link>
            <Link href="/terms">{t('footer.terms')}</Link>
          </div>
          <p>{t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
