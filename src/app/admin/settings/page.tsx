import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/ProfileForm';
import LogoutButton from '@/components/LogoutButton';
import { getT } from '@/lib/i18n/server';
import { rootUrl } from '@/lib/app-domain';
import '@/styles/org.css';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'PLATFORM_OWNER') redirect('/login');
  const { t } = await getT();

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, avatarUrl: true, jobTitle: true, phone: true },
  });
  if (!me) redirect('/login');

  return (
    <div className="admin-page-header" style={{ display: 'block' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>{t('shell.profile')}</h1>
        <p>{t('aset.sub')}</p>
      </div>

      <div style={{ maxWidth: 620 }}>
        <h2 className="org-settings-h2">{t('oset.profile')}</h2>
        <ProfileForm name={me.name} email={me.email} role={me.role} avatarUrl={me.avatarUrl} jobTitle={me.jobTitle} phone={me.phone} />

        <h2 className="org-settings-h2">{t('oset.account')}</h2>
        <LogoutButton redirectTo={rootUrl('/login')} />
      </div>
    </div>
  );
}
