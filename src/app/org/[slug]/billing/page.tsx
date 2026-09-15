import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageSettings } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import { PLANS, CURRENCY, PLAN_BY_ID, planEntitlementYears } from '@/lib/plans';
import { billingConfigured } from '@/lib/stripe';
import { deriveEnrollmentTerms, ENTITLEMENT_AGREEMENT_VERSION, ENTITLEMENT_TERMS_VERSION } from '@/lib/entitlement';
import BillingView from '@/components/BillingView';
import EntitlementEnroll from '@/components/EntitlementEnroll';

export const dynamic = 'force-dynamic';

export default async function BillingPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  if (!canManageSettings(user)) redirect(`/org/${org.slug}`);

  const plans = PLANS.map((p) => ({
    id: p.id,
    name: locale === 'en' ? p.en : p.name,
    price: p.price,
    paid: p.price != null && p.price > 0,
    current: org.plan === p.id,
  }));

  const statusMsg = sp.status === 'success' ? 'success' : sp.status === 'cancel' ? 'cancel' : null;

  // برنامج الاستحقاق الدائم — اشتقاق خادميّ (بلا أي حساب من العميل)
  const entYears = planEntitlementYears(org.plan);
  const enrolled = (await prisma.permanentEntitlement.count({ where: { organizationId: org.id } })) > 0;
  const terms = deriveEnrollmentTerms(org.plan);
  const entitlement = {
    eligible: entYears != null,
    enrolled,
    years: entYears,
    planName: locale === 'en' ? (PLAN_BY_ID[org.plan]?.en ?? org.plan) : (PLAN_BY_ID[org.plan]?.name ?? org.plan),
    startPreview: (terms?.startDate ?? new Date()).toISOString(),
    targetPreview: (terms?.targetDate ?? new Date()).toISOString(),
    detailsHref: `/org/${org.slug}/settings/permanent-entitlement`,
    agreementVersion: ENTITLEMENT_AGREEMENT_VERSION,
    termsVersion: ENTITLEMENT_TERMS_VERSION,
  };

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeSystem')}</span>
          <h1>{t('bill.title')}</h1>
          <p>{t('bill.sub')}</p>
        </div>
      </div>
      <BillingView
        plans={plans}
        statusMsg={statusMsg as 'success' | 'cancel' | null}
        configured={billingConfigured()}
        subscriptionStatus={org.subscriptionStatus}
        renewsAt={org.planRenewsAt ? org.planRenewsAt.toISOString() : null}
        currency={CURRENCY}
      />
      <EntitlementEnroll {...entitlement} />
    </div>
  );
}
