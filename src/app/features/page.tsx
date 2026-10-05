import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Reveal from '@/components/Reveal';
import MasraHeader from '@/components/landing/MasraHeader';
import MasraFooter from '@/components/landing/MasraFooter';
import { getT } from '@/lib/i18n/server';
import '@/styles/masra.css';
import '@/styles/home.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('features.meta.title'), description: t('features.meta.desc') };
}

// الوحدات الموجودة فعلًا في مساحة المركز (src/app/org/[slug]/*)
const GROUPS = [
  {
    k: 'edu', img: '/shots/attendance.webp',
    items: [
      ['students', 'students'], ['teachers', 'teachers'], ['halaqat', 'halaqat'], ['attendance', 'attendance'],
      ['memorization', 'memo'], ['assessment', 'exams'], ['target', 'plans'], ['users', 'guardians'],
      ['certificates', 'certs'], ['reports', 'monthly'],
    ],
  },
  {
    k: 'motivation', img: '/shots/exams.webp',
    items: [['qr', 'points'], ['identity', 'cards'], ['statistics', 'display'], ['verified', 'identity']],
  },
  {
    k: 'admin', img: '/shots/orgshell.webp',
    items: [['people/people-permissions', 'users'], ['structure', 'branches'], ['apps', 'modules'], ['identity/identity-digital-identity', 'brand'], ['activities', 'audit']],
  },
  {
    k: 'comms', img: '/shots/schedule.webp',
    items: [['messages', 'messages'], ['events', 'events'], ['documents', 'docs'], ['donations', 'fees'], ['analytics', 'reports'], ['search', 'search']],
  },
] as const;

export default async function FeaturesPage() {
  const { t } = await getT();
  const demoLabel = t('mockup.demo');
  return (
    <div className="mdl mh">
      <MasraHeader />
      <main>
        <section className="mh-page-hero">
          <div className="mh-wrap">
            <Reveal>
              <span className="mh-eyebrow">{t('features.eyebrow')}</span>
              <h1 className="mh-h1">{t('features.title')}</h1>
              <p className="mh-lead">{t('features.lead')}</p>
              <nav className="mh-jump" aria-label={t('features.eyebrow')}>
                {GROUPS.map((g) => <a key={g.k} href={`#${g.k}`}>{t(`features.g.${g.k}`)}</a>)}
              </nav>
            </Reveal>
          </div>
        </section>

        {GROUPS.map((g, gi) => (
          <section key={g.k} id={g.k} className={`mh-section ${gi % 2 ? 'mh-lilac' : ''}`}>
            <div className="mh-wrap">
              <div className={`mh-role ${gi % 2 ? 'is-flip' : ''}`}>
                <Reveal className="mh-role-copy">
                  <h2 className="mh-h2">{t(`features.g.${g.k}`)}</h2>
                  <p className="mh-p">{t(`features.g.${g.k}.d`)}</p>
                </Reveal>
                <Reveal delay={0.1} className="mh-role-media">
                  <figure className="mh-shot">
                    <div className="mh-shot-bar" aria-hidden="true"><i /><i /><i /></div>
                    <Image src={g.img} alt={t(`features.g.${g.k}.d`)} width={1600} height={1000} sizes="(max-width: 960px) 100vw, 600px" />
                    <figcaption className="mh-shot-tag">{demoLabel}</figcaption>
                  </figure>
                </Reveal>
              </div>
              <ul className="mh-cards mh-modules">
                {g.items.map(([, k], i) => (
                  <Reveal key={k} delay={(i % 3) * 0.05}>
                    <li className="mh-card">
                      <h3>{t(`features.m.${k}.t`)}</h3>
                      <p>{t(`features.m.${k}.d`)}</p>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <section className="mh-section">
          <div className="mh-wrap">
            <p className="mh-muted mh-center-text">{t('features.note')}</p>
            <Reveal>
              <div className="mh-cta" style={{ marginTop: 32 }}>
                <h2>{t('cta.title')}</h2>
                <p>{t('cta.lead')}</p>
                <div className="mh-actions">
                  <Link href="/signup" className="mh-btn mh-btn-light">{t('home.cta.signup')}</Link>
                  <Link href="/#pricing" className="mh-link">{t('nav.pricing')}</Link>
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
