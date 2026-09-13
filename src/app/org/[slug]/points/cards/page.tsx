import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { code39Svg } from '@/lib/barcode';
import { getT } from '@/lib/i18n/server';
import CardsToolbar from '@/components/CardsToolbar';

export const dynamic = 'force-dynamic';

export default async function PointsCardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewPoints(user)) redirect(`/org/${org.slug}`);

  const students = await prisma.student.findMany({
    where: { organizationId: org.id, serial: { not: null } },
    orderBy: { serial: 'asc' },
    select: { id: true, name: true, serial: true, halaqa: { select: { name: true } } },
  });

  return (
    <div className="org-page">
      <div className="org-page-head no-print">
        <div>
          <span className="org-eyebrow">{t('onav.points')}</span>
          <h1>{t('ptsCards.title')}</h1>
          <p>{t('ptsCards.sub')}</p>
        </div>
      </div>
      <div className="no-print"><CardsToolbar /></div>

      {students.length === 0 ? (
        <div className="org-empty no-print">{t('pts.none')}</div>
      ) : (
        <div className="pts-cards">
          {students.map((s) => (
            <div key={s.id} className="pts-card">
              {org.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logoUrl} alt="" className="pts-card-logo" />
              ) : (
                <div className="pts-card-org">{org.name}</div>
              )}
              <div className="pts-card-name">{s.name}</div>
              {s.halaqa?.name && <div className="pts-card-halaqa">{s.halaqa.name}</div>}
              <div className="pts-card-code" dangerouslySetInnerHTML={{ __html: code39Svg(String(s.serial)) }} />
              <div className="pts-card-serial">#{s.serial}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
