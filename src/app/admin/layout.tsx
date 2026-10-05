import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getVerifiedSession } from '@/lib/session-guard';
import { prisma } from '@/lib/prisma';
import AdminShell from './AdminShell';
import { getAdminInbox } from '@/lib/inbox';
import { isAssistantConfigured } from '@/lib/anthropic';
import '@/styles/admin.css';
import '@/styles/org.css';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getVerifiedSession();

  // فقط مالك المنصة يصل هنا
  if (!session) redirect('/login');
  if (session.role !== 'PLATFORM_OWNER') redirect('/login');

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { avatarUrl: true },
  });
  const inbox = await getAdminInbox();

  return (
    <AdminShell
      session={session}
      avatarUrl={me?.avatarUrl ?? null}
      inbox={inbox}
      assistantReady={isAssistantConfigured()}
    >
      {children}
    </AdminShell>
  );
}
