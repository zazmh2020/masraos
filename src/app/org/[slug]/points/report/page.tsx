import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function PointsReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  if (!canViewPoints(user)) redirect(`/org/${org.slug}`);

  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const rows = await prisma.pointsTransaction.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, kind: true, source: true, amount: true, balanceAfter: true, createdAt: true,
      student: { select: { name: true, serial: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.points')}</span>
          <h1>{t('ptsRep.title')}</h1>
          <p>{t('ptsRep.sub')}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="org-empty">{t('pts.none')}</div>
      ) : (
        <div className="dash-card">
          <table className="dash-table">
            <thead>
              <tr>
                <th>{t('pts.th.student')}</th>
                <th>{t('pts.th.type')}</th>
                <th>{t('pts.th.source')}</th>
                <th>{t('pts.th.amount')}</th>
                <th>{t('pts.th.balance')}</th>
                <th>{t('pts.th.date')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sign = r.kind === 'DEDUCT' ? '−' : '+';
                return (
                  <tr key={r.id}>
                    <td>{r.student.name} <span style={{ color: 'var(--text-muted)' }}>#{r.student.serial}</span></td>
                    <td>{t(`pts.kind.${r.kind}`)}</td>
                    <td>{t(`pts.src.${r.source}`)}</td>
                    <td style={{ color: r.kind === 'DEDUCT' ? 'var(--gold-600)' : 'var(--success)', fontWeight: 700 }}>{sign}{r.amount}</td>
                    <td>{r.balanceAfter}</td>
                    <td>{dateFmt.format(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
