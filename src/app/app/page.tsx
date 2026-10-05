import { redirect } from 'next/navigation';
import { getVerifiedSession } from '@/lib/session-guard';
import LogoutButton from './LogoutButton';

const roleLabels: Record<string, string> = {
  PLATFORM_OWNER: 'مالك المنصة',
  ORG_ADMIN: 'مدير مؤسسة',
  STAFF: 'موظف',
  MEMBER: 'مستخدم',
};

export default async function DashboardPage() {
  const session = await getVerifiedSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-6)' }}>
      <span className="eyebrow">لوحة التحكم</span>
      <h1>مرحباً، {session.name}</h1>

      <p style={{ marginTop: 'var(--space-2)' }}>
        دخلت بحساب <strong>{session.email}</strong> بصفة{' '}
        <strong>{roleLabels[session.role] ?? session.role}</strong>.
      </p>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <LogoutButton />
      </div>
    </main>
  );
}
