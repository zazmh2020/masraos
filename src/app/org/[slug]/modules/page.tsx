import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import ModulesView from '@/components/ModulesView';

export const dynamic = 'force-dynamic';

export default async function ModulesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canManageSettings(user)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeSystem')}</span>
          <h1>{t('mod.title')}</h1>
          <p>{t('mod.sub')}</p>
        </div>
      </div>

      <ModulesView disabled={org.disabledModules} canManage type={org.type} plan={org.plan} />
    </div>
  );
}
