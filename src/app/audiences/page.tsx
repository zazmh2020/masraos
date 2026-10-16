import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import V2Header from '@/components/v2/V2Header';
import SiteSplash from '@/components/SiteSplash';
import V2Footer from '@/components/v2/V2Footer';
import SiteAssistant from '@/components/v2/SiteAssistant';
import { CtaBand, PageHero, SectionHead } from '@/components/v2/blocks';
import { SECTORS } from '@/lib/org-types';
import { getT } from '@/lib/i18n/server';
import '@/styles/v2.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('pg.aud.title')} — ${t('brand')}`, description: t('pg.aud.lead') };
}

// «لمن مَسرى» — مصدر الحقيقة: حالة القطاع في src/lib/org-types.ts (المتاح الآن مقابل المخطط له)
export default async function AudiencesPage() {
  const { t } = await getT();
  const active = SECTORS.filter((s) => s.status === 'ACTIVE');
  const planned = SECTORS.filter((s) => s.status !== 'ACTIVE');
  return (
    <div className="v2">
      <SiteSplash />
      <V2Header />
      <main id="main">
        <PageHero eyebrow={t('pg.aud.eyebrow')} title={t('pg.aud.title')} lead={t('pg.aud.lead')} />

        <section className="v2-section">
          <div className="v2-wrap v2-split">
            <Reveal>
              <span className="v2-badge is-available">{t('pg.available')}</span>
              <h2 className="v2-h2">{t('pg.aud.now.title')}</h2>
              <p className="v2-lead">{t('pg.aud.now.d')}</p>
              <div className="v2-actions">
                <Link href="/signup" className="v2-btn v2-btn-primary">{t('pg.cta.signup')}</Link>
                <Link href="/features" className="v2-link">{t('pg.cta.features')} <span className="v2-arrow" aria-hidden="true">←</span></Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              {active.map((s) => <h3 key={s.id} className="v2-list-title">{t(s.labelKey)}</h3>)}
              <ul className="v2-checks v2-checks-lined">
                {[1, 2, 3, 4, 9].map((n) => <li key={n}><Icon name="check" size={16} />{t(`pg.feat.edu.${n}`)}</li>)}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="v2-section v2-tint">
          <div className="v2-wrap">
            <SectionHead eyebrow={t('pg.aud.later.eyebrow')} title={t('pg.aud.later.title')} lead={t('pg.aud.later.lead')} />
            <div className="v2-feature-grid">
              {planned.map((s, i) => (
                <Reveal key={s.id} delay={(i % 3) * 0.05}>
                  <div className="v2-feature is-onTint">
                    <span className={`v2-badge ${s.status === 'COMING_SOON' ? 'is-soon' : 'is-future'}`}>{t(s.status === 'COMING_SOON' ? 'pg.soon' : 'pg.future')}</span>
                    <h3>{t(s.labelKey)}</h3>
                    <p>{t(s.descKey)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <CtaBand />
      </main>
      <V2Footer />
      <SiteAssistant />
    </div>
  );
}
