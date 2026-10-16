import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import V2Header from '@/components/v2/V2Header';
import SiteSplash from '@/components/SiteSplash';
import V2Footer from '@/components/v2/V2Footer';
import SiteAssistant from '@/components/v2/SiteAssistant';
import { CtaBand, Eyebrow, PageHero, SectionHead } from '@/components/v2/blocks';
import { getT } from '@/lib/i18n/server';
import '@/styles/v2.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('pg.about.title')} — ${t('brand')}`, description: t('pg.about.lead') };
}

// «ما هو مَسرى؟» — التعريف ووعد المنتج (الدليل ص7) والتموضع (ص48)
export default async function AboutPage() {
  const { t } = await getT();
  return (
    <div className="v2">
      <SiteSplash />
      <V2Header />
      <main id="main">
        <PageHero eyebrow={t('pg.about.eyebrow')} title={t('pg.about.title')} lead={t('pg.about.lead')} />

        <section className="v2-section">
          <div className="v2-wrap">
            <SectionHead eyebrow={t('pg.about.promise.eyebrow')} title={t('pg.about.promise.title')} />
            <ol className="v2-promise">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <li key={n}>
                  <Reveal delay={((n - 1) % 3) * 0.05}>
                    <span className="v2-num">{String(n).padStart(2, '0')}</span>
                    <h3>{t(`pg.about.p${n}.t`)}</h3>
                    <p>{t(`pg.about.p${n}.d`)}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="v2-section v2-tint">
          <div className="v2-wrap v2-split">
            <Reveal>
              <Eyebrow>{t('pg.about.pos.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('pg.about.pos.title')}</h2>
              <p className="v2-lead">{t('pg.about.pos.lead')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h3 className="v2-list-title">{t('pg.about.not.title')}</h3>
              <ul className="v2-not">
                {[1, 2, 3, 4, 5, 6].map((n) => <li key={n}><Icon name="close" size={14} />{t(`pg.about.not.${n}`)}</li>)}
              </ul>
            </Reveal>
          </div>
        </section>

        <CtaBand />
      </main>
      <V2Footer />
      <SiteAssistant />
    </div>
  );
}
