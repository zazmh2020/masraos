import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import Icon, { IconShape } from '@/components/Icon';

export const dynamic = 'force-dynamic';

const ACTION_ICON: Record<string, string> = {
  created: 'add', updated: 'edit', deleted: 'delete', approved: 'completed', rejected: 'reject', published: 'world', unpublished: 'lock',
};

export default async function AuditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  if (!canManageUsers(user)) redirect(`/org/${org.slug}`);
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: org.id }, orderBy: { createdAt: 'desc' }, take: 100,
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeSystem')}</span>
          <h1>{t('audit.title')}</h1>
          <p>{t('audit.sub')}</p>
        </div>
      </div>
      {logs.length === 0 ? (
        <div className="org-empty"><IconShape name="activities" variant="soft" size="xl" /><p>{t('audit.none')}</p></div>
      ) : (
        <div className="notif-list">
          {logs.map((l) => (
            <div key={l.id} className="notif-row">
              <span className="notif-ic"><Icon name={ACTION_ICON[l.action] ?? 'view'} size={20} /></span>
              <span className="notif-tx">
                <b>{l.actorName}</b> · {t(`audit.action.${l.action}`, {})} {t(`audit.entity.${l.entity}`, {})}{l.label ? ` — ${l.label}` : ''}
              </span>
              <time className="notif-time">{fmt.format(l.createdAt)}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
