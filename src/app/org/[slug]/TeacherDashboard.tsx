import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  ActivityItem, DashboardMetric, EmptyNote, HalaqaSummary, MobileActionBar, Panel, QuickAction,
  StatusBadge, StudentAttentionItem, numFmt,
} from '@/components/dash2/blocks';
import { getTeacherOverview } from '@/lib/dashboard/education';
import { getT } from '@/lib/i18n/server';

/**
 * لوحة المعلّم — مبنية حول مهمته اليومية: أي حلقة تنتظر الحضور؟ من يحتاج متابعة؟
 * ما آخر تسميع؟ (بيانات حلقاته وحدها). الإجراء الأساسي ثابت أسفل الشاشة على الجوال.
 */
export default async function TeacherDashboard({
  orgId, slug, userId, userName,
}: {
  orgId: string; slug: string; userId: string; userName: string;
}) {
  const { t, locale } = await getT();
  const base = `/org/${slug}`;
  const data = await getTeacherOverview(orgId, userId);
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short' });

  if (!data) {
    return (
      <div className="org-page">
        <div className="d2">
          <header className="d2-head"><div><span className="d2-eyebrow">{t('td.eyebrow')}</span><h1>{userName}</h1><p>{t('td.notLinked')}</p></div></header>
        </div>
      </div>
    );
  }

  const pending = data.halaqat.filter((h) => h.students > 0 && h.recorded < h.students).length;
  const allDone = data.halaqat.length > 0 && pending === 0;
  const attLink = `${base}/education/attendance`;

  return (
    <div className="org-page">
      <div className="d2 d2-grid d2-has-actionbar d2-has-bottomnav">
        <header className="d2-head">
          <div>
            <span className="d2-eyebrow">{t('d2.t.eyebrow')}</span>
            <h1>{data.name}</h1>
            <p>{t('td.totalStudents')}: {numFmt.format(data.students)}</p>
          </div>
          <div className="d2-head-actions">
            <Link href={attLink} className="d2-action is-primary"><Icon name="attendance" size={18} />{t('eh.cta.attendance')}</Link>
          </div>
        </header>

        <div className="d2-metrics o-1">
          <DashboardMetric
            primary label={t('eh.stat.attendanceToday')}
            value={data.today.recorded ? `${Math.round((data.today.present / data.today.recorded) * 100)}%` : t('eh.att.none')}
            hint={data.halaqat.length === 0 ? t('d2.t.noHalaqa') : allDone ? t('d2.t.allDone') : t('d2.t.pendingAtt', { n: pending })}
            href={attLink}
          />
          <DashboardMetric label={t('td.myHalaqat')} value={numFmt.format(data.halaqat.length)} />
          <DashboardMetric label={t('td.students')} value={numFmt.format(data.students)} />
        </div>

        <Panel title={t('eh.followup.title')} className="o-2 d2-col-side">
          {data.attention.length === 0 ? <EmptyNote>{t('eh.followup.none')}</EmptyNote> : (
            <ul className="d2-list">
              {data.attention.map((a) => (
                <StudentAttentionItem key={a.id} href={`${base}/education/students/${a.id}`} name={a.name}
                  detail={`${t('eh.followup.absent', { n: a.absences })}${a.halaqaName ? ` · ${a.halaqaName}` : ''}`} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('td.myHalaqat')} className="o-3 d2-col-main">
          {data.halaqat.length === 0 ? <EmptyNote>{t('td.noHalaqat')}</EmptyNote> : (
            <ul className="d2-list">
              {data.halaqat.map((h) => (
                <HalaqaSummary
                  key={h.id} href={`${base}/education/halaqat/${h.id}`} name={h.name} schedule={h.schedule}
                  students={h.students} unit={t('d2.students.unit')}
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
            <QuickAction href={attLink} icon="attendance" label={t('td.attendance')} />
            <QuickAction href={`${base}/education/memorization`} icon="memorization" label={t('td.memorization')} />
          </div>
        </section>

        <Panel title={t('eh.recent.title')} more={{ href: `${base}/education/memorization`, label: t('eh.recent.all') }} className="o-5 d2-col-side" secondary>
          {data.recent.length === 0 ? <EmptyNote>{t('eh.recent.none')}</EmptyNote> : (
            <ul className="d2-list">
              {data.recent.map((r, i) => (
                <ActivityItem key={i} name={r.name} text={r.text ?? (r.pages ? t('eh.pages', { n: r.pages }) : t('eh.recorded'))} when={dateFmt.format(r.at)} />
              ))}
            </ul>
          )}
        </Panel>

        <MobileActionBar>
          <Link href={attLink} className="d2-action is-primary"><Icon name="attendance" size={20} />{t('eh.cta.attendance')}</Link>
        </MobileActionBar>
      </div>
    </div>
  );
}
