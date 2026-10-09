import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import V2Header from '@/components/v2/V2Header';
import V2Footer from '@/components/v2/V2Footer';
import V2Tour from '@/components/v2/V2Tour';
import SiteAssistant from '@/components/v2/SiteAssistant';
import { CtaBand, PageHero, SectionHead } from '@/components/v2/blocks';
import { getT } from '@/lib/i18n/server';
import '@/styles/v2.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t('footer.features')} — ${t('brand')}`, description: t('pg.feat.lead') };
}

// المجالات ووحداتها — مطابقة لما في لوحة المركز فعلًا (src/app/org/[slug]/* و src/lib/modules.ts)
const AREAS: { key: string; count: number }[] = [
  { key: 'edu', count: 9 },
  { key: 'mot', count: 4 },
  { key: 'org', count: 6 },
  { key: 'com', count: 6 },
  { key: 'opt', count: 6 },
];

// «المزايا» — كل ما يحتاجه مركزك، في نظام واحد (الدليل ص21)
export default async function FeaturesPage() {
  const { t } = await getT();
  return (
    <div className="v2">
      <V2Header />
      <main id="main">
        <PageHero eyebrow={t('pg.feat.eyebrow')} title={t('pg.feat.title')} lead={t('pg.feat.lead')} />

        <section className="v2-section">
          <div className="v2-wrap v2-areas">
            {AREAS.map(({ key, count }) => (
              <Reveal key={key} className="v2-area">
                <div>
                  <h2>{t(`pg.feat.${key}.t`)}</h2>
                  <span className="v2-count">{t('pg.feat.count', { n: count })}</span>
                  <p>{t(`pg.feat.${key}.d`)}</p>
                </div>
                <div>
                  <ul className="v2-checks v2-checks-2col">
                    {Array.from({ length: count }, (_, i) => <li key={i}><Icon name="check" size={16} />{t(`pg.feat.${key}.${i + 1}`)}</li>)}
                  </ul>
                  {key === 'com' && <p className="v2-note">{t('pg.feat.aiNote')}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="v2-section v2-tint">
          <div className="v2-wrap">
            <SectionHead eyebrow={t('sec.systems.eyebrow')} title={t('v2.tour.title')} lead={t('v2.tour.lead')} />
            <Reveal delay={0.1}><V2Tour /></Reveal>
          </div>
        </section>

        <CtaBand />
      </main>
      <V2Footer />
      <SiteAssistant />
    </div>
  );
}
