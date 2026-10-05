import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import MasraHeader from '@/components/landing/MasraHeader';
import MasraFooter from '@/components/landing/MasraFooter';
import { getT } from '@/lib/i18n/server';
import '@/styles/masra.css';
import '@/styles/home.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('about.meta.title'), description: t('about.meta.desc') };
}

const PRINCIPLES = ['arabic', 'roles', 'honest', 'ai'];

export default async function AboutPage() {
  const { t } = await getT();
  return (
    <div className="mdl mh">
      <MasraHeader />
      <main>
        <section className="mh-page-hero">
          <div className="mh-wrap">
            <Reveal>
              <span className="mh-eyebrow">{t('about.eyebrow')}</span>
              <h1 className="mh-h1">{t('about.title')}</h1>
              <p className="mh-lead">{t('about.lead')}</p>
            </Reveal>
          </div>
        </section>

        <section className="mh-section">
          <div className="mh-wrap mh-people">
            <Reveal className="mh-people-copy">
              <h2 className="mh-h2">{t('about.why.title')}</h2>
              <p className="mh-p">{t('about.why.lead')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mh-h3">{t('about.promise.title')}</h2>
              <ul className="mh-lines">
                {[1, 2, 3, 4, 5, 6].map((n) => <li key={n}>{t(`about.promise.${n}`)}</li>)}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="mh-section mh-lilac">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-head"><h2 className="mh-h2">{t('about.principles.title')}</h2></div>
            </Reveal>
            <div className="mh-cards mh-cards-4">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p} delay={i * 0.05}>
                  <div className="mh-card">
                    <h3>{t(`about.p.${p}.t`)}</h3>
                    <p>{t(`about.p.${p}.d`)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mh-section">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-head"><h2 className="mh-h2">{t('about.status.title')}</h2></div>
            </Reveal>
            <div className="mh-status">
              <Reveal>
                <div className="mh-card mh-status-now">
                  <span className="mh-status-label">{t('about.status.now')}</span>
                  <p>{t('about.status.now.d')}</p>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="mh-card">
                  <span className="mh-status-label">{t('about.status.next')}</span>
                  <p>{t('about.status.next.d')}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="mh-section">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-cta">
                <h2>{t('cta.title')}</h2>
                <p>{t('cta.lead')}</p>
                <div className="mh-actions">
                  <Link href="/signup" className="mh-btn mh-btn-light">{t('home.cta.signup')}</Link>
                  <Link href="/features" className="mh-link">{t('nav.features')}</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <MasraFooter />
    </div>
  );
}
