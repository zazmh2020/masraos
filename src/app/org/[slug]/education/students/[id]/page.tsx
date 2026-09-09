import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');

export default async function StudentProfilePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric' });

  const student = await prisma.student.findFirst({
    where: { id, organizationId: org.id },
    select: {
      id: true, name: true, phone: true, guardianName: true, guardianPhone: true, guardianEmail: true, status: true,
      halaqa: { select: { id: true, name: true } },
      quranRecords: { orderBy: { date: 'desc' }, take: 8 },
      fees: { orderBy: { createdAt: 'desc' }, take: 6 },
    },
  });
  if (!student) notFound();

  const totalPages = student.quranRecords.reduce((s, r) => s + (r.pages ?? 0), 0);
  const present = student.quranRecords.filter((r) => r.attendance !== 'ABSENT').length;
  const feeDue = student.fees.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <Link href={`${base}/education/students`} className="org-back-link">← {t('pg.students.title')}</Link>
          <h1>{student.name}</h1>
          <p>{student.halaqa ? student.halaqa.name : t('edu.st.noHalaqa')} · {t(`status.student.${student.status}`)}</p>
        </div>
      </div>

      <div className="org-stats">
        <div className="org-stat"><div className="org-stat-label">{t('qm.sumPages', { n: '' }).replace(/[:：].*$/, '')}</div><div className="org-stat-value">{numFmt.format(totalPages)}</div></div>
        <div className="org-stat"><div className="org-stat-label">{t('stu.presentDays')}</div><div className="org-stat-value">{present}/{student.quranRecords.length}</div></div>
        <div className="org-stat"><div className="org-stat-label">{t('fee.totalDue')}</div><div className="org-stat-value">{numFmt.format(feeDue)}</div></div>
      </div>

      <div className="org-report-grid">
        <div className="org-panel">
          <h2>{t('stu.info')}</h2>
          <ul className="stu-info">
            <li><span>{t('edu.st.phone')}</span><b dir="ltr">{student.phone ?? '—'}</b></li>
            <li><span>{t('edu.st.guardianName')}</span><b>{student.guardianName ?? '—'}</b></li>
            <li><span>{t('edu.st.guardianPhone')}</span><b dir="ltr">{student.guardianPhone ?? '—'}</b></li>
            <li><span>{t('edu.st.guardianEmail')}</span><b dir="ltr">{student.guardianEmail ?? '—'}</b></li>
          </ul>
          <Link href={`${base}/education/monthly?student=${student.id}`} className="org-btn org-btn-primary">{t('stu.openSheet')}</Link>
        </div>

        <div className="org-panel">
          <h2>{t('stu.recentRecords')}</h2>
          {student.quranRecords.length === 0 ? <p className="org-panel-sub">{t('edu.mz.none')}</p> : (
            <ul className="stu-records">
              {student.quranRecords.map((r) => (
                <li key={r.id}>
                  <span>{dateFmt.format(new Date(r.date))}</span>
                  <span>{r.newFrom != null ? `${r.newFrom}→${r.newTo ?? ''}` : '—'}</span>
                  <span className={r.attendance === 'ABSENT' ? 'stu-absent' : ''}>{t(`status.attendance.${r.attendance}`)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="org-panel">
        <h2>{t('fee.pageTitle')}</h2>
        {student.fees.length === 0 ? <p className="org-panel-sub">{t('fee.none')}</p> : (
          <ul className="stu-records">
            {student.fees.map((f) => (
              <li key={f.id}>
                <span>{f.title}</span>
                <span>{numFmt.format(f.amount)}</span>
                <span className={f.paid ? '' : 'stu-absent'}>{f.paid ? t('fee.paid') : t('fee.unpaid')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
