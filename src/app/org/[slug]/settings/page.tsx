import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { canManageSettings, canCustomize } from '@/lib/permissions';
import { PLAN_BY_ID } from '@/lib/plans';
import ProfileForm from '@/components/ProfileForm';
import OrgSettingsForm from '@/components/OrgSettingsForm';
import BrandingForm from '@/components/BrandingForm';
import LogoutButton from '@/components/LogoutButton';
import { getT } from '@/lib/i18n/server';
import { tenantHost } from '@/lib/app-domain';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');

const TYPE_KEYS: Record<string, string> = {
  ASSOCIATION: 'type.association',
  MOSQUE: 'type.mosque',
  SCHOOL: 'type.school',
  PROJECT: 'type.project',
};

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  const isAdmin = canManageSettings(user);
  const canCust = canCustomize(user);
  const plan = PLAN_BY_ID[org.plan];
  const planName = plan ? (locale === 'en' ? plan.en : plan.name) : org.plan;

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.div.system')}</span>
          <h1>{t('onav.settings')}</h1>
          <p>{isAdmin ? t('oset.subAdmin') : t('oset.subMe')}</p>
        </div>
      </div>

      <h2 className="org-settings-h2">{t('oset.profile')}</h2>
      <ProfileForm name={user.name} email={user.email} role={user.role} avatarUrl={user.avatarUrl} jobTitle={user.jobTitle} phone={user.phone} />

      <h2 className="org-settings-h2">{t('oset.prefs')}</h2>
      <div className="org-panel">
        <div className="org-kv">
          <span>{t('oset.language')}</span>
          <strong>{locale === 'en' ? t('lang.en') : t('lang.ar')}</strong>
        </div>
        <div className="org-kv">
          <span>{t('oset.notifications')}</span>
          <span className="org-badge">{t('oset.soon')}</span>
        </div>
      </div>

      {isAdmin && (
        <>
          <h2 className="org-settings-h2">{t('oset.plan')}</h2>
          <div className="org-panel">
            <div className="org-kv">
              <span>{t('oset.currentPlan')}</span>
              <strong>{planName}</strong>
            </div>
            <div className="org-kv">
              <span>{t('oset.userLimit')}</span>
              <strong>
                {plan?.maxUsers == null ? t('oset.unlimited') : numFmt.format(plan.maxUsers)}
              </strong>
            </div>
            <p className="org-panel-sub">
              {t('oset.upgradeHint')} <Link href="/pricing" className="org-link">{t('oset.pricingPage')}</Link>.
            </p>
          </div>

          <h2 className="org-settings-h2">{t('oset.orgSettings')}</h2>
          <div className="org-panel">
            <div className="org-kv">
              <span>{t('oset.type')}</span>
              <strong>{TYPE_KEYS[org.type] ? t(TYPE_KEYS[org.type]) : org.type}</strong>
            </div>
            <div className="org-kv">
              <span>{t('oset.subdomain')}</span>
              <code dir="ltr">{tenantHost(org.slug)}</code>
            </div>
            <p className="org-panel-sub">{t('oset.managedByOwner')}</p>
          </div>
          <OrgSettingsForm name={org.name} />
        </>
      )}

      {canCust && (
        <>
          <h2 className="org-settings-h2">{t('oset.branding')}</h2>
          <p className="org-panel-sub" style={{ marginBottom: '0.8rem' }}>{t('oset.brandingSub')}</p>
          <BrandingForm brandColor={org.brandColor} logoUrl={org.logoUrl} />
        </>
      )}

      <h2 className="org-settings-h2">{t('oset.account')}</h2>
      <LogoutButton redirectTo="/login" />
    </div>
  );
}
