import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtp, hashOtp, OTP_MAX_SENDS, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from '@/lib/otp';
import { deliverOtp } from '@/lib/otp-delivery';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
  if (!requestId) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const req = await prisma.signupRequest.findUnique({ where: { id: requestId } });
  if (!req || req.consumedAt) return NextResponse.json({ error: 'انتهى هذا الطلب. ابدأ إنشاء الحساب من جديد.', restart: true }, { status: 400 });

  const waitMs = req.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
  if (waitMs > 0) return NextResponse.json({ error: `انتظر ${Math.ceil(waitMs / 1000)} ثانية قبل طلب رمز جديد.`, retryAfter: Math.ceil(waitMs / 1000) }, { status: 429 });
  if (req.sendCount >= OTP_MAX_SENDS) return NextResponse.json({ error: 'تجاوزت عدد مرات الإرسال. ابدأ إنشاء الحساب من جديد.', restart: true }, { status: 429 });

  const code = generateOtp();
  const sent = await deliverOtp(req.channel, req.channel === 'PHONE' ? req.phone! : req.email, code);
  if (!sent.ok) {
    return NextResponse.json({ error: sent.reason === 'not_configured' ? 'خدمة إرسال رمز التحقق غير مفعّلة حاليًا.' : 'تعذّر إرسال الرمز. حاول بعد قليل.' }, { status: sent.reason === 'not_configured' ? 503 : 502 });
  }

  // رمز جديد يُبطل القديم ويعيد ضبط المحاولات
  await prisma.signupRequest.update({
    where: { id: req.id },
    data: { codeHash: hashOtp(req.id, code), attempts: 0, sendCount: { increment: 1 }, lastSentAt: new Date(), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  return NextResponse.json({ ok: true, ...(sent.devCode ? { devCode: sent.devCode } : {}) });
}
