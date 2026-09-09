import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation, canManageEducation } from '@/lib/permissions';
import AssessmentsView from '@/components/education/AssessmentsView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);

  const [rows, students] = await Promise.all([
    prisma.assessment.findMany({
      where: { organizationId: org.id },
      orderBy: { date: 'desc' },
      take: 200,
      select: {
        id: true, title: true, kind: true, score: true, maxScore: true, errors: true, alerts: true,
        result: true, notes: true, date: true, student: { select: { name: true } },
      },
    }),
    prisma.student.findMany({ where: { organizationId: org.id, status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('assess.pageTitle')}</h1>
          <p>{t('assess.pageSub', { n: rows.length, org: org.name })}</p>
        </div>
      </div>
      <AssessmentsView
        students={students}
        canManage={canManageEducation(user)}
        orgName={org.name}
        orgLogo={org.logoUrl}
        assessments={rows.map((a) => ({
          id: a.id, title: a.title, kind: a.kind, score: a.score, maxScore: a.maxScore,
          errors: a.errors, alerts: a.alerts,
          result: a.result, notes: a.notes, studentName: a.student?.name ?? '—', date: a.date.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
