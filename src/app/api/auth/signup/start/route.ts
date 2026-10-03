import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateSignup } from '@/lib/signup';
import { generateOtp, hashOtp, maskEmail, maskPhone, OTP_TTL_MS } from '@/lib/otp';
import { deliverOtp } from '@/lib/otp-delivery';

/** حدّ الطلبات لكل بريد في الساعة (يمنع إغراق صندوق/جوال الضحية). */
const MAX_REQUESTS_PER_HOUR = 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const v = validateSignup(body);
  if (!v.ok) return NextResponse.json({ error: v.error, field: v.field }, { status: 400 });
  const d = v.data;

  const [existingUser, existingOrg, recent] = await Promise.all([
    prisma.user.findUnique({ where: { email: d.email }, select: { id: true } }),
    prisma.organization.findUnique({ where: { slug: d.slug }, select: { id: true } }),
    prisma.signupRequest.count({ where: { email: d.email, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } }),
  ]);
  if (existingUser) return NextResponse.json({ error: 'هذا البريد مسجّل بالفعل — سجّل الدخول بدلًا من ذلك.', field: 'email' }, { status: 409 });
  if (existingOrg) return NextResponse.json({ error: 'رابط المركز مستخدم بالفعل، اختر رابطًا آخر.', field: 'slug' }, { status: 409 });
  if (recent >= MAX_REQUESTS_PER_HOUR) return NextResponse.json({ error: 'طلبات كثيرة لهذا البريد. حاول بعد ساعة.' }, { status: 429 });

  const id = randomUUID();
  const code = generateOtp();
  const target = d.channel === 'PHONE' ? d.phone! : d.email;

  await prisma.signupRequest.create({
    data: {
      id,
      channel: d.channel,
      name: d.name,
      email: d.email,
      phone: d.phone,
      orgName: d.orgName,
      slug: d.slug,
      passwordHash: await bcrypt.hash(d.password, 12),
      codeHash: hashOtp(id, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const sent = await deliverOtp(d.channel, target, code);
  if (!sent.ok) {
    // لا نترك طلبًا لا يمكن إتمامه
    await prisma.signupRequest.delete({ where: { id } }).catch(() => {});
    return sent.reason === 'not_configured'
      ? NextResponse.json({ error: 'خدمة إرسال رمز التحقق غير مفعّلة حاليًا. تواصل مع فريق مسرى.' }, { status: 503 })
      : NextResponse.json({ error: 'تعذّر إرسال رمز التحقق. حاول مرة أخرى بعد قليل.' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    requestId: id,
    channel: d.channel,
    maskedTarget: d.channel === 'PHONE' ? maskPhone(target) : maskEmail(target),
    ...(sent.devCode ? { devCode: sent.devCode } : {}),
  });
}
