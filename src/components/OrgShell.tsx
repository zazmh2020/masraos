'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import AppIcon from '@/components/Icon';
import TopbarTools, { type SearchItem } from '@/components/TopbarTools';
import WelcomeBack from '@/components/WelcomeBack';
import PageTransition from '@/components/PageTransition';
import OrgAssistantFab from '@/components/OrgAssistantFab';
import { useT } from '@/lib/i18n/LocaleProvider';
import { orgKey } from '@/lib/i18n/dictionaries';
import type { OrgInbox } from '@/lib/inbox';
import { brandVars } from '@/lib/brand-palette';
import { normalizeUiTheme, uiThemeAttrs } from '@/lib/ui-theme';
import '@/styles/welcome.css';

export type NavChild = { href: string; label: string; match?: string[] };
export type NavEntry =
  | { kind: 'divider'; label: string }
  | { kind: 'link'; href: string; label: string; icon: keyof typeof ICONS; match?: string[] }
  | { kind: 'group'; label: string; icon: keyof typeof ICONS; children: NavChild[] };

interface Props {
  children: ReactNode;
  org: { name: string; slug: string; type?: string | null; uiTheme?: unknown; brandColor?: string | null; brandAccent?: string | null; logoUrl?: string | null };
  user: { name: string; role: string; email?: string; avatarUrl?: string | null; jobTitle?: string | null };
  nav: NavEntry[];
  inbox: OrgInbox;
  assistant?: { show: boolean; ready: boolean };
  /** جلسة عرض تجريبي — تُخفي أزرار الحذف (عرض فقط؛ المنع الفعلي في proxy.ts على الخادم). */
  demo?: boolean;
}

// مفاتيح التنقّل القديمة تُحلّ عبر خريطة Tabler المركزية.
const ICONS = {
  home: 'dashboard', users: 'users', projects: 'projects', structure: 'structure',
  programs: 'programs', campaigns: 'campaigns', donations: 'donations',
  beneficiaries: 'beneficiaries', knowledge: 'knowledge', documents: 'documents',
  assistant: 'assistant', reports: 'reports', statistics: 'statistics',
  organization: 'organization', operations: 'operations', resources: 'resources',
  education: 'education', plans: 'memorization', competitions: 'events',
  certificates: 'certificates', content: 'content', identity: 'identity',
  admin: 'administration', settings: 'settings', logout: 'logout',
  search: 'search', notifications: 'notifications', messages: 'messages', profile: 'profile',
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return <AppIcon name={ICONS[name]} size={20} className="org-nav-ic" tone="duo" />;
}

/** صورة المستخدم — صورة مرفوعة أو أيقونة شخص افتراضية. */
function Avatar({ url }: { url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" />;
  }
  return (
    <svg className="ava-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z" />
    </svg>
  );
}

