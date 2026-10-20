import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import MemorizationView from '@/components/education/MemorizationView';
import { getStudentScope, studentRelationWhere, studentScopeWhere } from '@/lib/access-scope';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function MemorizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const scope = await getStudentScope(user, org.id); // المعلم: حلقاته فقط

  const [entries, students] = await Promise.all([
    prisma.memorizationEntry.findMany({
      where: { organizationId: org.id, ...studentRelationWhere(scope) },
      orderBy: { date: 'desc' },
      take: 200,
      select: {
        id: true, date: true, kind: true, content: true, rating: true, notes: true,
        student: { select: { name: true } },
      },
    }),
    prisma.student.findMany({ where: { organizationId: org.id, status: 'ACTIVE', ...studentScopeWhere(scope) }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('pg.memorization.title')}</h1>
          <p>{t('pg.memorization.sub', { n: entries.length, org: org.name })}</p>
        </div>
      </div>
      <MemorizationView
        students={students}
        entries={entries.map((e) => ({
          id: e.id, kind: e.kind, content: e.content, rating: e.rating, notes: e.notes,
          studentName: e.student?.name ?? '—', date: e.date.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
