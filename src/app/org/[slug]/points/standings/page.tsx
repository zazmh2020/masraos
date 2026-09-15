import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import StandingsBoard from '@/components/points/StandingsBoard';

export const dynamic = 'force-dynamic';

export default async function PointsStandingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewPoints(user)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.points')}</span>
          <h1>{t('ptsStand.title')}</h1>
          <p>{t('ptsStand.sub')}</p>
        </div>
      </div>
      <StandingsBoard orgName={org.name} logoUrl={org.logoUrl} />
    </div>
  );
}