export default function OrgShell({ children, org, user, nav, inbox, assistant, demo = false }: Props) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // قراءة التخزين المحلي تتم بعد التركيب لتفادي عدم تطابق SSR
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setCollapsed(localStorage.getItem('midad_sidebar_collapsed') === '1'); } catch { /* */ }
  }, []);
  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('midad_sidebar_collapsed', next ? '1' : '0'); } catch { /* */ }
      return next;
    });
  }

  const base = `/org/${org.slug}`;

  async function handleLogout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  function isActive(href: string, match?: string[]) {
    if (href === base) return pathname === base;
    if (match?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // عناصر البحث مشتقّة من التنقّل (مع القسم من الفاصل السابق)
  const searchItems: SearchItem[] = [];
  let section: string | undefined;
  for (const entry of nav) {
    if (entry.kind === 'divider') section = entry.label;
    else if (entry.kind === 'group') {
      for (const c of entry.children) searchItems.push({ label: `${entry.label} · ${c.label}`, href: c.href, section });
    } else searchItems.push({ label: entry.label, href: entry.href, section });
  }

  return (
    <div className={`org-app ${collapsed ? 'is-collapsed' : ''}`} style={brandVars(org.brandColor, org.brandAccent)} {...uiThemeAttrs(normalizeUiTheme(org.uiTheme))} data-demo={demo ? 'true' : undefined}>
      <WelcomeBack name={user.name} greeting={t('welcome.greeting')} />
      <a href="#org-main" className="skip-link">{t('a11y.skip')}</a>
      <aside className={`org-sidebar ${open ? 'is-open' : ''}`}>
        {/* زر طيّ/فرد الشريط الجانبي (ضمن القائمة نفسها) */}
        <button
          className="org-fold-toggle"
          onClick={toggleCollapsed}
          aria-label={t('shell.foldSidebar')}
          aria-pressed={collapsed}
          title={t('shell.foldSidebar')}
        >
          <AppIcon name={collapsed ? 'menu' : 'sidebar'} size={20} />
        </button>
        <nav className="org-nav">
          {nav.map((entry, i) =>
            entry.kind === 'divider' ? (
              <div key={`d-${i}`} className="org-nav-divider">{entry.label}</div>
            ) : entry.kind === 'group' ? (
              <NavGroup key={`g-${entry.label}`} entry={entry} isActive={isActive} onNavigate={() => setOpen(false)} collapsed={collapsed} />
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={`org-nav-item ${isActive(entry.href, entry.match) ? 'is-active' : ''}`}
                onClick={() => setOpen(false)}
                title={entry.label}
              >
                <Icon name={entry.icon} />
                <span>{entry.label}</span>
              </Link>
            ),
          )}
        </nav>
      </aside>

      {confirmLogout && (
        <div className="org-modal-scrim" onClick={() => setConfirmLogout(false)}>
          <div className="org-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="org-modal-ic"><Icon name="logout" /></div>
            <h3>{t('shell.logout.confirm.title')}</h3>
            <p>{t('shell.logout.confirm.body')}</p>
            <div className="org-modal-actions">
              <button className="org-btn org-btn-outline" onClick={() => setConfirmLogout(false)} disabled={busy}>{t('shell.cancel')}</button>
              <button className="org-btn org-btn-danger" onClick={handleLogout} disabled={busy}>
                {busy ? t('shell.loggingOut') : t('shell.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && <div className="org-scrim" onClick={() => setOpen(false)} />}

      <div className="org-main">
        <header className="org-topbar">
          <button className="org-menu-toggle" onClick={() => setOpen(true)} aria-label={t('shell.menu')}>
            <AppIcon name="menu" size={20} />
          </button>
          {pathname !== base && (
            <button className="org-back" onClick={() => router.back()} aria-label={t('shell.back')} title={t('shell.back')}>
              <AppIcon name="back" size={20} className="org-back-ic" />
            </button>
          )}
          <Link href={base} className="org-topbar-brand" onClick={() => setOpen(false)}>
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" className="org-brand-logo-img" />
            ) : (
              <LogoMark size={22} className="org-brand-logo" />
            )}
            <span className="org-topbar-name">{org.name}</span>
          </Link>
          <TopbarTools
            searchItems={searchItems}
            messages={inbox.messages}
            notifications={inbox.notifications}
            storageKey={`midad_org_${org.slug}`}
            orgType={org.type}
          />
          <div className="org-topbar-profile">
            <button className="tbar-user" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} aria-label={t('shell.profile')}>
              <span className="tbar-user-ava"><Avatar url={user.avatarUrl} /></span>
              <span className="tbar-user-tx">
                <span className="tbar-user-name">{user.name}</span>
                <span className="tbar-user-role">{user.jobTitle || t(orgKey(`role.${user.role}`, org.type))}</span>
              </span>
              <AppIcon name="chevronDown" size={16} className="tbar-user-chev" />
            </button>
            {profileOpen && (
              <>
                <div className="org-menu-backdrop" onClick={() => setProfileOpen(false)} />
                <div className="org-profile-menu org-profile-menu-top">
                  <div className="org-profile-head">
                    <span className="org-profile-name">{user.name}</span>
                    <span className="org-profile-role">{user.jobTitle || t(orgKey(`role.${user.role}`, org.type))}</span>
                  </div>
                  <Link href={`${base}/settings`} className="org-profile-link" onClick={() => setProfileOpen(false)}>
                    <Icon name="profile" />
                    <span>{t('shell.profile')}</span>
                  </Link>
                  <button className="org-profile-link org-profile-logout" onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}>
                    <Icon name="logout" />
                    <span>{t('shell.logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main id="org-main" tabIndex={-1} className="org-content"><PageTransition>{children}</PageTransition></main>
      </div>
      {assistant?.show && <OrgAssistantFab ready={assistant.ready} />}
    </div>
  );
}

/** مجموعة تنقّل قابلة للطيّ — تُفتح تلقائيًا إن كان أحد عناصرها نشطًا. */
function NavGroup({
  entry, isActive, onNavigate, collapsed,
}: {
  entry: Extract<NavEntry, { kind: 'group' }>;
  isActive: (href: string, match?: string[]) => boolean;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const anyActive = entry.children.some((c) => isActive(c.href, c.match));
  const [open, setOpen] = useState(anyActive);
  // يُفتح تلقائيًا عند الانتقال لعنصر نشط، مع إتاحة الطيّ/الفرد يدويًا بعدها
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (anyActive) setOpen(true); }, [anyActive]);
  const expanded = open;

  return (
    <div className={`org-nav-group ${expanded ? 'is-open' : ''}`}>
      <button
        type="button"
        className={`org-nav-item org-nav-grouphd ${anyActive ? 'is-parent-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={entry.label}
        aria-expanded={expanded}
      >
        <Icon name={entry.icon} />
        <span>{entry.label}</span>
        {!collapsed && (
          <AppIcon name="chevronDown" size={16} className="org-nav-chev" />
        )}
      </button>
      {expanded && !collapsed && (
        <div className="org-nav-children">
          {entry.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`org-nav-child ${isActive(c.href, c.match) ? 'is-active' : ''}`}
              onClick={onNavigate}
            >
              <span className="org-nav-dot" aria-hidden="true" />
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
