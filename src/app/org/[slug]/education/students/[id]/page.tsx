import { recentStudentTimeline } from '@/lib/student-timeline';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import { canManageRegistration } from '@/lib/student-registration';

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
      quranRecords: { where: { organizationId: org.id }, orderBy: { date: 'desc' }, take: 20 },
      fees: { where: { organizationId: org.id }, orderBy: { createdAt: 'desc' }, take: 6 },
      attendance: { where: { organizationId: org.id }, orderBy: { date: 'desc' }, take: 20, select: { id: true, date: true, status: true } },
      memorization: { where: { organizationId: org.id }, orderBy: { date: 'desc' }, take: 20, select: { id: true, date: true, kind: true, content: true, rating: true } },
      assessments: { where: { organizationId: org.id }, orderBy: { date: 'desc' }, take: 20, select: { id: true, date: true, title: true, result: true } },
    },
  });
  if (!student) notFound();

  const recentQuran = student.quranRecords.slice(0, 8);
  const totalPages = recentQuran.reduce((s, r) => s + (r.pages ?? 0), 0);
  const present = recentQuran.filter((r) => r.attendance === 'PRESENT' || r.attendance === 'LATE').length;
  const feeDue = student.fees.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);
  const timeline = recentStudentTimeline([
    ...student.quranRecords.map(r => ({ id: `daily-${r.id}`, date: r.date, kind: 'memorization' as const, detail: t('stu.timelineDaily', { n: r.pages ?? 0 }) })),
    ...student.attendance.map(r => ({ id: `attendance-${r.id}`, date: r.date, kind: 'attendance' as const, detail: t(`status.attendance.${r.status}`) })),
    ...student.memorization.map(r => ({ id: `memorization-${r.id}`, date: r.date, kind: 'memorization' as const, detail: r.content })),
    ...student.assessments.map(r => ({ id: `assessment-${r.id}`, date: r.date, kind: 'assessment' as const, detail: r.title })),
  ]);


  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <Link href={`${base}/education/students`} className="org-back-link">← {t('pg.students.title')}</Link>
          <h1>{student.name}</h1>
          {canManageRegistration(user) && <Link className="org-btn org-btn-primary" href={`${base}/education/students/${id}/registration`}>{t('stu.registrationLink')}</Link>}
          <p>{student.halaqa ? student.halaqa.name : t('edu.st.noHalaqa')} · {t(`status.student.${student.status}`)}</p>
        </div>
      </div>

      <div className="org-stats">
        <div className="org-stat"><div className="org-stat-label">{t('qm.sumPages', { n: '' }).replace(/[:：].*$/, '')}</div><div className="org-stat-value">{numFmt.format(totalPages)}</div><small>{t('stu.recentScope')}</small></div>
        <div className="org-stat"><div className="org-stat-label">{t('stu.presentDays')}</div><div className="org-stat-value">{present}/{recentQuran.length}</div><small>{t('stu.recentScope')}</small></div>
        <div className="org-stat"><div className="org-stat-label">{t('fee.totalDue')}</div><div className="org-stat-value">{numFmt.format(feeDue)}</div><small>{t('stu.feeScope')}</small></div>
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
          {recentQuran.length === 0 ? <p className="org-panel-sub">{t('edu.mz.none')}</p> : (
            <ul className="stu-records">
              {recentQuran.map((r) => (
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

      <section className="org-panel stu-timeline" aria-labelledby="student-timeline-title">
        <h2 id="student-timeline-title">{t('stu.timeline')}</h2>
        <p className="org-panel-sub">{t('stu.timelineHint')}</p>
        {timeline.length === 0 ? <p>{t('stu.timelineEmpty')}</p> : <ol className="stu-timeline-list">
          {timeline.map(event => <li key={event.id}>
            <time dateTime={event.date.toISOString()}>{dateFmt.format(event.date)}</time>
            <div><strong>{t(`stu.timeline${event.kind[0].toUpperCase()}${event.kind.slice(1)}`)}</strong><p dir="auto">{event.detail}</p></div>
          </li>)}
        </ol>}
      </section>

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
