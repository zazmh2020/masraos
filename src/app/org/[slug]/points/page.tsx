import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canScanPoints, canManageSettings } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import ScannerConsole from '@/components/points/ScannerConsole';
import PointsConfigForm from '@/components/points/PointsConfigForm';

export const dynamic = 'force-dynamic';

export default async function PointsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canScanPoints(user)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.points')}</span>
          <h1>{t('pts.title')}</h1>
          <p>{t('pts.sub')}</p>
          <span className="pts-perscan"><bdi>{org.pointsPerScan}</bdi> {t('pts.perScan')}</span>
        </div>
      </div>
      {canManageSettings(user) && <PointsConfigForm perScan={org.pointsPerScan} />}
      <ScannerConsole slug={org.slug} perScan={org.pointsPerScan} canRedeem />
    </div>
  );
}
