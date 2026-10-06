import { IconShape } from '@/components/Icon';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function MyHalaqatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);

  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id, organizationId: org.id },
    select: { id: true, name: true },
  });

  const halaqat = teacher
    ? await prisma.halaqa.findMany({
        where: { organizationId: org.id, teacherId: teacher.id },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true, track: true, period: true, _count: { select: { students: true } } },
      })
    : [];

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeQuran')}</span>
          <h1>{t('myh.title')}</h1>
          <p>{teacher ? t('myh.sub', { name: teacher.name }) : t('myh.notTeacher')}</p>
        </div>
      </div>

      {!teacher ? (
        <div className="org-empty"><IconShape name="halaqat" variant="soft" size="xl" /><p>{t('myh.notTeacherBody')}</p></div>
      ) : halaqat.length === 0 ? (
        <div className="org-empty"><IconShape name="halaqat" variant="soft" size="xl" /><p>{t('myh.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>{t('myh.col.name')}</th>
                <th>{t('myh.col.track')}</th>
                <th>{t('myh.col.period')}</th>
                <th>{t('myh.col.students')}</th>
                <th>{t('myh.col.type')}</th>
              </tr>
            </thead>
            <tbody>
              {halaqat.map((h) => (
                <tr key={h.id}>
                  <td><strong>{h.name}</strong></td>
                  <td>{h.track ? t(`htrack.${h.track}`) : '—'}</td>
                  <td>{h.period ? t(`hperiod.${h.period}`) : '—'}</td>
                  <td>{h._count.students}</td>
                  <td><span className="org-chip">{t(`status.halaqa.${h.type}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
