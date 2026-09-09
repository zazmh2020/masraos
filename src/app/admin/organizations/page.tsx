import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';
import { tenantHost } from '@/lib/app-domain';

export const dynamic = 'force-dynamic';

const TYPE_KEYS: Record<string, string> = {
  ASSOCIATION: 'type.association',
  MOSQUE: 'type.mosque',
  SCHOOL: 'type.school',
  PROJECT: 'type.project',
};

export default async function OrganizationsPage() {
  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{t('adm.orgs')}</h1>
          <p>{orgs.length === 0 ? t('aorg.none') : t('aorg.count', { n: orgs.length })}</p>
        </div>
        <Link href="/admin/organizations/new" className="btn-admin-primary">
          + {t('adm.create')}
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="empty-state">
          <p>{t('aorg.startFirst')}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('adm.th.name')}</th>
                <th>{t('adm.th.type')}</th>
                <th>{t('aorg.th.subdomain')}</th>
                <th>{t('adm.th.users')}</th>
                <th>{t('adm.th.status')}</th>
                <th>{t('aorg.th.created')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <strong>{org.name}</strong>
                  </td>
                  <td>{TYPE_KEYS[org.type] ? t(TYPE_KEYS[org.type]) : org.type}</td>
                  <td>
                    <code dir="ltr">{tenantHost(org.slug)}</code>
                  </td>
                  <td>{org._count.users}</td>
                  <td>
                    <span className={`badge ${org.isActive ? 'badge-success' : 'badge-muted'}`}>
                      {org.isActive ? t('adm.status.active') : t('adm.status.inactive')}
                    </span>
                  </td>
                  <td>{dateFmt.format(org.createdAt)}</td>
                  <td>
                    <Link href={`/admin/organizations/${org.slug}`} className="link-quiet">
                      {t('aorg.manage')} ←
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
