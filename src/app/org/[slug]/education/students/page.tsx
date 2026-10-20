import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import StudentsView from '@/components/education/StudentsView';
import { getStudentScope, halaqaScopeWhere, studentScopeWhere } from '@/lib/access-scope';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const scope = await getStudentScope(user, org.id); // المعلم: حلقاته فقط

  const [students, halaqat] = await Promise.all([
    prisma.student.findMany({
      where: { organizationId: org.id, ...studentScopeWhere(scope) },
      orderBy: [{ serial: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true, serial: true, section: true, name: true, phone: true, guardianName: true, guardianPhone: true,
        status: true, halaqaId: true,
      },
    }),
    prisma.halaqa.findMany({ where: { organizationId: org.id, ...halaqaScopeWhere(scope) }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('pg.students.title')}</h1>
          <p>{t('pg.students.sub', { n: students.length, org: org.name })}</p>
        </div>
      </div>
      <StudentsView students={students} halaqat={halaqat} basePath={`/org/${org.slug}/education/students`} />
    </div>
  );
}
