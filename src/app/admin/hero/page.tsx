import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';
import HeroManager, { type Slide } from '@/components/HeroManager';

export const dynamic = 'force-dynamic';

export default async function AdminHeroPage() {
  const { t } = await getT();
  const rows = await prisma.heroSlide.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  const slides: Slide[] = rows.map((s) => ({
    id: s.id, title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl,
    ctaText: s.ctaText, ctaLink: s.ctaLink, order: s.order, status: s.status,
    startAt: s.startAt ? s.startAt.toISOString() : null,
    endAt: s.endAt ? s.endAt.toISOString() : null,
    enabled: s.enabled,
  }));

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{t('heroCms.title')}</h1>
          <p>{t('heroCms.sub')}</p>
        </div>
      </div>
      <div className="section-block">
        <div style={{ maxWidth: 840, marginInline: 'auto' }}>
          <HeroManager initial={slides} />
        </div>
      </div>
    </div>
  );
}
