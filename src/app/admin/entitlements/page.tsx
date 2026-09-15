import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';
import { PLAN_BY_ID } from '@/lib/plans';
import { computeEntitlement, effectiveAccruedDays } from '@/lib/entitlement';
import EntitlementCancel from '@/components/EntitlementCancel';

export const dynamic = 'force-dynamic';

export default async function AdminEntitlementsPage() {
  const { t, locale } = await getT();
  const df = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

  const rows = await prisma.permanentEntitlement.findMany({
    orderBy: { enrollmentDate: 'desc' },
    include: {
      organization: { select: { name: true, slug: true } },
      agreementAcceptedBy: { select: { name: true, email: true } },
      events: { orderBy: { createdAt: 'desc' }, take: 8 },
    },
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{t('entadm.title')}</h1>
          <p>{t('entadm.sub')}</p>
        </div>
        <span className="admin-count">{t('entadm.count', { n: rows.length })}</span>
      </div>

      {rows.length === 0 ? (
        <div className="admin-empty">{t('entadm.empty')}</div>
      ) : (
        <div className="entadm-list">
          {rows.map((r) => {
            const view = computeEntitlement({
              requiredDurationYears: r.requiredDurationYears,
              accruedDays: effectiveAccruedDays(r),
              status: r.status,
              startDate: r.startDate,
              targetDate: r.targetDate,
              completedAt: r.completedAt,
            });
            const planName = locale === 'en' ? (PLAN_BY_ID[r.planIdAtEnrollment]?.en ?? r.planIdAtEnrollment) : (PLAN_BY_ID[r.planIdAtEnrollment]?.name ?? r.planIdAtEnrollment);
            return (
              <div key={r.id} className="entadm-card">
                <div className="entadm-card-head">
                  <div>
                    <strong>{r.organization.name}</strong>
                    <span className="entadm-slug" dir="ltr">{r.organization.slug}</span>
                  </div>
                  <span className={`ent-status-badge st-${r.status}`}>{t(`ent.status.${r.status}`)}</span>
                </div>

                <div className="entadm-progress">
                  <div className="ent-progress"><span style={{ width: `${Math.round(view.progress * 100)}%` }} /></div>
                  <span className="entadm-pct">{Math.round(view.progress * 100)}%</span>
                </div>

                <div className="entadm-grid">
                  <div><span>{t('ent.currentPlan')}</span><strong>{planName}</strong></div>
                  <div><span>{t('ent.duration')}</span><strong>{t('ent.years', { n: r.requiredDurationYears })}</strong></div>
                  <div><span>{t('entadm.enrolledOn')}</span><strong>{df.format(r.enrollmentDate)}</strong></div>
                  <div><span>{t('ent.targetDate')}</span><strong>{df.format(r.targetDate)}</strong></div>
                  <div><span>{t('entadm.acceptedBy')}</span><strong>{r.agreementAcceptedBy.name}</strong></div>
                  <div><span>{t('entadm.acceptedAt')}</span><strong>{df.format(r.agreementAcceptedAt)}</strong></div>
                  <div><span>{t('entadm.agreementVer')}</span><strong dir="ltr">{r.agreementVersion} / {r.termsVersion}</strong></div>
                </div>

                {r.events.length > 0 && (
                  <details className="entadm-events">
                    <summary>{t('entadm.auditLog')}</summary>
                    <ul>
                      {r.events.map((e) => (
                        <li key={e.id}><span dir="ltr">{e.type}</span> · {df.format(e.createdAt)}{e.note ? ` — ${e.note}` : ''}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {r.status !== 'CANCELLED' && (
                  <div className="entadm-actions">
                    <EntitlementCancel id={r.id} />
                  </div>
                )}
                {r.status === 'CANCELLED' && r.cancellationReason && (
                  <p className="entadm-cancelnote">{t('entadm.cancelledReason', { r: r.cancellationReason })}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
