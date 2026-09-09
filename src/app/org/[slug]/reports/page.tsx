import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewReports } from '@/lib/permissions';
import ReportToolbar from '@/components/ReportToolbar';
import { getT, getLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

const numFmt = new Intl.NumberFormat('en-US');

/** يبني آخر n أشهر: [{ key: 'YYYY-M', start, end, label }] */
function lastMonths(n: number, locale: string) {
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short' });
  const out: { key: string; start: Date; end: Date; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ key: `${start.getFullYear()}-${start.getMonth()}`, start, end, label: fmt.format(start) });
  }
  return out;
}

/** رسم بياني خطّي/مساحي بسيط لسلسلة واحدة (يُعرض على الخادم). */
function TrendChart({
  title, labels, values, color, noData, fmt,
}: {
  title: string; labels: string[]; values: number[]; color: string; noData: string; fmt: (v: number) => string;
}) {
  const total = values.reduce((s, v) => s + v, 0);
  const W = 520, H = 190, padX = 30, top = 16, bottom = 34;
  const max = Math.max(1, ...values);
  const n = labels.length;
  const stepX = (W - padX * 2) / Math.max(1, n - 1);
  const usableH = H - top - bottom;
  const pt = (v: number, i: number) => [padX + i * stepX, top + usableH * (1 - v / max)] as const;
  const line = values.map((v, i) => `${i ? 'L' : 'M'} ${pt(v, i)[0].toFixed(1)} ${pt(v, i)[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${pt(values[n - 1], n - 1)[0].toFixed(1)} ${H - bottom} L ${padX} ${H - bottom} Z`;
  const grid = [top + 4, top + usableH / 2, H - bottom];
  const gid = `tr-${color.replace('#', '')}`;

  return (
    <div className="org-panel">
      <div className="org-trend-hd">
        <h2>{title}</h2>
        <span className="org-trend-total" style={{ color }}>{fmt(total)}</span>
      </div>
      {total === 0 ? (
        <p className="org-panel-sub">{noData}</p>
      ) : (
        <svg className="org-trend-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={title}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid.map((y, i) => <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(43,26,78,0.08)" strokeDasharray="3 5" />)}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((v, i) => <circle key={i} cx={pt(v, i)[0]} cy={pt(v, i)[1]} r="3.2" fill={color} />)}
          <g fontFamily="Tahoma, sans-serif" fontSize="11" fill="#7c7788" textAnchor="middle">
            {labels.map((l, i) => <text key={i} x={padX + i * stepX} y={H - 12}>{l}</text>)}
          </g>
        </svg>
      )}
    </div>
  );
}

/** يحوّل تجميع groupBy إلى خريطة قيمة→عدد */
function toMap<R extends { _count: number }>(rows: R[], keyer: (r: R) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[keyer(r)] = r._count;
  return out;
}

