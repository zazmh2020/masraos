import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });

  if (!user || !user.isActive) redirect('/login');
  if (user.sessionVersion !== session.sessionVersion) redirect('/login'); // جلسة أُبطلت
  if (user.organization && !user.organization.isActive) redirect('/login');
  return user;
}

export async function requirePlatformOwner() {
  const user = await requireUser();
  if (user.role !== 'PLATFORM_OWNER') redirect('/app');
  return user;
}
