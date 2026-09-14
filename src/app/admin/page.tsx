import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Icon from '@/components/Icon';
import DashboardShell from '@/components/dash/DashboardShell';
import StatCard from '@/components/dash/StatCard';
import AreaChart from '@/components/dash/AreaChart';
import DonutRing from '@/components/dash/DonutRing';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');

const TYPE_KEYS: Record<string, string> = {
  ASSOCIATION: 'type.association',
  MOSQUE: 'type.mosque',
  SCHOOL: 'type.school',
  PROJECT: 'type.project',
};

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}
function bucketByDay(dates: Date[], days: Date[]): number[] {
  return days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return dates.filter((x) => x >= day && x < next).length;
  });
}

export default async function AdminOverview() {
  const { t, locale } = await getT();
  const intlLocale = locale === 'en' ? 'en' : 'ar-u-nu-latn';
  const dateFmt = new Intl.DateTimeFormat(intlLocale, { year: 'numeric', month: 'short', day: 'numeric' });
  const weekdayFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { weekday: 'short' });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const days = buildDays();
  const weekAgo = days[0];

  const [
    orgCount, activeOrgCount, userCount, newThisMonth,
    byType, recent, newOrgs7, newUsers7,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: { not: 'PLATFORM_OWNER' } } }),
    prisma.organization.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.organization.groupBy({ by: ['type'], _count: true }),
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' }, take: 6,
      select: { name: true, slug: true, type: true, isActive: true, createdAt: true, _count: { select: { users: true } } },
    }),
    prisma.organization.findMany({ where: { createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { role: { not: 'PLATFORM_OWNER' }, createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
  ]);

  const avgUsers = orgCount > 0 ? Math.round((userCount / orgCount) * 10) / 10 : 0;
  const activeRatio = orgCount > 0 ? Math.round((activeOrgCount / orgCount) * 100) : 0;

  const labels = days.map((d) => weekdayFmt.format(d));
  const orgsSeries = bucketByDay(newOrgs7.map((o) => o.createdAt), days);
  const usersSeries = bucketByDay(newUsers7.map((u) => u.createdAt), days);
  const hasSeries = orgsSeries.some((v) => v > 0) || usersSeries.some((v) => v > 0);

  const typeMax = Math.max(1, ...byType.map((x) => x._count));
  const typeData = byType
    .map((x) => ({ label: TYPE_KEYS[x.type] ? t(TYPE_KEYS[x.type]) : x.type, value: x._count }))
    .sort((a, b) => b.value - a.value);

  if (orgCount === 0) {
    return (
      <div className="dash">
        <div className="admin-page-header">
          <div>
            <h1>{t('adm.title')}</h1>
            <p>{t('adm.sub')}</p>
          </div>
          <Link href="/admin/organizations/new" className="btn-admin-primary">+ {t('adm.create')}</Link>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="32" height="32" rx="3" />
              <path d="M16 8v32M32 8v32M8 16h32M8 32h32" />
            </svg>
          </div>
          <h2>{t('adm.empty.title')}</h2>
          <p>{t('adm.empty.sub')}</p>
          <Link href="/admin/organizations/new" className="btn-admin-primary">{t('adm.empty.cta')}</Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="dash-hd">
        <div>
          <span className="dash-eyebrow">{t('anav.owner')}</span>
          <h1>{t('adm.title')} 👋</h1>
          <p className="dash-sub">{t('adm.sub')}</p>
        </div>
        <div className="dash-hd-actions">
          <Link href="/admin/organizations/new" className="dash-btn">
            <Icon name="actions/actions-add" size={16} /> {t('adm.create')}
          </Link>
        </div>
      </div>

      <div className="dash-stats">
        <StatCard icon="organization/organization-institution" color="purple" label={t('adm.stat.totalOrgs')} value={numFmt.format(orgCount)} trend={newThisMonth ? t('adm.thisMonth', { n: newThisMonth }) : undefined} />
        <StatCard icon="organization/organization-building" color="green" label={t('adm.stat.activeOrgs')} value={numFmt.format(activeOrgCount)} />
        <StatCard icon="people/people-users" color="blue" label={t('adm.stat.totalUsers')} value={numFmt.format(userCount)} />
        <StatCard icon="analytics/analytics-kpi" color="gold" label={t('adm.stat.avgUsers')} value={numFmt.format(avgUsers)} />
      </div>

      <div className="dash-grid-main">
        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>{t('adm.growth')}</h3>
            <Link href="/admin/organizations" className="dash-link">{t('adm.orgs')} ←</Link>
          </div>
          {hasSeries ? (
            <>
              <AreaChart
                labels={labels}
                series={[
                  { color: '#6B57A0', values: usersSeries },
                  { color: '#B8860B', values: orgsSeries, dashed: true },
                ]}
              />
              <div className="dash-chart-legend">
                <span><span className="dot" style={{ background: '#6B57A0' }} />{t('adm.newUsers')}</span>
                <span><span className="dot" style={{ background: '#B8860B' }} />{t('adm.newOrgs')}</span>
              </div>
            </>
          ) : (
            <p className="dash-chart-empty">{t('adm.noActivity')}</p>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>{t('adm.activation')}</h3>
            <span className="dash-link">{t('adm.orgs')}</span>
          </div>
          <DonutRing
            percent={activeRatio}
            label={t('adm.activeOf')}
            hint={t('adm.activeHint', { a: numFmt.format(activeOrgCount), b: numFmt.format(orgCount) })}
          />
        </div>
      </div>

      <div className="dash-grid-bottom">
        <div className="dash-card">
          <div className="dash-card-hd">
            <h3>{t('adm.latestOrgs')}</h3>
            <Link href="/admin/organizations" className="dash-link">{t('adm.viewAll')} ←</Link>
          </div>
          <table className="dash-table">
            <thead>
              <tr><th>{t('adm.th.name')}</th><th>{t('adm.th.type')}</th><th>{t('adm.th.users')}</th><th>{t('adm.th.status')}</th><th>{t('adm.th.created')}</th></tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.slug}>
                  <td>
                    <div className="dash-cell-user">
                      <span className="dash-avatar">{o.name.charAt(0)}</span>
                      <div className="n">{o.name}</div>
                    </div>
                  </td>
                  <td>{TYPE_KEYS[o.type] ? t(TYPE_KEYS[o.type]) : o.type}</td>
                  <td>{numFmt.format(o._count.users)}</td>
                  <td><span className={`dash-badge ${o.isActive ? 'green' : 'muted'}`}>{o.isActive ? t('adm.status.active') : t('adm.status.inactive')}</span></td>
                  <td>{dateFmt.format(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dash-side">
          <div className="dash-card">
            <div className="dash-card-hd"><h3>{t('adm.distByType')}</h3></div>
            <div className="dash-ann-list">
              {typeData.map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '13px' }}>
                  <span style={{ flex: '0 0 110px', color: 'var(--gray-700)' }}>{row.label}</span>
                  <span style={{ flex: 1, height: 8, borderRadius: 100, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${(row.value / typeMax) * 100}%`, background: 'linear-gradient(90deg, var(--purple-300), var(--purple-500))', borderRadius: 100 }} />
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--purple-900)', minWidth: 24, textAlign: 'end' }}>{numFmt.format(row.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-promo">
            <h4>{t('adm.promo.title')}</h4>
            <p>{t('adm.promo.sub')}</p>
            <Link href="/admin/organizations/new" className="dash-promo-btn">
              <Icon name="actions/actions-add" size={14} /> {t('adm.create')}
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
