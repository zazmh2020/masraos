import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import {
  canViewUsers, canManageSettings, canViewProjects, canViewStructure,
  canViewCampaigns, canViewBeneficiaries, canViewKnowledge, canViewReports,
  canViewDocuments, canUseAssistant, canManageUsers, canViewRequests, canViewFinance,
  canScanPoints,
} from '@/lib/permissions';
import OrgShell, { type NavEntry } from '@/components/OrgShell';
import { getOrgInbox } from '@/lib/inbox';
import { moduleEnabled } from '@/lib/modules';
import { isAssistantConfigured } from '@/lib/anthropic';
import { getT } from '@/lib/i18n/server';
import '@/styles/org.css';

export const dynamic = 'force-dynamic';

/** أيقونة التبويب (favicon) واسم التبويب حسب هوية كل جهة. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({ where: { slug }, select: { name: true, faviconUrl: true, logoUrl: true } });
  if (!org) return {};
  const icon = org.faviconUrl || org.logoUrl;
  return {
    title: { default: org.name, template: `%s · ${org.name}` },
    ...(icon ? { icons: { icon } } : {}),
  };
}

/* الطبقات الثلاث للتنقّل:
   1) العمل المؤسسي  2) المعرفة والذكاء  3) إدارة النظام */
export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  // الفاعل بقدراته الفعّالة (الدور المخصّص إن وُجد) — لتعكس القائمة صلاحياته
  const r = user;
  const base = `/org/${org.slug}`;
  const inbox = await getOrgInbox(org.id);
  const { t } = await getT();

  // الوحدات المفعّلة لهذه المؤسسة
  const md = org.disabledModules;
  // هل هذا الحساب وليّ أمر مرتبط؟ (لإظهار بوّابة المتابعة)
  const isGuardian = (await prisma.guardian.count({ where: { userId: user.id, organizationId: org.id } })) > 0;

  // الطبقة الأولى — العمل المؤسسي (الصلاحية + تفعيل الوحدة)
  const orgSection = canViewStructure(r) || canViewUsers(r) || canManageSettings(r);
  const opsSection = (canViewProjects(r) || canViewCampaigns(r)) && moduleEnabled(md, 'operations');
  const resourcesSection = canViewBeneficiaries(r) && moduleEnabled(md, 'resources');
  const educationSection = canViewProjects(r) && moduleEnabled(md, 'education'); // موظفو المؤسسة يديرون التعليم

  const nav: NavEntry[] = [
    { kind: 'link', href: base, label: t('onav.dashboard'), icon: 'home' },
    ...(orgSection
      ? ([{ kind: 'link', href: `${base}/organization`, label: t('onav.organization'), icon: 'organization',
          match: [`${base}/organization`, `${base}/structure`, `${base}/users`] }] as NavEntry[])
      : []),
    ...(opsSection
      ? ([{ kind: 'link', href: `${base}/operations`, label: t('onav.operations'), icon: 'operations',
          match: [`${base}/operations`, `${base}/projects`, `${base}/programs`, `${base}/campaigns`, `${base}/donations`] }] as NavEntry[])
      : []),
    ...(resourcesSection
      ? ([{ kind: 'link', href: `${base}/resources`, label: t('onav.resources'), icon: 'resources',
          match: [`${base}/resources`, `${base}/beneficiaries`] }] as NavEntry[])
      : []),
    ...(educationSection
      ? ([{
          kind: 'group', label: t('onav.education'), icon: 'education',
          children: [
            { href: `${base}/education`, label: t('onav.eduOverview'), match: [`${base}/education`] },
            { href: `${base}/education/my-halaqat`, label: t('onav.myHalaqat') },
            { href: `${base}/education/plans`, label: t('onav.plans') },
            { href: `${base}/education/competitions`, label: t('onav.competitions') },
            { href: `${base}/education/certificates`, label: t('onav.certificates') },
            { href: `${base}/education/guardians`, label: t('onav.guardians') },
            { href: `${base}/education/statistics`, label: t('onav.statistics') },
            { href: `${base}/fees`, label: t('onav.fees'), match: [`${base}/fees`] },
          ],
        }] as NavEntry[])
      : []),
    ...(isGuardian
      ? ([{ kind: 'link', href: `${base}/guardian`, label: t('onav.guardianPortal'), icon: 'users', match: [`${base}/guardian`] }] as NavEntry[])
      : []),
    ...(canScanPoints(r)
      ? ([{ kind: 'link', href: `${base}/points`, label: t('onav.points'), icon: 'identity', match: [`${base}/points`] }] as NavEntry[])
      : []),
    ...(canViewFinance(r)
      ? ([{ kind: 'link', href: `${base}/finance`, label: t('onav.finance'), icon: 'donations', match: [`${base}/finance`] }] as NavEntry[])
      : []),
    ...(canViewRequests(r)
      ? ([{ kind: 'link', href: `${base}/requests`, label: t('onav.requests'), icon: 'documents',
          match: [`${base}/requests`] }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/events`, label: t('onav.events'), icon: 'competitions', match: [`${base}/events`] },

    // الطبقة الثانية — المعرفة والذكاء
    { kind: 'divider', label: t('onav.div.knowledge') },
    { kind: 'link', href: `${base}/search`, label: t('onav.search'), icon: 'knowledge', match: [`${base}/search`] },
    { kind: 'link', href: `${base}/notifications`, label: t('onav.notifications'), icon: 'reports', match: [`${base}/notifications`] },
    { kind: 'link', href: `${base}/messages`, label: t('onav.messages'), icon: 'content', match: [`${base}/messages`] },
    ...(canViewDocuments(r) && moduleEnabled(md, 'documents')
      ? ([{ kind: 'link', href: `${base}/documents`, label: t('onav.documents'), icon: 'documents' }] as NavEntry[])
      : []),
    ...(canViewKnowledge(r) && moduleEnabled(md, 'knowledge')
      ? ([{ kind: 'link', href: `${base}/knowledge`, label: t('onav.knowledge'), icon: 'knowledge' }] as NavEntry[])
      : []),
    ...(canViewReports(r) && moduleEnabled(md, 'reports')
      ? ([{ kind: 'link', href: `${base}/reports`, label: t('onav.reports'), icon: 'reports' }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/identity`, label: t('onav.identity'), icon: 'identity' },

    // الطبقة الثالثة — إدارة النظام
    { kind: 'divider', label: t('onav.div.system') },
    ...(canManageSettings(r) && moduleEnabled(md, 'content')
      ? ([{ kind: 'link', href: `${base}/content`, label: t('onav.content'), icon: 'content' }] as NavEntry[])
      : []),
    ...(canManageUsers(r)
      ? ([{ kind: 'link', href: `${base}/admin`, label: t('onav.admin'), icon: 'admin' }] as NavEntry[])
      : []),
    ...(canManageUsers(r)
      ? ([{ kind: 'link', href: `${base}/audit`, label: t('onav.audit'), icon: 'reports', match: [`${base}/audit`] }] as NavEntry[])
      : []),
    ...(canManageSettings(r)
      ? ([{ kind: 'link', href: `${base}/billing`, label: t('onav.billing'), icon: 'operations', match: [`${base}/billing`] }] as NavEntry[])
      : []),
    { kind: 'link', href: `${base}/settings`, label: t('onav.settings'), icon: 'settings' },
  ];

  return (
    <OrgShell
      org={{ name: org.name, slug: org.slug, brandColor: org.brandColor, brandAccent: org.brandAccent, logoUrl: org.logoUrl }}
      user={{ name: user.name, role: user.role, email: user.email, avatarUrl: user.avatarUrl, jobTitle: user.jobTitle }}
      nav={nav}
      inbox={inbox}
      assistant={{ show: canUseAssistant(r) && moduleEnabled(md, 'assistant'), ready: isAssistantConfigured() }}
    >
      {children}
    </OrgShell>
  );
}
