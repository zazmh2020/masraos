'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import type { SessionData } from '@/lib/session';
import { LogoMark } from '@/components/Logo';
import TopbarTools, { type SearchItem } from '@/components/TopbarTools';
import WelcomeBack from '@/components/WelcomeBack';
import PageTransition from '@/components/PageTransition';
import OrgAssistantFab from '@/components/OrgAssistantFab';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { OrgInbox } from '@/lib/inbox';
import { rootUrl } from '@/lib/app-domain';
import '@/styles/welcome.css';

interface Props {
  children: ReactNode;
  session: SessionData;
  avatarUrl?: string | null;
  inbox: OrgInbox;
  assistantReady?: boolean;
}

const ASSISTANT_SUGGESTIONS = [
  'كم عدد المؤسسات المسجّلة؟',
  'ما المؤسسات النشطة حاليًا؟',
  'كم إجمالي المستخدمين على المنصّة؟',
  'أيّ المؤسسات أُنشئت مؤخرًا؟',
];

// ربط مفاتيح التنقّل بنظام أيقونات مسرى (public/icons)
const ICONS = {
  home: 'navigation/navigation-dashboard',
  building: 'organization/organization-institution',
  content: 'communication/communication-announcement',
  settings: 'navigation/navigation-settings',
  entitlement: 'identity/identity-security',
  logout: 'navigation/navigation-logout',
} as const;

const navItems = [
  { href: '/admin', labelKey: 'anav.overview', icon: 'home' as const },
  { href: '/admin/organizations', labelKey: 'anav.organizations', icon: 'building' as const },
  { href: '/admin/entitlements', labelKey: 'anav.entitlements', icon: 'entitlement' as const },
  { href: '/admin/content', labelKey: 'anav.content', icon: 'content' as const },
  { href: '/admin/hero', labelKey: 'anav.hero', icon: 'content' as const },
  { href: '/admin/settings', labelKey: 'anav.settings', icon: 'settings' as const },
];

function Icon({ name }: { name: keyof typeof ICONS }) {
  const url = `url(/icons/${ICONS[name]}.svg)`;
  return (
    <span
      aria-hidden="true"
      className="app-icon admin-nav-ic"
      style={{ WebkitMaskImage: url, maskImage: url }}
    />
  );
}

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

export default function AdminShell({ children, session, avatarUrl, inbox, assistantReady = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);
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

  const t = useT();
  const searchItems: SearchItem[] = navItems.map((n) => ({ label: t(n.labelKey), href: n.href }));

  async function handleLogout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    // بعد الخروج، انتقل إلى صفحة الدخول على الدومين الرئيسي
    window.location.href = rootUrl('/login');
  }

  return (
    <div className={`admin-app ${collapsed ? 'is-collapsed' : ''}`}>
      <WelcomeBack name={session.name} greeting={t('welcome.greeting')} />
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <button
          className="org-fold-toggle"
          onClick={toggleCollapsed}
          aria-label={t('shell.foldSidebar')}
          aria-pressed={collapsed}
          title={t('shell.foldSidebar')}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <path d="M4 5h12M4 10h12M4 15h12" />
              : <><rect x="2.5" y="3.5" width="15" height="13" rx="2" /><path d="M12.5 3.5v13" /></>}
          </svg>
        </button>
        <div className="admin-side-profile">
          <div className="admin-user admin-user-stacked">
            <span className="admin-user-avatar admin-user-avatar-lg">
              <Avatar url={avatarUrl} />
            </span>
            <span className="admin-user-name">{session.name}</span>
            <span className="admin-user-role">{t('anav.owner')}</span>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* حجاب الخلفية عند فتح الشريط الجانبي على الموبايل */}
      {sidebarOpen && <div className="admin-scrim" onClick={() => setSidebarOpen(false)} />}

      {confirmLogout && (
        <div className="admin-modal-scrim" onClick={() => setConfirmLogout(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-ic"><Icon name="logout" /></div>
            <h3>{t('shell.logout.confirm.title')}</h3>
            <p>{t('shell.logout.confirm.body')}</p>
            <div className="admin-modal-actions">
              <button className="btn-admin-outline" onClick={() => setConfirmLogout(false)} disabled={busy}>{t('shell.cancel')}</button>
              <button className="btn-admin-danger" onClick={handleLogout} disabled={busy}>
                {busy ? t('shell.loggingOut') : t('shell.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={t('shell.menu')}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1h18M1 7h18M1 13h18" />
            </svg>
          </button>
          {pathname !== '/admin' && (
            <button className="org-back" onClick={() => router.back()} aria-label={t('shell.back')} title={t('shell.back')}>
              <svg className="org-back-ic" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6" /></svg>
            </button>
          )}
          <Link href="/admin" className="admin-topbar-brand">
            <span className="admin-brand-icon"><LogoMark size={20} /></span>
            <span className="admin-topbar-name">{t('brand')} <b>{t('anav.brandRole')}</b></span>
          </Link>
          <TopbarTools
            searchItems={searchItems}
            messages={inbox.messages}
            notifications={inbox.notifications}
            storageKey="midad_admin"
          />
          <div className="org-topbar-profile">
            <button className="tbar-user" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} aria-label={t('shell.profile')}>
              <span className="tbar-user-ava"><Avatar url={avatarUrl} /></span>
              <span className="tbar-user-tx">
                <span className="tbar-user-name">{session.name}</span>
                <span className="tbar-user-role">{t('anav.owner')}</span>
              </span>
              <svg className="tbar-user-chev" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8l4 4 4-4" /></svg>
            </button>
            {profileOpen && (
              <>
                <div className="org-menu-backdrop" onClick={() => setProfileOpen(false)} />
                <div className="admin-profile-menu org-profile-menu-top">
                  <div className="admin-profile-head">
                    <span className="admin-profile-name">{session.name}</span>
                    <span className="admin-profile-email" dir="ltr">{session.email}</span>
                  </div>
                  <Link href="/admin/settings" className="admin-profile-link" onClick={() => setProfileOpen(false)}>
                    <Icon name="settings" />
                    <span>{t('shell.profile')}</span>
                  </Link>
                  <button className="admin-profile-link admin-profile-logout" onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}>
                    <Icon name="logout" />
                    <span>{t('shell.logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="admin-content"><PageTransition>{children}</PageTransition></main>
      </div>

      <OrgAssistantFab
        ready={assistantReady}
        endpoint="/api/admin/assistant"
        suggestions={ASSISTANT_SUGGESTIONS}
        placeholder="اكتب سؤالك عن المنصّة…"
        hint="يجيب المساعد من بيانات منصّتك (المؤسسات والمستخدمون)."
      />
    </div>
  );
}
