import Link from 'next/link';
import { EmptyNote, Panel, ProgressSummary, StatusBadge, numFmt } from '@/components/dash2/blocks';
import { getGuardianOverview } from '@/lib/dashboard/education';
import { getT } from '@/lib/i18n/server';

/**
 * الصفحة الرئيسية لوليّ الأمر: أبناؤه أولًا — حضور اليوم والنسبة وآخر حفظ لكل ابن.
 * للقراءة فقط، ومعزولة: أبناء هذا الحساب وحدهم (getGuardianOverview).
 */
export default async function GuardianHome({ orgId, slug, userId, userName }: { orgId: string; slug: string; userId: string; userName: string }) {
  const { t, locale } = await getT();
  const base = `/org/${slug}`;
  const data = await getGuardianOverview(orgId, userId);
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short' });
  const children = data?.children ?? [];
  const tone = (s: string | null) => (s === 'PRESENT' ? 'green' : s === 'LATE' || s === 'EXCUSED' ? 'amber' : s === 'ABSENT' ? 'amber' : 'muted') as 'green' | 'amber' | 'muted';

  return (
    <div className="org-page">
      <div className="d2 d2-has-bottomnav">
        <header className="d2-head">
          <div>
            <span className="d2-eyebrow">{t('d2.g.eyebrow')}</span>
            <h1>{data?.name ?? userName}</h1>
            <p>{t('gp.sub', { n: children.length })}</p>
          </div>
        </header>

        {children.length === 0 ? (
          <Panel title={t('gp.title')}><EmptyNote>{t('d2.g.noChildren')}</EmptyNote></Panel>
        ) : (
          <div className="d2-metrics">
            {children.map((c) => (
              <article key={c.id} className="d2-child" style={{ gridColumn: '1 / -1' }}>
                <div className="d2-child-hd">
                  <div>
                    <h3>{c.name}</h3>
                    {c.halaqaName && <span className="d2-muted">{c.halaqaName}</span>}
                  </div>
                  <StatusBadge tone={tone(c.todayStatus)}>
                    {c.todayStatus ? t(`d2.st.${c.todayStatus}`) : t('d2.g.noToday')}
                  </StatusBadge>
                </div>
                <ProgressSummary
                  value={c.attendanceRate ?? 0} max={100}
                  label={`${t('d2.g.attendance30')}: ${c.attendanceRate === null ? '—' : `${numFmt.format(c.attendanceRate)}%`}`}
                />
                <div className="d2-child-line">
                  <span>{t('d2.g.lastMemo')}</span>
                  <span>{c.lastMemo ? `${c.lastMemo.content} · ${dateFmt.format(c.lastMemo.at)}` : t('d2.g.none')}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {children.length > 0 && (
          <div className="d2-actions">
            <Link href={`${base}/guardian`} className="d2-action is-primary">{t('d2.g.details')}</Link>
            <Link href={`${base}/notifications`} className="d2-action">{t('onav.notifications')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
