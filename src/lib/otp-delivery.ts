import type { SignupChannel } from '@/lib/signup';

/* ============================================================
   إرسال رمز التحقق — بلا ادّعاء إرسال:
   1) OTP_WEBHOOK_URL: يُرسَل الطلب إلى أداة أتمتة (n8n/Make…) التي
      توصله عبر SMS أو واتساب أو البريد. يُوقَّع بـ OTP_WEBHOOK_SECRET إن ضُبط.
   2) بيئة التطوير فقط: يُطبع الرمز في سجلّ الخادم ويُعاد للواجهة للاختبار.
   3) غير ذلك (إنتاج بلا مزوّد): رفض صريح — لا نُنشئ طلبًا لا يمكن إتمامه.
   ============================================================ */

export type OtpDelivery =
  | { ok: true; via: 'webhook' | 'dev'; devCode?: string }
  | { ok: false; reason: 'not_configured' | 'failed' };

export function otpMessage(code: string): string {
  return `رمز التحقق لإنشاء حسابك في مسرى: ${code}\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.`;
}

export async function deliverOtp(channel: SignupChannel, to: string, code: string): Promise<OtpDelivery> {
  const hook = process.env.OTP_WEBHOOK_URL;
  if (hook) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.OTP_WEBHOOK_SECRET) headers['X-Masra-Signature'] = process.env.OTP_WEBHOOK_SECRET;
      const res = await fetch(hook, {
        method: 'POST',
        headers,
        body: JSON.stringify({ purpose: 'signup', channel: channel === 'PHONE' ? 'sms' : 'email', to, code, message: otpMessage(code) }),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok ? { ok: true, via: 'webhook' } : { ok: false, reason: 'failed' };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // للتطوير فقط — يظهر في سجلّ الخادم وفي واجهة الاختبار
    console.info(`[otp:dev] ${channel} → ${to}: ${code}`);
    return { ok: true, via: 'dev', devCode: code };
  }

  return { ok: false, reason: 'not_configured' };
}
