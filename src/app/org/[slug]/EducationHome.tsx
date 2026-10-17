import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  ActivityItem, DashboardMetric, EmptyNote, HalaqaSummary, MobileActionBar, Panel, ProgressSummary,
  QuickAction, Sparkline, StatusBadge, StudentAttentionItem, numFmt,
} from '@/components/dash2/blocks';
import { getEducationOverview } from '@/lib/dashboard/education';
import { getT } from '@/lib/i18n/server';
import { orgKey } from '@/lib/i18n/dictionaries';

/* ============================================================
   الصفحة الرئيسية لجهة مفعَّل فيها التعليم — المدير والمشرف والموظف.
   البيانات من طبقة واحدة (getEducationOverview)؛ التركيب:
   • الجوال (عمود واحد): حضور اليوم ← يحتاجون متابعة ← حلقات اليوم ← إجراءات ← الخطوات ← النشاط
   • سطح المكتب (≥1024): رأس + مقاييس + عمودان (الحلقات | المتابعة والنشاط)
   ============================================================ */

export default async function EducationHome({
  org, user, canManage,
}: {
  org: { id: string; slug: string; name: string; type: string };
  user: { name: string; role: string };
  canManage: boolean;
}) {
  const { t, locale } = await getT();
  const base = `/org/${org.slug}`;
  const data = await getEducationOverview(org.id);
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short' });
  const isStaff = user.role === 'STAFF';

  const { today, halaqat, halaqaCount, students, teachers, attention, recent, week } = data;
  // اتجاه اليوم مقابل آخر يوم سابق مسجَّل (إن وُجد)
  const rates = week.map((w) => w.rate);
  const todayRate = rates[6];
  const prevRate = [...rates.slice(0, 6)].reverse().find((r) => r !== null) ?? null;
  const delta = todayRate !== null && prevRate !== null ? todayRate - prevRate : null;
  const attendanceValue = today.recorded ? `${Math.round((today.present / today.recorded) * 100)}%` : t('eh.att.none');

  const steps = [
    { done: teachers > 0, label: t('eh.step.teacher'), href: `${base}/education/teachers` },
    { done: halaqaCount > 0, label: t('eh.step.halaqa'), href: `${base}/education/halaqat` },
    { done: students > 0, label: t('eh.step.students'), href: `${base}/education/students` },
    { done: data.hasAttendance, label: t('eh.step.attendance'), href: `${base}/education/attendance` },
  ];
  const stepsDone = steps.filter((s) => s.done).length;
  const setupDone = stepsDone === steps.length;

  // الإجراء الأساسي الواحد بحسب حالة المركز
  const primary = halaqaCount === 0
    ? { href: `${base}/education/halaqat`, label: t('eh.cta.firstHalaqa'), icon: 'add' }
    : { href: `${base}/education/attendance`, label: t('eh.cta.attendance'), icon: 'attendance' };

  return (
    <div className="org-page">
      <div className="d2 d2-grid d2-has-actionbar">
        <header className="d2-head">
          <div>
            <span className="d2-eyebrow">{t(orgKey('od.eyebrow', org.type))}</span>
            <h1>{t('od.welcome', { name: user.name })}</h1>
            <p>{org.name} · {t(orgKey(`role.${user.role}`, org.type))}</p>
          </div>
          <div className="d2-head-actions">
            <Link href={primary.href} className="d2-action is-primary"><Icon name={primary.icon} size={18} />{primary.label}</Link>
          </div>
        </header>

        {/* المقياس المحوري: حضور اليوم — ثم الأرقام الداعمة */}
        <div className="d2-metrics o-1">
          <DashboardMetric
            primary label={t('eh.stat.attendanceToday')} value={attendanceValue}
            hint={today.recorded ? t('eh.att.of', { a: numFmt.format(today.present), b: numFmt.format(today.recorded) }) : undefined}
            href={`${base}/education/attendance`}
            trend={delta !== null && delta !== 0 ? { text: `${Math.abs(delta)}%`, dir: delta > 0 ? 'up' : 'down' } : undefined}
            chart={<Sparkline values={rates} label={t('eh.stat.attendanceToday')} />}
          />
          <DashboardMetric bar={1} label={t('eh.stat.students')} value={numFmt.format(students)} href={`${base}/education/students`} />
          <DashboardMetric bar={2} label={t('eh.stat.halaqat')} value={numFmt.format(halaqaCount)} href={`${base}/education/halaqat`} />
          {!isStaff && <DashboardMetric bar={3} label={t('eh.stat.teachers')} value={numFmt.format(teachers)} href={`${base}/education/teachers`} />}
        </div>

        <Panel title={t('eh.followup.title')} className="o-2 d2-col-side">
          {attention.length === 0 ? <EmptyNote>{t('eh.followup.none')}</EmptyNote> : (
            <ul className="d2-list">
              {attention.map((a) => (
                <StudentAttentionItem
                  key={a.id} href={`${base}/education/students/${a.id}`} name={a.name}
                  detail={`${t('eh.followup.absent', { n: a.absences })}${a.halaqaName ? ` · ${a.halaqaName}` : ''}`}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('eh.halaqat.title')} more={{ href: `${base}/education/halaqat`, label: t('eh.halaqat.all') }} className="o-3 d2-col-main">
          {halaqat.length === 0 ? (
            <div>
              <EmptyNote>{t('eh.halaqat.empty')}</EmptyNote>
              <Link href={`${base}/education/halaqat`} className="d2-action is-primary" style={{ marginBlockStart: 8 }}>{t('eh.cta.firstHalaqa')}</Link>
            </div>
          ) : (
            <ul className="d2-list">
              {halaqat.map((h) => (
                <HalaqaSummary
                  key={h.id} href={`${base}/education/halaqat/${h.id}`} name={h.name} schedule={h.schedule}
                  teacher={h.teacherName ?? t('eh.noTeacher')} students={h.students} unit={t('d2.students.unit')}
                  status={h.students === 0 ? <StatusBadge>—</StatusBadge> : h.recorded >= h.students
                    ? <StatusBadge tone="green">{t('eh.att.done')}</StatusBadge>
                    : <StatusBadge tone={h.recorded ? 'amber' : 'muted'}>{h.recorded ? t('eh.att.partial', { a: h.recorded, b: h.students }) : t('eh.att.pending')}</StatusBadge>}
                />
              ))}
            </ul>
          )}
        </Panel>

        <section className="o-4 d2-col-main" aria-label={t('d2.actions.title')}>
          <div className="d2-actions">
            <QuickAction href={`${base}/education/attendance`} icon="attendance" label={t('eh.cta.attendance')} />
            {canManage && <QuickAction href={`${base}/education/students`} icon="students" label={t('eh.cta.newStudent')} />}
            <QuickAction href={`${base}/education/memorization`} icon="memorization" label={t('eh.recent.all')} />
            <QuickAction href={`${base}/education/statistics`} icon="analytics" label={t('onav.statistics')} />
          </div>
        </section>

        {!setupDone && !isStaff && (
          <Panel title={t('eh.setup.title')} className="o-5 d2-col-side" more={undefined}>
            <ProgressSummary value={stepsDone} max={steps.length} label={t('eh.setup.progress', { a: stepsDone, b: steps.length })} />
            <ol className="d2-steps" style={{ marginBlockStart: 8 }}>
              {steps.map((s, i) => (
                <li key={s.label} className={s.done ? 'is-done' : ''}>
                  <span className="d2-step-n" aria-hidden="true">{s.done ? <Icon name="check" size={14} /> : <span className="num-glyph">{i + 1}</span>}</span>
                  {s.done ? <span>{s.label}</span> : <Link href={s.href}>{s.label}</Link>}
                  <span className="sr-only">{s.done ? t('eh.setup.done') : t('eh.setup.todo')}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}

        <Panel title={t('eh.recent.title')} more={{ href: `${base}/education/memorization`, label: t('eh.recent.all') }} className="o-6 d2-col-side" secondary>
          {recent.length === 0 ? <EmptyNote>{t('eh.recent.none')}</EmptyNote> : (
            <ul className="d2-list">
              {recent.map((r, i) => (
                <ActivityItem key={i} name={r.name} text={r.text ?? (r.pages ? t('eh.pages', { n: r.pages }) : t('eh.recorded'))} when={dateFmt.format(r.at)} />
              ))}
            </ul>
          )}
        </Panel>

        {/* شريط الإجراء الثابت على الجوال: الإجراء الأساسي دائمًا في متناول الإبهام */}
        <MobileActionBar>
          <Link href={primary.href} className="d2-action is-primary"><Icon name={primary.icon} size={20} />{primary.label}</Link>
        </MobileActionBar>
      </div>
    </div>
  );
}
