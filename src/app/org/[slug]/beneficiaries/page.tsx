import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewBeneficiaries, canManageBeneficiaries, canSeeBeneficiaryId } from '@/lib/permissions';
import { withBeneficiaryId } from '@/lib/sensitive-fields';
import BeneficiariesView from '@/components/BeneficiariesView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgBeneficiariesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewBeneficiaries(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageBeneficiaries(user);

  const [beneficiaries, departments, programs] = await Promise.all([
    prisma.beneficiary.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, phone: true, nationalId: true, category: true, status: true,
        notes: true, departmentId: true, programId: true,
      },
    }),
    prisma.department.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.program.findMany({ where: { organizationId: org.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeUnits')}</span>
          <h1>{t('pg.beneficiaries.title')}</h1>
          <p>{t('pg.beneficiaries.sub', { n: beneficiaries.length, org: org.name })}</p>
        </div>
      </div>

      <BeneficiariesView
        canManage={canManage}
        departments={departments}
        programs={programs}
        beneficiaries={beneficiaries.map((b) => withBeneficiaryId(b, canSeeBeneficiaryId(user)))}
      />
    </div>
  );
}
