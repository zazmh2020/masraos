import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieDomain, tenantDestination } from '@/lib/session';

/* ============================================================
   دخول تجريبي (Dev only) — بدون كلمة مرور.
   يعمل فقط خارج بيئة الإنتاج، لتسهيل الفحص والتطوير.
   استخدام: /api/auth/dev-login?email=owner@midad.local
   ============================================================ */

function destinationFor(request: Request, role: string, slug: string | null): string {
  const host = request.headers.get('host') ?? '';
  const proto = new URL(request.url).protocol;
  return tenantDestination(host, proto, role, slug);
}

export async function GET(request: Request) {
  // لا يمكن لأي علم تجريبي فتح دخول بلا كلمة مرور في الإنتاج.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'غير متاح.' }, { status: 404 });
  }

  const email = (new URL(request.url).searchParams.get('email') ?? 'owner@midad.local')
    .trim()
    .toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { slug: true, isActive: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: `لا يوجد مستخدم بالبريد ${email}` }, { status: 404 });
  }

  await createSession(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationSlug: user.organization?.slug ?? null,
      sessionVersion: user.sessionVersion,
    },
    true,
    sessionCookieDomain(request.headers.get('host')),
  );

  const domain = sessionCookieDomain(request.headers.get('host'));
  (await cookies()).set('midad_welcome', '1', { path: '/', maxAge: 120, ...(domain ? { domain } : {}) });

  return NextResponse.redirect(destinationFor(request, user.role, user.organization?.slug ?? null));
}
