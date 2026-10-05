import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getSession, type SessionData } from '@/lib/session';

/* ============================================================
   الجلسة الموثَّقة من قاعدة البيانات — لا نثق بالكوكي وحده.
   الكوكي الموقّع يثبت أن الخادم أصدرها، لا أنها ما زالت صالحة.
   هنا نتحقق في كل طلب من:
     1) وجود المستخدم ونشاطه.
     2) تطابق رقم إصدار الجلسات (يُبطل الجلسات بعد تغيير كلمة المرور/الدور/التعطيل).
     3) نشاط المؤسسة وتطابقها مع الجلسة.
   ويُعاد الدور من قاعدة البيانات، لا من الكوكي.
   ============================================================ */

type GuardUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  sessionVersion: number;
  organizationId: string | null;
  organization: { id: string; slug: string; isActive: boolean } | null;
};

/** يتحقق من تطابق جلسة مع سجل المستخدم الحالي. منفصلة لتُستخدم في كل الحراس وتُختبر وحدها. */
export function sessionMatchesUser(session: SessionData, user: GuardUser | null): boolean {
  if (!user || !user.isActive) return false;
  if (user.sessionVersion !== session.sessionVersion) return false;
  if ((user.organizationId ?? null) !== (session.organizationId ?? null)) return false;
  if (user.organization) {
    if (!user.organization.isActive) return false;
    if (user.organization.slug !== session.organizationSlug) return false;
  } else if (session.organizationSlug !== null) {
    return false;
  }
  return true;
}

/** الجلسة الحالية بعد التحقق منها في قاعدة البيانات، بدور واسم حاليين — أو null. مُخزّنة لكل طلب. */
export const getVerifiedSession = cache(async (): Promise<SessionData | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, sessionVersion: true, organizationId: true,
      organization: { select: { id: true, slug: true, isActive: true } },
    },
  });
  if (!sessionMatchesUser(session, user)) return null;

  return { ...session, role: user!.role, name: user!.name, email: user!.email };
});
