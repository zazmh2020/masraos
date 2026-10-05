import type { Metadata } from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import MasraHeader from '@/components/landing/MasraHeader';
import MasraFooter from '@/components/landing/MasraFooter';
import { getT } from '@/lib/i18n/server';
import '@/styles/masra.css';
import '@/styles/home.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('contact.meta.title'), description: t('contact.meta.desc') };
}

// لا نموذج ولا جمع بيانات هنا: استقبال الطلبات غير مفعّل بعد (يفرضه landing-content.test.ts).
export default async function ContactPage() {
  const { t } = await getT();
  return (
    <div className="mdl mh">
      <MasraHeader />
      <main>
        <section className="mh-page-hero">
          <div className="mh-wrap">
            <span className="mh-eyebrow">{t('contact.preview')}</span>
            <h1 className="mh-h1">{t('contact.title')}</h1>
            <p className="mh-lead">{t('contact.lead')}</p>
          </div>
        </section>
        <section className="mh-section mh-section-tight">
          <div className="mh-wrap mh-status">
            <section className="mh-card" aria-labelledby="contact-status">
              <span className="mh-ic"><Icon name="messages" size={20} /></span>
              <h2 id="contact-status">{t('contact.status')}</h2>
              <p>{t('contact.detail')}</p>
            </section>
            <section className="mh-card" aria-labelledby="contact-next">
              <span className="mh-ic"><Icon name="forward" size={20} className="mh-dir" /></span>
              <h2 id="contact-next">{t('contact.next')}</h2>
              <p>{t('contact.nextDetail')}</p>
              <div className="mh-actions">
                <Link className="mh-btn mh-btn-primary" href="/signup">{t('home.cta.signup')}</Link>
                <Link className="mh-btn mh-btn-ghost" href="/#pricing">{t('nav.pricing')}</Link>
              </div>
            </section>
          </div>
        </section>
      </main>
      <MasraFooter />
    </div>
  );
}
