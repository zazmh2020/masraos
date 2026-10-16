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
  return { title: `${t('footer.aboutUs')} — ${t('brand')}`, description: t('pg.us.lead') };
}

// «من نحن» — بُني مَسرى لعمل مراكز القرآن اليومي (الدليل ص21) — بلا أسماء فريق أو أرقام مختلَقة
export default async function AboutMasraPage() {
  const { t } = await getT();
  return (
    <div className="v2">
      <SiteSplash />
      <V2Header />
      <main id="main">
        <PageHero eyebrow={t('pg.us.eyebrow')} title={t('pg.us.title')} lead={t('pg.us.lead')} />

        <section className="v2-section">
          <div className="v2-wrap v2-split">
            <Reveal>
              <Eyebrow>{t('pg.us.why.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('pg.us.why.title')}</h2>
              <p className="v2-lead">{t('pg.us.why.d')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h3 className="v2-list-title">{t('pg.us.promise.title')}</h3>
              <ul className="v2-checks v2-checks-lined">
                {[1, 2, 3, 4, 5].map((n) => <li key={n}><Icon name="check" size={16} />{t(`pg.us.promise.${n}`)}</li>)}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="v2-section v2-tint">
          <div className="v2-wrap">
            <SectionHead eyebrow={t('pg.us.how.eyebrow')} title={t('pg.us.how.title')} />
            <div className="v2-feature-grid v2-grid-4">
              {[1, 2, 3, 4].map((n) => (
                <Reveal key={n} delay={(n - 1) * 0.05}>
                  <div className="v2-feature is-onTint"><h3>{t(`pg.us.h${n}.t`)}</h3><p>{t(`pg.us.h${n}.d`)}</p></div>
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
