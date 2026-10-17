import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieDomain, tenantDestination } from '@/lib/session';
import { BRAND } from '@/lib/brand';
import { blockedFor, clear, clientIp, hit, LOGIN_RULES, loginKeys, tooManyResponse } from '@/lib/auth-throttle';

/** تجزئة bcrypt ثابتة بنفس الكلفة (12) لكلمة عشوائية — للمقارنة عند عدم وجود الحساب. */
const DUMMY_HASH = '$2b$12$BTgUPhUKirM5Tu6MLeuTOuvD3auT6L0i1xA3VeKV8gkM49vWSjoLm';

/** يبني وجهة ما بعد الدخول على المضيف الصحيح لكل دور */
function destinationFor(request: Request, role: string, slug: string | null): string {
  const host = request.headers.get('host') ?? '';
  const proto = new URL(request.url).protocol; // http: أو https:
  return tenantDestination(host, proto, role, slug);
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string; remember?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length > 1024) {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'أدخل البريد الإلكتروني وكلمة المرور.' },
      { status: 400 },
    );
  }

  // الحماية من التخمين: يُفحص القفل قبل أي مقارنة لكلمة المرور
  const keys = loginKeys(email, clientIp(request));
  const wait = await blockedFor([keys.accountIp, keys.account, keys.ip]);
  if (wait > 0) return tooManyResponse(wait);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { slug: true, isActive: true } } },
  });

  // رسالة واحدة للحالتين — حتى لا نكشف أي بريد مسجّل وأيّها ليس كذلك
  const invalid = NextResponse.json(
    { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' },
    { status: 401 },
  );

  // مقارنة bcrypt دائمًا (بتجزئة وهمية لحساب غير موجود) فلا يكشف زمن الرد وجود البريد
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await Promise.all([
      hit(keys.accountIp, LOGIN_RULES.accountIp),
      hit(keys.account, LOGIN_RULES.account),
      hit(keys.ip, LOGIN_RULES.ip),
    ]);
    return invalid;
  }
  await clear([keys.accountIp, keys.account]);

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'هذا الحساب موقوف. تواصل مع إدارة مؤسستك.' },
      { status: 403 },
    );
  }

  // منع دخول مستخدم مؤسسة معطّلة
  if (user.organization && !user.organization.isActive) {
    return NextResponse.json(
      { error: `مؤسستك موقوفة حالياً. تواصل مع إدارة ${BRAND.ar.name}.` },
      { status: 403 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

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
    body.remember === true,
    sessionCookieDomain(request.headers.get('host')),
  );

  // علامة ترحيب تظهر مرّة واحدة بعد الدخول
  const domain = sessionCookieDomain(request.headers.get('host'));
  (await cookies()).set('midad_welcome', '1', { path: '/', maxAge: 120, ...(domain ? { domain } : {}) });

  const redirectTo = destinationFor(request, user.role, user.organization?.slug ?? null);
  return NextResponse.json({ ok: true, redirectTo });
}
