import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getVerifiedSession } from '@/lib/session-guard';
import { createSession, sessionCookieDomain } from '@/lib/session';

/** تغيير كلمة المرور لأي مستخدم مسجّل — بعد التحقق من الحالية. */
export async function POST(request: Request) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'كلمة المرور الجديدة: 8 محارف على الأقل.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  // إبطال كل الجلسات الأخرى، ثم جلسة جديدة لهذا الجهاز فقط
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await createSession({ ...session, sessionVersion: updated.sessionVersion }, true, sessionCookieDomain(request.headers.get('host')));
  return NextResponse.json({ ok: true });
}
