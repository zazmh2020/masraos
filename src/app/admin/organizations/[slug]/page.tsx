import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PLAN_BY_ID, CURRENCY } from '@/lib/plans';
import PlanSelector from './PlanSelector';
import OrgIdentityForm from '@/components/OrgIdentityForm';
import { getT, getLocale } from '@/lib/i18n/server';
import { tenantHost, tenantUrl } from '@/lib/app-domain';
import '@/styles/org.css';

const numFmt = new Intl.NumberFormat('en-US');

export const dynamic = 'force-dynamic';

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = await getT();
  const locale = await getLocale();
  const { slug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      _count: { select: { users: true } },
    },
  });

  if (!org) notFound();

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/organizations" className="link-quiet">← {t('aorg.detail.back')}</Link>
          <h1>{org.name}</h1>
          <p>{t('atype.' + org.type)}</p>
        </div>
        <span className={`badge ${org.isActive ? 'badge-success' : 'badge-muted'}`}>
          {org.isActive ? t('aorg.detail.active') : t('aorg.detail.inactive')}
        </span>
      </div>

      <div className="section-block">
        <h2>{t('aorg.detail.plan')}</h2>
        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-card-label">{t('aorg.detail.currentPlan')}</div>
            <div className="detail-card-value">{PLAN_BY_ID[org.plan]?.name ?? org.plan}</div>
          </div>
          <div className="detail-card">
            <div className="detail-card-label">{t('aorg.detail.monthlyPrice')}</div>
            <div className="detail-card-value">
              {(() => {
                const p = PLAN_BY_ID[org.plan];
                if (!p || p.price === null) return t('plan.custom');
                if (p.price === 0) return t('plan.free');
                return `${numFmt.format(p.price)} ${CURRENCY}`;
              })()}
            </div>
          </div>
          <div className="detail-card">
            <div className="detail-card-label">{t('aorg.detail.userLimit')}</div>
            <div className="detail-card-value">
              {PLAN_BY_ID[org.plan]?.maxUsers == null ? t('aorg.detail.unlimited') : numFmt.format(PLAN_BY_ID[org.plan]!.maxUsers!)}
            </div>
          </div>
        </div>
        <PlanSelector slug={org.slug} current={org.plan} />
      </div>

      <div className="section-block">
        <h2>{t('aorg.detail.branding')}</h2>
        <p className="link-quiet" style={{ marginBottom: '0.8rem' }}>{t('aorg.detail.brandingSub')}</p>
        <div style={{ maxWidth: 620, marginInline: 'auto' }}>
          <OrgIdentityForm
            apiBase={`/api/admin/organizations/${org.slug}/branding`}
            subdomain={tenantHost(org.slug)}
            name={org.name}
            brandColor={org.brandColor}
            brandAccent={org.brandAccent}
            logoUrl={org.logoUrl}
            faviconUrl={org.faviconUrl}
            coverUrl={org.coverUrl}
            tagline={org.tagline}
            websiteUrl={org.websiteUrl}
            twitterUrl={org.twitterUrl}
            instagramUrl={org.instagramUrl}
            whatsapp={org.whatsapp}
            customDomain={org.customDomain}
          />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-label">{t('aorg.detail.subdomain')}</div>
          <a
            href={tenantUrl(org.slug)}
            target="_blank"
            rel="noreferrer"
            className="detail-card-link"
            dir="ltr"
          >
            {tenantHost(org.slug)} ↗
          </a>
          {org.customDomain && (
            <a href={`https://${org.customDomain}`} target="_blank" rel="noreferrer" className="detail-card-link" dir="ltr" style={{ marginTop: '0.35rem' }}>
              {org.customDomain} ↗
            </a>
          )}
        </div>
        <div className="detail-card">
          <div className="detail-card-label">{t('aorg.detail.usersCount')}</div>
          <div className="detail-card-value">{org._count.users}</div>
        </div>
        <div className="detail-card">
          <div className="detail-card-label">{t('aorg.detail.createdAt')}</div>
          <div className="detail-card-value">
            {new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', {
              year: 'numeric', month: 'long', day: 'numeric',
            }).format(org.createdAt)}
          </div>
        </div>
      </div>

      <div className="section-block">
        <h2>{t('aorg.detail.orgUsers')}</h2>
        {org.users.length === 0 ? (
          <p className="empty-hint">{t('aorg.detail.noUsers')}</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('aorg.th.name')}</th>
                  <th>{t('aorg.th.email')}</th>
                  <th>{t('aorg.th.role')}</th>
                  <th>{t('aorg.th.status')}</th>
                </tr>
              </thead>
              <tbody>
                {org.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td dir="ltr">{u.email}</td>
                    <td>{t('role.' + u.role)}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-muted'}`}>
                        {u.isActive ? t('aorg.detail.userActive') : t('aorg.detail.userInactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
