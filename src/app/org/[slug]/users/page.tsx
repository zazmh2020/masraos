import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewUsers, canManageUsers } from '@/lib/permissions';
import OrgUsersTable from '@/components/OrgUsersTable';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function OrgUsersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewUsers(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageUsers(user);

  const [users, departments, customRoles] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: org.id },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        departmentId: true,
        customRoleId: true,
        avatarUrl: true,
      },
    }),
    prisma.department.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.customRole.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('ousers.eyebrow')}</span>
          <h1>{t('od.users')}</h1>
          <p>{t('ousers.count', { n: users.length, org: org.name })}</p>
        </div>
        {canManage && (
          <Link href={`/org/${org.slug}/users/new`} className="org-btn org-btn-primary">
            + {t('od.addUser')}
          </Link>
        )}
      </div>

      <OrgUsersTable
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        }))}
        departments={departments}
        customRoles={customRoles}
        currentUserId={user.id}
        canManage={canManage}
      />
    </div>
  );
}
