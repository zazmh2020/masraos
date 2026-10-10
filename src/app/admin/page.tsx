import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Icon, { IconShape } from '@/components/Icon';
import { DashboardMetric, EmptyNote, MobileActionBar, Panel, ProgressSummary, StatusBadge } from '@/components/dash2/blocks';
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
          <IconShape name="organization" variant="soft" size="xl" className="empty-state-shape" />
          <h2>{t('adm.empty.title')}</h2>
          <p>{t('adm.empty.sub')}</p>
          <Link href="/admin/organizations/new" className="btn-admin-primary">{t('adm.empty.cta')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="org-page">
      <div className="d2 d2-grid d2-has-actionbar">
        <header className="d2-head">
          <div>
            <span className="d2-eyebrow">{t('anav.owner')}</span>
            <h1>{t('adm.title')}</h1>
            <p>{t('adm.sub')}</p>
          </div>
          <div className="d2-head-actions">
            <Link href="/admin/organizations/new" className="d2-action is-primary"><Icon name="add" size={18} />{t('adm.create')}</Link>
          </div>
        </header>

        {/* المقياس المحوري: المؤسسات النشطة — ثم الداعم */}
        <div className="d2-metrics o-1">
          <DashboardMetric primary label={t('adm.stat.activeOrgs')} value={numFmt.format(activeOrgCount)}
            hint={t('adm.activeHint', { a: numFmt.format(activeOrgCount), b: numFmt.format(orgCount) })} href="/admin/organizations" />
          <DashboardMetric label={t('adm.stat.totalOrgs')} value={numFmt.format(orgCount)} hint={newThisMonth ? t('adm.thisMonth', { n: newThisMonth }) : undefined} />
          <DashboardMetric label={t('adm.stat.totalUsers')} value={numFmt.format(userCount)} />
          <DashboardMetric label={t('adm.stat.avgUsers')} value={numFmt.format(avgUsers)} />
        </div>

        <Panel title={t('adm.latestOrgs')} more={{ href: '/admin/organizations', label: t('adm.viewAll') }} className="o-2 d2-col-main">
          <table className="d2-table dash-table">
            <thead>
              <tr><th>{t('adm.th.name')}</th><th>{t('adm.th.type')}</th><th>{t('adm.th.users')}</th><th>{t('adm.th.status')}</th><th>{t('adm.th.created')}</th></tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.slug}>
                  <td data-label={t('adm.th.name')}><strong>{o.name}</strong></td>
                  <td data-label={t('adm.th.type')}>{TYPE_KEYS[o.type] ? t(TYPE_KEYS[o.type]) : o.type}</td>
                  <td data-label={t('adm.th.users')}>{numFmt.format(o._count.users)}</td>
                  <td data-label={t('adm.th.status')}><StatusBadge tone={o.isActive ? 'green' : 'muted'}>{o.isActive ? t('adm.status.active') : t('adm.status.inactive')}</StatusBadge></td>
                  <td data-label={t('adm.th.created')}>{dateFmt.format(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={t('adm.activation')} className="o-3 d2-col-side">
          <DonutRing percent={activeRatio} label={t('adm.activeOf')} hint={t('adm.activeHint', { a: numFmt.format(activeOrgCount), b: numFmt.format(orgCount) })} />
        </Panel>

        <Panel title={t('adm.growth')} more={{ href: '/admin/organizations', label: t('adm.orgs') }} className="d2-col-main" secondary>
          {hasSeries ? (
            <>
              <AreaChart
                labels={labels}
                series={[
                  { color: 'var(--brand-primary-medium)', values: usersSeries },
                  { color: 'var(--text-secondary)', values: orgsSeries, dashed: true },
                ]}
              />
              <div className="dash-chart-legend">
                <span><span className="dot" style={{ background: 'var(--brand-primary-medium)' }} />{t('adm.newUsers')}</span>
                <span><span className="dot" style={{ background: 'var(--text-secondary)' }} />{t('adm.newOrgs')}</span>
              </div>
            </>
          ) : (
            <EmptyNote>{t('adm.noActivity')}</EmptyNote>
          )}
        </Panel>

        <Panel title={t('adm.distByType')} className="d2-col-side" secondary>
          <ul className="d2-list">
            {typeData.map((row) => (
              <li key={row.label} className="d2-row">
                <span className="d2-row-main" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{row.label}</span><strong>{numFmt.format(row.value)}</strong>
                </span>
                <ProgressSummary value={row.value} max={typeMax} label="" />
              </li>
            ))}
          </ul>
        </Panel>

        <MobileActionBar>
          <Link href="/admin/organizations/new" className="d2-action is-primary"><Icon name="add" size={20} />{t('adm.create')}</Link>
        </MobileActionBar>
      </div>
    </div>
  );
}
