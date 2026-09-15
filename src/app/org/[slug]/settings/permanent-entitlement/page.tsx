import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import { PLAN_BY_ID } from '@/lib/plans';
import { getOrgEntitlement } from '@/lib/entitlement-load';

export const dynamic = 'force-dynamic';

export default async function EntitlementDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  if (!canManageSettings(user)) {
    return (
      <div className="org-page org-page-narrow">
        <div className="org-page-head"><div><h1>{t('ent.detailsTitle')}</h1><p>{t('pg.content.denied')}</p></div></div>
      </div>
    );
  }

  const df = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const dur = (d: { years: number; months: number }) =>
    d.years && d.months ? t('ent.dur.ym', { y: d.years, m: d.months }) : d.years ? t('ent.dur.y', { y: d.years }) : t('ent.dur.m', { m: d.months });

  const data = await getOrgEntitlement(org.id);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.settings')}</span>
          <h1>{t('ent.detailsTitle')}</h1>
          <p>{t('ent.detailsSub')}</p>
        </div>
      </div>

      {!data ? (
        <div className="org-panel ent-enrolled">
          <p className="org-panel-sub" style={{ margin: 0 }}>{t('ent.notEnrolled')}</p>
          <Link href={`/org/${org.slug}/billing`} className="org-btn org-btn-primary">{t('ent.goEnroll')}</Link>
        </div>
      ) : (
        <>
          {data.view.isComplete && (
            <div className="ent-complete-banner">
              <strong>{t('ent.completedTitle')}</strong>
              <p>{t('ent.completedMsg')}</p>
            </div>
          )}

          <div className="org-panel ent-details">
            <div className="ent-details-top">
              <span className={`ent-status-badge st-${data.row.status}`}>{t(`ent.status.${data.row.status}`)}</span>
              <span className="ent-details-pct">{Math.round(data.view.progress * 100)}%</span>
            </div>
            <div className="ent-progress"><span style={{ width: `${Math.round(data.view.progress * 100)}%` }} /></div>

            <div className="ent-summary" style={{ marginTop: '1.2rem' }}>
              <div className="ent-row"><span>{t('ent.currentPlan')}</span><strong>{locale === 'en' ? (PLAN_BY_ID[data.row.planIdAtEnrollment]?.en ?? data.row.planIdAtEnrollment) : (PLAN_BY_ID[data.row.planIdAtEnrollment]?.name ?? data.row.planIdAtEnrollment)}</strong></div>
              <div className="ent-row"><span>{t('ent.duration')}</span><strong>{t('ent.years', { n: data.row.requiredDurationYears })}</strong></div>
              <div className="ent-row"><span>{t('ent.startDate')}</span><strong>{df.format(data.row.startDate)}</strong></div>
              <div className="ent-row"><span>{t('ent.targetDate')}</span><strong>{df.format(data.row.targetDate)}</strong></div>
              <div className="ent-row"><span>{t('ent.completed')}</span><strong>{dur(data.view.completed)}</strong></div>
              <div className="ent-row"><span>{t('ent.remaining')}</span><strong>{data.view.isComplete ? '—' : dur(data.view.remaining)}</strong></div>
            </div>
          </div>

          <div className="org-panel ent-gets">
            <h4>{t('ent.getsTitle')}</h4>
            <ul>
              <li>{t('ent.get1')}</li>
              <li>{t('ent.get2')}</li>
              <li>{t('ent.get3')}</li>
            </ul>
          </div>

          <div className="org-panel ent-excl">
            <h4>{t('ent.excludeTitle')}</h4>
            <ul>
              {[1, 2, 3, 4, 5, 6].map((i) => <li key={i}>{t(`ent.excl${i}`)}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
