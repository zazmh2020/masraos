import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieDomain, tenantDestination, DEMO_COOKIE } from '@/lib/session';

/* ============================================================
   دخول العرض التجريبي (Demo) — بنقرة واحدة، بلا كلمة مرور.
   يدخل الزائر إلى حساب عرض ثابت واحد فقط (يُضبَط عبر DEMO_LOGIN_EMAIL)،
   ولا يقبل أي بريد من العميل — فلا يمكن انتحال حسابات أخرى.
   الجلسة موسومة "demo" ويضع كوكي midad_demo=1، فيمنع الـ proxy أي تعديل
   (POST/PUT/PATCH/DELETE) — استعراض فقط، آمن للنشر العام.
   ============================================================ */

export async function GET(request: Request) {
  const demoEmail = (process.env.DEMO_LOGIN_EMAIL ?? '').trim().toLowerCase();
  if (!demoEmail) {
    // العرض التجريبي غير مُفعّل على هذه البيئة
    return NextResponse.json({ error: 'العرض التجريبي غير متاح حاليًا.' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: demoEmail },
    include: { organization: { select: { slug: true, isActive: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: 'حساب العرض غير مُهيّأ.' }, { status: 500 });
  }

  const domain = sessionCookieDomain(request.headers.get('host'));

  await createSession(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationSlug: user.organization?.slug ?? null,
      demo: true,
    },
    true,
    domain,
  );

  const store = await cookies();
  // وسم العرض التجريبي (يقرأه الـ proxy لمنع التعديلات) + شارة الترحيب
  store.set(DEMO_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: 7 * 24 * 60 * 60,
  });
  store.set('midad_welcome', '1', { path: '/', maxAge: 120, ...(domain ? { domain } : {}) });

  const proto = new URL(request.url).protocol;
  return NextResponse.redirect(tenantDestination(request.headers.get('host') ?? '', proto, user.role, user.organization?.slug ?? null));
}