function Distribution({ title, data, label, noData }: { title: string; data: Record<string, number>; label: (k: string) => string; noData: string }) {
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="org-panel">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="org-panel-sub">{noData}</p>
      ) : (
        <div className="org-dist">
          {entries.map(([k, v]) => (
            <div key={k} className="org-dist-row">
              <span className="org-dist-label">{label(k)}</span>
              <div className="org-dist-bar">
                <span style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
              </div>
              <span className="org-dist-value">{numFmt.format(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function OrgReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewReports(user)) redirect(`/org/${org.slug}`);
  const locale = await getLocale();
  const where = { organizationId: org.id };
  const sLabel = (kind: string) => (s: string) => t(`status.${kind}.${s}`);

  // آخر ٦ أشهر — تجميع التبرعات المستلمة والأعضاء الجدد شهريًا
  const months = lastMonths(6, locale);
  const since = months[0].start;
  const [recentDonations, recentUsers] = await Promise.all([
    prisma.donation.findMany({
      where: { ...where, status: 'RECEIVED', donatedAt: { gte: since } },
      select: { amount: true, donatedAt: true },
    }),
    prisma.user.findMany({ where: { ...where, createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const donationsSeries = months.map((m) =>
    recentDonations.filter((d) => monthKey(d.donatedAt) === m.key).reduce((s, d) => s + d.amount, 0),
  );
  const membersSeries = months.map((m) => recentUsers.filter((u) => monthKey(u.createdAt) === m.key).length);
  const monthLabels = months.map((m) => m.label);

  const [
    users, activeUsers, departments, programs, beneficiaries, campaigns,
    projByStatus, progByStatus, campByStatus, benByStatus,
    donationCount, receivedAgg,
  ] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, isActive: true } }),
    prisma.department.count({ where }),
    prisma.program.count({ where }),
    prisma.beneficiary.count({ where }),
    prisma.campaign.count({ where }),
    prisma.project.groupBy({ by: ['status'], where, _count: true }),
    prisma.program.groupBy({ by: ['status'], where, _count: true }),
    prisma.campaign.groupBy({ by: ['status'], where, _count: true }),
    prisma.beneficiary.groupBy({ by: ['status'], where, _count: true }),
    prisma.donation.count({ where }),
    prisma.donation.aggregate({ where: { ...where, status: 'RECEIVED' }, _sum: { amount: true } }),
  ]);

  const projectCount = projByStatus.reduce((s, r) => s + r._count, 0);
  const totalReceived = receivedAgg._sum.amount ?? 0;

  const metrics = [
    { label: t('rep.m.activeUsers'), value: `${activeUsers} / ${users}` },
    { label: t('rep.m.units'), value: numFmt.format(departments) },
    { label: t('rep.m.projects'), value: numFmt.format(projectCount) },
    { label: t('rep.m.programs'), value: numFmt.format(programs) },
    { label: t('rep.m.campaigns'), value: numFmt.format(campaigns) },
    { label: t('rep.m.beneficiaries'), value: numFmt.format(beneficiaries) },
    { label: t('rep.m.donations'), value: numFmt.format(donationCount) },
    { label: t('rep.m.received'), value: numFmt.format(totalReceived) },
  ];

  const printedAt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="org-page rep-print-root">
      {/* ترويسة تظهر عند الطباعة/التصدير فقط */}
      <div className="rep-print-header" aria-hidden="true">
        <span className="rep-print-brand">
          {org.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="rep-print-logo" src={org.logoUrl} alt="" />
          )}
          <strong>{org.name}</strong>
        </span>
        <span>{t('rep.title')} · {printedAt}</span>
      </div>

      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('rep.eyebrow')}</span>
          <h1>{t('rep.title')}</h1>
          <p>{t('rep.intro', { org: org.name })}</p>
        </div>
        <ReportToolbar />
      </div>

      <div className="org-stats">
        {metrics.map((m) => (
          <div key={m.label} className="org-stat">
            <div className="org-stat-label">{m.label}</div>
            <div className="org-stat-value">{m.value}</div>
          </div>
        ))}
      </div>

      <h2 className="org-section-title">{t('rep.trends.title')}</h2>
      <div className="org-report-grid">
        <TrendChart
          title={t('rep.trends.donations')}
          labels={monthLabels}
          values={donationsSeries}
          color="#6B57A0"
          noData={t('rep.noData')}
          fmt={(v) => numFmt.format(v)}
        />
        <TrendChart
          title={t('rep.trends.members')}
          labels={monthLabels}
          values={membersSeries}
          color="#2F9E7E"
          noData={t('rep.noData')}
          fmt={(v) => numFmt.format(v)}
        />
      </div>

      <h2 className="org-section-title">{t('rep.trends.dist')}</h2>
      <div className="org-report-grid">
        <Distribution title={t('rep.d.projects')} data={toMap(projByStatus, (r) => r.status)} label={sLabel('project')} noData={t('rep.noData')} />
        <Distribution title={t('rep.d.programs')} data={toMap(progByStatus, (r) => r.status)} label={sLabel('program')} noData={t('rep.noData')} />
        <Distribution title={t('rep.d.campaigns')} data={toMap(campByStatus, (r) => r.status)} label={sLabel('campaign')} noData={t('rep.noData')} />
        <Distribution title={t('rep.d.beneficiaries')} data={toMap(benByStatus, (r) => r.status)} label={sLabel('beneficiary')} noData={t('rep.noData')} />
      </div>
    </div>
  );
}
