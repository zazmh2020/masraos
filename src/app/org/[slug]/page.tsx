import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import {
  canViewUsers, canManageUsers, canViewProjects, canViewStructure, canViewPrograms,
  canViewCampaigns, canViewBeneficiaries, canViewReports,
  canViewDocuments, canUseAssistant,
} from '@/lib/permissions';
import Icon from '@/components/Icon';
import DashboardShell from '@/components/dash/DashboardShell';
import StatCard, { type StatColor } from '@/components/dash/StatCard';
import AreaChart from '@/components/dash/AreaChart';
import DonutRing from '@/components/dash/DonutRing';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
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

export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  // لوحات مخصّصة حسب الدور — تجربة مبنية حول مهام كل دور
  if (user.role === 'TEACHER') {
    return <TeacherDashboard orgId={org.id} slug={org.slug} userId={user.id} userName={user.name} />;
  }
  if (user.role === 'STUDENT') {
    return <StudentDashboard orgId={org.id} slug={org.slug} userId={user.id} userName={user.name} />;
  }

  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short' });
  const weekdayFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { weekday: 'short' });

  const w = { organizationId: org.id };
  const days = buildDays();
  const weekAgo = days[0];

  const [
    total, active, projectCount, deptCount, programCount, campaignCount, beneficiaryCount,
    newUsers7, newProjects7, recentUsers, latestProject, latestCampaign, latestProgram,
  ] = await Promise.all([
    prisma.user.count({ where: w }),
    prisma.user.count({ where: { ...w, isActive: true } }),
    prisma.project.count({ where: w }),
    prisma.department.count({ where: w }),
    prisma.program.count({ where: w }),
    prisma.campaign.count({ where: w }),
    prisma.beneficiary.count({ where: w }),
    prisma.user.findMany({ where: { ...w, createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
    prisma.project.findMany({ where: { ...w, createdAt: { gte: weekAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({
      where: w, orderBy: { createdAt: 'desc' }, take: 5,
      select: { name: true, role: true, isActive: true, createdAt: true, department: { select: { name: true } } },
    }),
    prisma.project.findFirst({ where: w, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true } }),
    prisma.campaign.findFirst({ where: w, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true } }),
    prisma.program.findFirst({ where: w, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true } }),
  ]);

  const canUsers = canViewUsers(user);
  const canManage = canManageUsers(user);
  const canProjects = canViewProjects(user);
  const canStructure = canViewStructure(user);
  const canPrograms = canViewPrograms(user);
  const canCampaigns = canViewCampaigns(user);
  const canBeneficiaries = canViewBeneficiaries(user);
  const canReports = canViewReports(user);
  const canDocuments = canViewDocuments(user);
  const canAssistant = canUseAssistant(user);

  const labels = days.map((d) => weekdayFmt.format(d));
  const usersSeries = bucketByDay(newUsers7.map((u) => u.createdAt), days);
  const projectsSeries = bucketByDay(newProjects7.map((p) => p.createdAt), days);
  const hasSeries = usersSeries.some((v) => v > 0) || projectsSeries.some((v) => v > 0);
  const activeRatio = total > 0 ? Math.round((active / total) * 100) : 0;

  // بطاقات الإحصاء (مقيّدة بالصلاحيات)
  const stats: { icon: string; color: StatColor; label: string; value: string; trend?: string }[] = [];
  if (canUsers) {
    stats.push({ icon: 'people/people-users', color: 'purple', label: t('od.stat.totalUsers'), value: numFmt.format(total), trend: newUsers7.length ? t('od.thisWeek', { n: newUsers7.length }) : undefined });
    stats.push({ icon: 'people/people-members', color: 'green', label: t('od.stat.active'), value: numFmt.format(active) });
  }
  if (canStructure) stats.push({ icon: 'organization/organization-structure', color: 'blue', label: t('od.stat.units'), value: numFmt.format(deptCount) });
  if (canProjects) stats.push({ icon: 'operations/operations-projects', color: 'gold', label: t('od.stat.projects'), value: numFmt.format(projectCount), trend: newProjects7.length ? t('od.thisWeek', { n: newProjects7.length }) : undefined });
  if (canPrograms) stats.push({ icon: 'operations/operations-programs', color: 'purple', label: t('od.stat.programs'), value: numFmt.format(programCount) });
  if (canCampaigns) stats.push({ icon: 'operations/operations-campaigns', color: 'gold', label: t('od.stat.campaigns'), value: numFmt.format(campaignCount) });
  if (canBeneficiaries) stats.push({ icon: 'people/people-beneficiaries', color: 'green', label: t('od.stat.beneficiaries'), value: numFmt.format(beneficiaryCount) });
  const topStats = stats.slice(0, 4);

  // آخر النشاطات (من أحدث السجلات الحقيقية)
  const activity: { icon: string; color: string; title: string; text: string; at: Date }[] = [];
  if (canProjects && latestProject) activity.push({ icon: 'operations/operations-projects', color: '', title: t('od.act.project'), text: latestProject.name, at: latestProject.createdAt });
  if (canCampaigns && latestCampaign) activity.push({ icon: 'operations/operations-campaigns', color: 'gold', title: t('od.act.campaign'), text: latestCampaign.name, at: latestCampaign.createdAt });
  if (canPrograms && latestProgram) activity.push({ icon: 'operations/operations-programs', color: 'green', title: t('od.act.program'), text: latestProgram.name, at: latestProgram.createdAt });
  if (canUsers && recentUsers[0]) activity.push({ icon: 'people/people-users', color: 'blue', title: t('od.act.newMember'), text: recentUsers[0].name, at: recentUsers[0].createdAt });
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const activityTop = activity.slice(0, 4);

  const modules = [
    canStructure && { href: `/org/${org.slug}/organization`, icon: 'organization/organization-institution', title: t('onav.organization'), text: t('od.mod.org') },
    canProjects && { href: `/org/${org.slug}/operations`, icon: 'operations/operations-activities', title: t('onav.operations'), text: t('od.mod.ops') },
    canBeneficiaries && { href: `/org/${org.slug}/resources`, icon: 'people/people-groups', title: t('onav.resources'), text: t('od.mod.resources') },
    canProjects && { href: `/org/${org.slug}/education`, icon: 'education/education-education', title: t('onav.education'), text: t('od.mod.education') },
    canDocuments && { href: `/org/${org.slug}/documents`, icon: 'documents/documents-documents', title: t('onav.documents'), text: t('od.mod.documents') },
    canReports && { href: `/org/${org.slug}/reports`, icon: 'analytics/analytics-analytics', title: t('onav.reports'), text: t('od.mod.reports') },
    canAssistant && { href: `/org/${org.slug}/assistant`, icon: 'ai/ai-ai-assistant', title: t('onav.assistant'), text: t('od.mod.assistant') },
    canManage && { href: `/org/${org.slug}/admin`, icon: 'administration/administration-system-settings', title: t('onav.admin'), text: t('od.mod.admin') },
  ].filter(Boolean) as { href: string; icon: string; title: string; text: string }[];

  return (
    <div className="org-page">
      <DashboardShell>
        {/* رأس الصفحة */}
        <div className="dash-hd">
          <div>
            <span className="dash-eyebrow">{t('od.eyebrow')}</span>
            <h1>{t('od.welcome', { name: user.name })}</h1>
            <p className="dash-sub">
              {org.name} — {TYPE_KEYS[org.type] ? t(TYPE_KEYS[org.type]) : org.type} · {t('od.role')}{' '}
              <strong>{t(`role.${user.role}`)}</strong>
            </p>
          </div>
          {canManage && (
            <div className="dash-hd-actions">
              <Link href={`/org/${org.slug}/users/new`} className="dash-btn">
                <Icon name="actions/actions-add" size={16} /> {t('od.addUser')}
              </Link>
            </div>
          )}
        </div>

        {/* الإحصائيات */}
        {topStats.length > 0 && (
          <div className="dash-stats">
            {topStats.map((s) => (
              <StatCard key={s.label} icon={s.icon} color={s.color} label={s.label} value={s.value} trend={s.trend} />
            ))}
          </div>
        )}

        {/* إجراءات سريعة */}
        <div className="dash-quick">
          <Link href={`/org/${org.slug}/education/monthly`} className="dash-quick-tile"><Icon name="education/education-quran-memorization" size={18} />{t('od.q.monthly')}</Link>
          <Link href={`/org/${org.slug}/tasks`} className="dash-quick-tile"><Icon name="operations/operations-tasks" size={18} />{t('od.q.tasks')}</Link>
          <Link href={`/org/${org.slug}/education/students`} className="dash-quick-tile"><Icon name="people/people-students" size={18} />{t('od.q.students')}</Link>
          <Link href={`/org/${org.slug}/events`} className="dash-quick-tile"><Icon name="operations/operations-events" size={18} />{t('od.q.events')}</Link>
          <Link href={`/org/${org.slug}/requests`} className="dash-quick-tile"><Icon name="operations/operations-requests" size={18} />{t('od.q.requests')}</Link>
          <Link href={`/org/${org.slug}/search`} className="dash-quick-tile"><Icon name="navigation/navigation-search" size={18} />{t('od.q.search')}</Link>
        </div>

        {/* الشبكة الرئيسية: رسم + حلقة */}
        {canUsers && (
          <div className="dash-grid-main">
            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>{t('od.activity7')}</h3>
                {canReports && <Link href={`/org/${org.slug}/reports`} className="dash-link">{t('od.viewDetails')} ←</Link>}
              </div>
              {hasSeries ? (
                <>
                  <AreaChart
                    labels={labels}
                    series={[
                      { color: 'var(--purple-500)', values: usersSeries },
                      { color: 'var(--gold-500)', values: projectsSeries, dashed: true },
                    ]}
                  />
                  <div className="dash-chart-legend">
                    <span><span className="dot" style={{ background: 'var(--purple-500)' }} />{t('od.newMembers')}</span>
                    <span><span className="dot" style={{ background: 'var(--gold-500)' }} />{t('od.projects')}</span>
                  </div>
                </>
              ) : (
                <p className="dash-chart-empty">{t('od.noActivity')}</p>
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>{t('od.activityRatio')}</h3>
                <span className="dash-link">{t('od.users')}</span>
              </div>
              <DonutRing
                percent={activeRatio}
                label={t('od.activeOf')}
                hint={t('od.activeHint', { a: numFmt.format(active), b: numFmt.format(total) })}
              />
            </div>
          </div>
        )}

        {/* الشبكة السفلية: جدول + جانب */}
        <div className="dash-grid-bottom">
          {canUsers ? (
            <div className="dash-card">
              <div className="dash-card-hd">
                <h3>{t('od.latestUsers')}</h3>
                <Link href={`/org/${org.slug}/users`} className="dash-link">{t('od.allUsers')} ←</Link>
              </div>
              {recentUsers.length === 0 ? (
                <p className="dash-ann-empty">{t('od.noUsers')}</p>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr><th>{t('od.th.user')}</th><th>{t('od.th.role')}</th><th>{t('od.th.status')}</th><th>{t('od.th.added')}</th></tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u, i) => (
                      <tr key={i}>
                        <td>
                          <div className="dash-cell-user">
                            <span className="dash-avatar">{u.name.charAt(0)}</span>
                            <div>
                              <div className="n">{u.name}</div>
                              {u.department?.name && <div className="s">{u.department.name}</div>}
                            </div>
                          </div>
                        </td>
                        <td>{t(`role.${u.role}`)}</td>
                        <td><span className={`dash-badge ${u.isActive ? 'green' : 'muted'}`}>{u.isActive ? t('od.status.active') : t('od.status.inactive')}</span></td>
                        <td>{dateFmt.format(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="dash-card">
              <div className="dash-card-hd"><h3>{t('od.quickAccess')}</h3></div>
              <div className="dash-modules">
                {modules.map((m) => (
                  <Link key={m.href} href={m.href} className="dash-module">
                    <span className="dash-module-ic"><Icon name={m.icon} size={18} /></span>
                    <span><strong>{m.title}</strong><span>{m.text}</span></span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="dash-side">
            <div className="dash-card">
              <div className="dash-card-hd"><h3>{t('od.recentActivity')}</h3></div>
              {activityTop.length === 0 ? (
                <p className="dash-ann-empty">{t('od.noRecent')}</p>
              ) : (
                <div className="dash-ann-list">
                  {activityTop.map((a, i) => (
                    <div key={i} className="dash-ann">
                      <span className={`dash-ann-ic ${a.color}`}><Icon name={a.icon} size={16} /></span>
                      <div className="dash-ann-body">
                        <div className="dash-ann-title">{a.title}</div>
                        <div className="dash-ann-text">{a.text}</div>
                        <div className="dash-ann-time">{dateFmt.format(a.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canReports && (
              <div className="dash-promo">
                <h4>{t('od.promo.title')}</h4>
                <p>{t('od.promo.sub')}</p>
                <Link href={`/org/${org.slug}/reports`} className="dash-promo-btn">
                  <Icon name="analytics/analytics-analytics" size={14} /> {t('od.promo.cta')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
