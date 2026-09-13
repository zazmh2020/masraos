import Link from 'next/link';
import LogoutButton from '@/app/app/LogoutButton';
import BackButton from '@/components/BackButton';
import { getT } from '@/lib/i18n/server';

export default async function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; role: string } }) {
  const { t } = await getT();
  return (
    <div className="midad-shell">
      <aside className="midad-sidebar">
        <Link href="/app" className="midad-brand"><strong>مسرى</strong><small>MASRA</small></Link>
        <p className="nav-caption">{t('ash.workspace')}</p>
        <nav>
          <Link href="/app">{t('ash.overview')}</Link>
          {user.role === 'PLATFORM_OWNER' && <Link href="/app/organizations">{t('ash.orgs')}</Link>}
          <Link href="/app/users">{t('ash.users')}</Link>
        </nav>
        <div className="midad-profile">
          <b>{user.name.slice(0, 1)}</b>
          <span>{user.name}<small>{t(`role.${user.role}`)}</small></span>
        </div>
        <LogoutButton />
      </aside>
      <main className="midad-main">
        <BackButton base="/app" />
        <div className="midad-main-body">{children}</div>
      </main>
    </div>
  );
}
