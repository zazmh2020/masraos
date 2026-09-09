import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canManageUsers } from '@/lib/permissions';
import NewOrgUserForm from '@/components/NewOrgUserForm';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function NewOrgUserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canManageUsers(user)) redirect(`/org/${org.slug}`);

  return (
    <div className="org-page org-page-narrow">
      <div className="org-page-head">
        <div>
          <Link href={`/org/${org.slug}/users`} className="org-back-link">← {t('pg.usersNew.back')}</Link>
          <h1>{t('pg.usersNew.title')}</h1>
          <p>{t('pg.usersNew.sub', { org: org.name })}</p>
        </div>
      </div>

      <NewOrgUserForm slug={org.slug} />
    </div>
  );
}
