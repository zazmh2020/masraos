import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageFees, canViewEducation } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import FeesView from '@/components/FeesView';
import { getStudentScope, studentRelationWhere, studentScopeWhere } from '@/lib/access-scope';

export const dynamic = 'force-dynamic';

export default async function OrgFeesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const scope = await getStudentScope(user, org.id); // المعلم: حلقاته فقط

  const [fees, students] = await Promise.all([
    prisma.studentFee.findMany({
      where: { organizationId: org.id, ...studentRelationWhere(scope) }, orderBy: [{ paid: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, amount: true, dueDate: true, paid: true, student: { select: { name: true } } },
    }),
    prisma.student.findMany({ where: { organizationId: org.id, ...studentScopeWhere(scope) }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeQuran')}</span>
          <h1>{t('fee.pageTitle')}</h1>
          <p>{t('fee.pageSub', { org: org.name })}</p>
        </div>
      </div>
      <FeesView
        canManage={canManageFees(user)}
        students={students}
        fees={fees.map((f) => ({ id: f.id, title: f.title, amount: f.amount, dueDate: f.dueDate ? f.dueDate.toISOString().slice(0, 10) : null, paid: f.paid, studentName: f.student.name }))}
      />
    </div>
  );
}
