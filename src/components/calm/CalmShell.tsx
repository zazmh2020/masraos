import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon from '@/components/Icon';
import { CalmIcon } from './icons';

export interface CalmNavItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
  kbd?: string[];
}

export interface Crumb { label: string; href?: string; icon?: string }

/** الهيكل الموحّد: شريط جانبي (يمين في RTL) + لوحة بيضاء + شريط مسار علوي. */
export default function CalmShell({
  main, secondary, active, crumbs, account, children,
}: {
  main: CalmNavItem[];
  secondary?: CalmNavItem[];
  active: string;
  crumbs: Crumb[];
  account: { name: string; role: string; initials: string };
  children: ReactNode;
}) {
  const item = (n: CalmNavItem) => (
    <Link key={n.key} href={n.href} className={`calm-nav-item ${n.key === active ? 'is-active' : ''}`} aria-current={n.key === active ? 'page' : undefined}>
      <Icon name={n.icon} size={20} />
      <span>{n.label}</span>
      {n.count ? <span className="count" aria-label={`${n.count} غير مقروءة`}>{n.count}</span> : null}
      {n.kbd ? <span className="kbd" aria-hidden>{n.kbd.map((k) => <span key={k}>{k}</span>)}</span> : null}
    </Link>
  );

  return (
    <div className="calm">
      <div className="calm-app">
        <aside className="calm-side" aria-label="القائمة الرئيسية">
          <div className="calm-side-head">
            <span className="calm-logo" aria-label="مَسرى"><Icon name="quran" size={20} /></span>
            <button type="button" className="calm-icon-btn is-ghost" aria-label="طيّ القائمة">
              <Icon name="sidebar" size={20} />
            </button>
          </div>

          <div className="calm-nav-label">القائمة الرئيسية</div>
          <nav className="calm-nav">{main.map(item)}</nav>

          {secondary?.length ? (
            <>
              <div className="calm-nav-label">الأخبار والإعدادات</div>
              <nav className="calm-nav is-secondary">{secondary.map(item)}</nav>
            </>
          ) : null}

          <div className="calm-side-foot">
            <nav className="calm-nav">
              <Link href="#" className="calm-nav-item"><Icon name="settings" size={20} /><span>الإعدادات</span></Link>
            </nav>
            <div className="calm-nav-label">الحساب</div>
            <div className="calm-account">
              <span className="calm-ava is-lg">{account.initials}</span>
              <div><b>{account.name}</b><small>{account.role}</small></div>
            </div>
          </div>
        </aside>

        <main className="calm-main">
          <header className="calm-topbar">
            <nav className="calm-crumbs" aria-label="مسار التنقّل">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <span key={i} style={{ display: 'contents' }}>
                    {i > 0 && <span className="sep"><CalmIcon name="chevronEnd" size={16} /></span>}
                    {last ? (
                      <span className="current" aria-current="page">{c.icon && <Icon name={c.icon} size={16} />}{c.label}</span>
                    ) : (
                      <Link href={c.href ?? '#'}>{c.icon && <Icon name={c.icon} size={16} />}{c.label}</Link>
                    )}
                  </span>
                );
              })}
            </nav>
            <div className="calm-topbar-actions">
              <button type="button" className="calm-icon-btn" aria-label="الإشعارات"><Icon name="notifications" size={20} /></button>
              <button type="button" className="calm-icon-btn" aria-label="الرسائل"><Icon name="messages" size={20} /><span className="dot" /></button>
              <button type="button" className="calm-icon-btn" aria-label="بحث"><Icon name="search" size={20} /></button>
            </div>
          </header>
          <div className="calm-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
