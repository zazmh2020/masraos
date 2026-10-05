import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Icon from '@/components/Icon';
import DashboardShell from '@/components/dash/DashboardShell';
import StatCard from '@/components/dash/StatCard';
import { getT } from '@/lib/i18n/server';
import { orgKey } from '@/lib/i18n/dictionaries';

/* ============================================================
   الصفحة الرئيسية لجهة مفعَّل فيها التعليم (مراكز القرآن والمراكز التعليمية):
   الطلاب والحلقات وحضور اليوم أولًا، مع قائمة «خطواتك الأولى» للمركز الجديد.
   الجهات التي لا تستخدم التعليم تبقى على اللوحة العامة دون تغيير.
   ============================================================ */

const numFmt = new Intl.NumberFormat('en-US');

/** «اليوم» بنفس تعريف شاشة الحضور (تاريخ UTC بصيغة YYYY-MM-DD). */
function todayUtc(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

export default async function EducationHome({
  org, user, canManage,
}: {
  org: { id: string; slug: string; name: string; type: string };
  user: { name: string; role: string };
  canManage: boolean;
}) {
  const { t, locale } = await getT();
  const base = `/org/${org.slug}`;
  const w = { organizationId: org.id };
  const today = todayUtc();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short' });

  const [students, teachers, halaqat, todayAttendance, absences, recentQuran, recentMemo, anyAttendance] = await Promise.all([
    prisma.student.count({ where: { ...w, status: 'ACTIVE' } }),
    prisma.teacher.count({ where: { ...w, isActive: true } }),
    prisma.halaqa.findMany({
      where: w, orderBy: { name: 'asc' }, take: 8,
      select: { id: true, name: true, schedule: true, teacher: { select: { name: true } }, _count: { select: { students: { where: { status: 'ACTIVE' } } } } },
    }),
    prisma.attendanceRecord.groupBy({ by: ['halaqaId', 'status'], where: { ...w, date: today }, _count: { _all: true } }),
    prisma.attendanceRecord.groupBy({
      by: ['studentId'], where: { ...w, status: 'ABSENT', date: { gte: weekAgo } }, _count: { _all: true },
      having: { studentId: { _count: { gte: 2 } } }, orderBy: { _count: { studentId: 'desc' } }, take: 5,
    }),
    prisma.quranDailyRecord.findMany({
      where: w, orderBy: { date: 'desc' }, take: 5,
      select: { date: true, newNote: true, pages: true, student: { select: { name: true } } },
    }),
    prisma.memorizationEntry.findMany({
      where: w, orderBy: { date: 'desc' }, take: 5,
      select: { date: true, content: true, student: { select: { name: true } } },
    }),
    prisma.attendanceRecord.findFirst({ where: w, select: { id: true } }),
  ]);

  const halaqaCount = await prisma.halaqa.count({ where: w });
  const absentStudents = absences.length
    ? await prisma.student.findMany({ where: { ...w, id: { in: absences.map((a) => a.studentId) } }, select: { id: true, name: true, halaqa: { select: { name: true } } } })
    : [];
  const absentById = new Map(absentStudents.map((s) => [s.id, s]));

  // حضور اليوم: المسجَّل والحاضر (الحاضر + المتأخر)
  const recordedByHalaqa = new Map<string, number>();
  let recorded = 0, present = 0;
  for (const g of todayAttendance) {
    recorded += g._count._all;
    if (g.status === 'PRESENT' || g.status === 'LATE') present += g._count._all;
    recordedByHalaqa.set(g.halaqaId, (recordedByHalaqa.get(g.halaqaId) ?? 0) + g._count._all);
  }
  const attendanceValue = recorded ? `${Math.round((present / recorded) * 100)}%` : t('eh.att.none');

  const recent = [
    ...recentQuran.map((r) => ({ name: r.student.name, text: r.newNote || (r.pages ? t('eh.pages', { n: r.pages }) : t('eh.recorded')), at: r.date })),
    ...recentMemo.map((m) => ({ name: m.student.name, text: m.content, at: m.date })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 5);

  // خطواتك الأولى — تختفي بعد اكتمالها
  const steps = [
    { done: teachers > 0, label: t('eh.step.teacher'), href: `${base}/education/teachers` },
    { done: halaqaCount > 0, label: t('eh.step.halaqa'), href: `${base}/education/halaqat` },
    { done: students > 0, label: t('eh.step.students'), href: `${base}/education/students` },
    { done: !!anyAttendance, label: t('eh.step.attendance'), href: `${base}/education/attendance` },
  ];
  const setupDone = steps.every((s) => s.done);

  // الإجراء الأساسي الواحد بحسب حالة المركز
  const primary = halaqaCount === 0
    ? { href: `${base}/education/halaqat`, label: t('eh.cta.firstHalaqa'), icon: 'actions/actions-add' }
    : { href: `${base}/education/attendance`, label: t('eh.cta.attendance'), icon: 'education/education-attendance' };

  return (
    <div className="org-page">
      <DashboardShell>
        <div className="dash-hd">
          <div>
            <span className="dash-eyebrow">{t(orgKey('od.eyebrow', org.type))}</span>
            <h1>{t('od.welcome', { name: user.name })}</h1>
            <p className="dash-sub">{org.name} · {t('od.role')} <strong>{t(orgKey(`role.${user.role}`, org.type))}</strong></p>
          </div>
          <div className="dash-hd-actions">
            <Link href={primary.href} className="dash-btn"><Icon name={primary.icon} size={16} /> {primary.label}</Link>
            {canManage && halaqaCount > 0 && <Link href={`${base}/education/students`} className="dash-link">{t('eh.cta.newStudent')} ←</Link>}
          </div>
        </div>

        <div className="dash-stats">
          <StatCard icon="people/people-students" color="purple" label={t('eh.stat.students')} value={numFmt.format(students)} />
          <StatCard icon="education/education-quran" color="green" label={t('eh.stat.halaqat')} value={numFmt.format(halaqaCount)} />
          <StatCard icon="people/people-users" color="blue" label={t('eh.stat.teachers')} value={numFmt.format(teachers)} />
          <StatCard icon="education/education-attendance" color="gold" label={t('eh.stat.attendanceToday')} value={attendanceValue}
            trend={recorded ? t('eh.att.of', { a: numFmt.format(present), b: numFmt.format(recorded) }) : undefined} />
        </div>

        {!setupDone && (
          <div className="dash-card eh-setup">
            <div className="dash-card-hd"><h3>{t('eh.setup.title')}</h3><span className="dash-link">{t('eh.setup.progress', { a: steps.filter((s) => s.done).length, b: steps.length })}</span></div>
            <ol className="eh-steps">
              {steps.map((s, i) => (
                <li key={s.label} className={s.done ? 'is-done' : ''}>
                  <span className="eh-step-n" aria-hidden="true">{s.done ? <Icon name="check" size={14} /> : i + 1}</span>
                  {s.done ? <span>{s.label}</span> : <Link href={s.href}>{s.label}</Link>}
                  <span className="sr-only">{s.done ? t('eh.setup.done') : t('eh.setup.todo')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="dash-grid-bottom">
          <div className="dash-card">
            <div className="dash-card-hd">
              <h3>{t('eh.halaqat.title')}</h3>
              <Link href={`${base}/education/halaqat`} className="dash-link">{t('eh.halaqat.all')} ←</Link>
            </div>
            {halaqat.length === 0 ? (
              <div className="eh-empty">
                <p>{t('eh.halaqat.empty')}</p>
                <Link href={`${base}/education/halaqat`} className="dash-btn">{t('eh.cta.firstHalaqa')}</Link>
              </div>
            ) : (
              <table className="dash-table">
                <thead><tr><th>{t('eh.th.halaqa')}</th><th>{t('eh.th.teacher')}</th><th>{t('eh.th.students')}</th><th>{t('eh.th.today')}</th></tr></thead>
                <tbody>
                  {halaqat.map((h) => {
                    const n = h._count.students; const r = recordedByHalaqa.get(h.id) ?? 0;
                    return (
                      <tr key={h.id}>
                        <td><Link href={`${base}/education/halaqat/${h.id}`} className="dash-link">{h.name}</Link>{h.schedule && <div className="eh-muted">{h.schedule}</div>}</td>
                        <td>{h.teacher?.name ?? <span className="eh-muted">{t('eh.noTeacher')}</span>}</td>
                        <td>{numFmt.format(n)}</td>
                        <td>{n === 0 ? <span className="eh-muted">—</span> : r >= n
                          ? <span className="dash-badge green">{t('eh.att.done')}</span>
                          : <span className="dash-badge muted">{r ? t('eh.att.partial', { a: r, b: n }) : t('eh.att.pending')}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="dash-side">
            <div className="dash-card">
              <div className="dash-card-hd"><h3>{t('eh.followup.title')}</h3></div>
              {absences.length === 0 ? (
                <p className="dash-ann-empty">{t('eh.followup.none')}</p>
              ) : (
                <ul className="eh-list">
                  {absences.map((a) => {
                    const s = absentById.get(a.studentId);
                    return s ? (
                      <li key={a.studentId}>
                        <Link href={`${base}/education/students/${s.id}`} className="dash-link">{s.name}</Link>
                        <span className="eh-muted">{t('eh.followup.absent', { n: a._count._all })}{s.halaqa?.name ? ` · ${s.halaqa.name}` : ''}</span>
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>{t('eh.recent.title')}</h3>
                <Link href={`${base}/education/memorization`} className="dash-link">{t('eh.recent.all')} ←</Link>
              </div>
              {recent.length === 0 ? (
                <p className="dash-ann-empty">{t('eh.recent.none')}</p>
              ) : (
                <ul className="eh-list">
                  {recent.map((r, i) => (
                    <li key={i}><strong>{r.name}</strong><span className="eh-muted">{r.text} · {dateFmt.format(r.at)}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
