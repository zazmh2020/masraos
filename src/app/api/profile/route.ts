import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSession } from '@/lib/session-guard';
import { imageValue } from '@/lib/branding';

/** تعديل الملف الشخصي لأي مستخدم مسجّل (بالجلسة) — الاسم والصورة. */
export async function PATCH(request: Request) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ error: 'الاسم قصير جداً.' }, { status: 400 });
  }

  let avatarUrl: string | null | undefined;
  if (body.avatarUrl !== undefined) {
    try { avatarUrl = imageValue(body.avatarUrl, 'الصورة الشخصية'); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'صورة غير صالحة.' }, { status: 400 }); }
  }

  const jobTitle = body.jobTitle !== undefined ? String(body.jobTitle ?? '').trim().slice(0, 120) || null : undefined;
  const phone = body.phone !== undefined ? String(body.phone ?? '').trim().slice(0, 40) || null : undefined;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(jobTitle !== undefined ? { jobTitle } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
