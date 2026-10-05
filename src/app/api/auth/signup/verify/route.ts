import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { normalizeOtpInput } from '@/lib/signup';
import { verifyOtp, OTP_MAX_ATTEMPTS } from '@/lib/otp';
import { ORG_MODULES } from '@/lib/modules';
import { SECTORS } from '@/lib/org-types';
import { createSession, sessionCookieDomain, tenantDestination } from '@/lib/session';

/** الأنظمة المعطّلة افتراضيًا لمركز قرآن جديد = كل الأنظمة عدا المقترحة لقطاعه. */
function quranCenterDisabledModules(): string[] {
  const sector = SECTORS.find((s) => s.id === 'QURAN_CENTER');
  const suggested = new Set<string>(sector?.suggestedModules ?? []);
  return ORG_MODULES.filter((m) => !suggested.has(m));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
  const code = normalizeOtpInput(body?.code);
  if (!requestId || !code) return NextResponse.json({ error: 'أدخل الرمز المكوّن من 6 أرقام.' }, { status: 400 });

  const req = await prisma.signupRequest.findUnique({ where: { id: requestId } });
  if (!req || req.consumedAt) return NextResponse.json({ error: 'انتهى هذا الطلب. ابدأ إنشاء الحساب من جديد.', restart: true }, { status: 400 });
  if (req.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.', expired: true }, { status: 410 });
  if (req.attempts >= OTP_MAX_ATTEMPTS) return NextResponse.json({ error: 'تجاوزت عدد المحاولات المسموح. اطلب رمزًا جديدًا.', expired: true }, { status: 429 });

  if (!verifyOtp(req.id, code, req.codeHash)) {
    const updated = await prisma.signupRequest.update({ where: { id: req.id }, data: { attempts: { increment: 1 } } });
    const left = Math.max(0, OTP_MAX_ATTEMPTS - updated.attempts);
    return NextResponse.json({ error: left ? `الرمز غير صحيح. المتبقّي ${left} محاولات.` : 'الرمز غير صحيح. اطلب رمزًا جديدًا.', attemptsLeft: left }, { status: 400 });
  }

  // إنشاء المؤسسة ومديرها في معاملة واحدة، مع "حجز" الطلب أولًا لمنع الإنشاء المزدوج
  let user: { id: string; email: string; name: string; role: string; organizationId: string | null; sessionVersion: number };
  try {
    user = await prisma.$transaction(async (tx) => {
      const claimed = await tx.signupRequest.updateMany({ where: { id: req.id, consumedAt: null }, data: { consumedAt: new Date() } });
      if (claimed.count !== 1) throw new Error('ALREADY_CONSUMED');
      const org = await tx.organization.create({
        data: {
          name: req.orgName,
          slug: req.slug,
          type: 'MOSQUE',
          disabledModules: quranCenterDisabledModules(),
          users: {
            create: { name: req.name, email: req.email, phone: req.phone, passwordHash: req.passwordHash, role: 'ORG_ADMIN' },
          },
        },
        include: { users: { select: { id: true, email: true, name: true, role: true, organizationId: true, sessionVersion: true } } },
      });
      return org.users[0];
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'سُجّل هذا البريد أو رابط المركز للتو. ابدأ من جديد ببيانات أخرى.', restart: true }, { status: 409 });
    }
    if (e instanceof Error && e.message === 'ALREADY_CONSUMED') {
      return NextResponse.json({ error: 'تم استخدام هذا الطلب بالفعل. سجّل الدخول.', restart: true }, { status: 409 });
    }
    throw e;
  }

  const host = request.headers.get('host');
  const domain = sessionCookieDomain(host);
  await createSession(
    { userId: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId, organizationSlug: req.slug, sessionVersion: user.sessionVersion },
    false,
    domain,
  );
  (await cookies()).set('midad_welcome', '1', { path: '/', maxAge: 120, ...(domain ? { domain } : {}) });

  const proto = new URL(request.url).protocol;
  return NextResponse.json({ ok: true, redirectTo: tenantDestination(host ?? '', proto, user.role, req.slug) });
}
