import { NextResponse } from 'next/server';
import { withSignupRequestLock } from '@/lib/signup-request-lock';
import { generateOtp, hashOtp, OTP_MAX_SENDS, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from '@/lib/otp';
import { deliverOtp } from '@/lib/otp-delivery';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
  if (!requestId) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const reservation = await withSignupRequestLock(requestId, async (tx) => {
    const req = await tx.signupRequest.findUnique({ where: { id: requestId } });
    if (!req || req.consumedAt) return NextResponse.json({ error: 'انتهى هذا الطلب. ابدأ إنشاء الحساب من جديد.', restart: true }, { status: 400 });

    const waitMs = req.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
    if (waitMs > 0) return NextResponse.json({ error: `انتظر ${Math.ceil(waitMs / 1000)} ثانية قبل طلب رمز جديد.`, retryAfter: Math.ceil(waitMs / 1000) }, { status: 429 });
    if (req.sendCount >= OTP_MAX_SENDS) return NextResponse.json({ error: 'تجاوزت عدد مرات الإرسال. ابدأ إنشاء الحساب من جديد.', restart: true }, { status: 429 });

    let code = generateOtp();
    while (hashOtp(req.id, code) === req.codeHash) code = generateOtp();
    const now = new Date();
    // احجز الإرسال وأبطل القديم قبل الاتصال بالمزوّد؛ لا نحتجز قفل قاعدة البيانات أثناء الشبكة.
    await tx.signupRequest.update({
      where: { id: req.id },
      data: { codeHash: hashOtp(req.id, code), attempts: 0, sendCount: { increment: 1 }, lastSentAt: now, expiresAt: new Date(now.getTime() + OTP_TTL_MS) },
    });
    return { channel: req.channel, target: req.channel === 'PHONE' ? req.phone! : req.email, code };
  });
  if (reservation instanceof Response) return reservation;

  const sent = await deliverOtp(reservation.channel, reservation.target, reservation.code)
    .catch(() => ({ ok: false as const, reason: 'failed' as const }));
  if (!sent.ok) {
    // لا نُرجع الرمز القديم: قد يكون المزوّد أرسل الرسالة رغم تعذّر تأكيدها.
    // يظل الحجز محسوبًا والانتظار ساريًا لمنع الإغراق عند تعطل المزوّد.
    return NextResponse.json({ error: sent.reason === 'not_configured' ? 'خدمة إرسال رمز التحقق غير مفعّلة حاليًا.' : 'تعذّر تأكيد إرسال الرمز. انتظر دقيقة قبل طلب رمز جديد.', retryAfter: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000) }, { status: sent.reason === 'not_configured' ? 503 : 502 });
  }

  return NextResponse.json({ ok: true, ...(sent.devCode ? { devCode: sent.devCode } : {}) });
}
