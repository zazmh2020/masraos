import { requireOrgAccess } from '@/lib/org';
import { getOrgInbox } from '@/lib/inbox';
import { getT } from '@/lib/i18n/server';
import NotificationsList from '@/components/NotificationsList';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const inbox = await getOrgInbox(org.id, user);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.div.knowledge')}</span>
          <h1>{t('notif.title')}</h1>
          <p>{t('notif.sub')}</p>
        </div>
      </div>
      <NotificationsList notifications={inbox.notifications} storageKey={`midad_org_${org.slug}`} />
    </div>
  );
}
