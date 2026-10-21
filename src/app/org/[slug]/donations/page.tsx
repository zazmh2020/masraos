import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewDonations, canManageDonations, canSeeDonors } from '@/lib/permissions';
import { withDonor } from '@/lib/sensitive-fields';
import DonationsView from '@/components/DonationsView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgDonationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewDonations(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageDonations(user);

  const [donations, campaigns, receivedAgg] = await Promise.all([
    prisma.donation.findMany({
      where: { organizationId: org.id },
      orderBy: { donatedAt: 'desc' },
      select: {
        id: true, donorName: true, amount: true, method: true, status: true, note: true,
        donatedAt: true, campaignId: true,
      },
    }),
    prisma.campaign.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.donation.aggregate({ where: { organizationId: org.id, status: 'RECEIVED' }, _sum: { amount: true } }),
  ]);

  const totalReceived = receivedAgg._sum.amount ?? 0;

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeUnits')}</span>
          <h1>{t('pg.donations.title')}</h1>
          <p>{t('pg.donations.sub', { n: donations.length, org: org.name })}</p>
        </div>
      </div>

      <DonationsView
        canManage={canManage}
        campaigns={campaigns}
        totalReceived={totalReceived}
        donations={donations.map((d) => ({
          id: d.id, donorName: withDonor(d, canSeeDonors(user)).donorName, amount: d.amount, method: d.method, status: d.status,
          note: d.note, campaignId: d.campaignId, donatedAt: d.donatedAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
