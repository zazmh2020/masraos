import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function HalaqaDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;

  const halaqa = await prisma.halaqa.findFirst({
    where: { id, organizationId: org.id },
    select: {
      id: true, name: true, type: true, track: true, period: true, schedule: true,
      teacher: { select: { name: true } },
      students: { orderBy: { name: 'asc' }, select: { id: true, name: true, phone: true, status: true } },
    },
  });
  if (!halaqa) notFound();

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <Link href={`${base}/education/halaqat`} className="org-back-link">← {t('hub.edu.halaqat')}</Link>
          <h1>{halaqa.name}</h1>
          <p>{t(`status.halaqa.${halaqa.type}`)}{halaqa.schedule ? ` · ${halaqa.schedule}` : ''}</p>
        </div>
      </div>

      <div className="org-card-tags" style={{ marginBottom: '1rem' }}>
        {halaqa.track && <span className="org-chip org-chip-track">{t(`htrack.${halaqa.track}`)}</span>}
        {halaqa.period && <span className="org-chip org-chip-period">{t(`hperiod.${halaqa.period}`)}</span>}
        <span className="org-chip">{t('edu.hq.teacherLabel', { v: halaqa.teacher?.name ?? '—' })}</span>
        <span className="org-chip">{t('edu.hq.studentsLabel', { n: halaqa.students.length })}</span>
      </div>

      <div className="org-panel">
        <h2>{t('pg.students.title')}</h2>
        {halaqa.students.length === 0 ? <p className="org-panel-sub">{t('edu.st.noneInHalaqa')}</p> : (
          <div className="org-table-wrap">
            <table className="org-table">
              <thead><tr><th>{t('edu.st.thStudent')}</th><th>{t('view.status')}</th><th></th></tr></thead>
              <tbody>
                {halaqa.students.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`${base}/education/students/${s.id}`} className="org-link"><strong>{s.name}</strong></Link>{s.phone && <small dir="ltr">{s.phone}</small>}</td>
                    <td>{t(`status.student.${s.status}`)}</td>
                    <td className="org-row-actions"><Link href={`${base}/education/monthly?student=${s.id}`} className="org-btn org-btn-quiet">{t('stu.openSheet')}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
