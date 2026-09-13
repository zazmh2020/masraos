import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canScanPoints } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

const STEPS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export default async function PointsGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canScanPoints(user)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.points')}</span>
          <h1>{t('ptsGuide.title')}</h1>
          <p>{t('ptsGuide.intro')}</p>
        </div>
      </div>

      <ol className="pts-guide-steps">
        {STEPS.map((s, i) => (
          <li key={s} className="pts-guide-step">
            <span className="pts-guide-num">{i + 1}</span>
            <div className="pts-guide-body">
              <strong>{t(`ptsGuide.${s}t`)}</strong>
              <p>{t(`ptsGuide.${s}d`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="pts-guide-notes">
        <h2>{t('ptsGuide.notesTitle')}</h2>
        <ul>
          <li>{t('ptsGuide.n1')}</li>
          <li>{t('ptsGuide.n2')}</li>
          <li>{t('ptsGuide.n3')}</li>
        </ul>
      </div>
    </div>
  );
}
