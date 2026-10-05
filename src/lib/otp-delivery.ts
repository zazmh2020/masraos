import type { SignupChannel } from '@/lib/signup';
import { sendEmail } from '@/lib/email';

/* ============================================================
   إرسال رمز التحقق — بلا ادّعاء إرسال:
   1) OTP_WEBHOOK_URL: يُرسَل الطلب إلى أداة أتمتة (n8n/Make…) التي
      توصله عبر SMS أو واتساب أو البريد. يُوقَّع بـ OTP_WEBHOOK_SECRET إن ضُبط.
   2) بيئة التطوير فقط: يُعاد الرمز للواجهة للاختبار دون تسجيله.
   3) غير ذلك (إنتاج بلا مزوّد): رفض صريح — لا نُنشئ طلبًا لا يمكن إتمامه.
   ============================================================ */

export type OtpDelivery =
  | { ok: true; via: 'resend' | 'webhook' | 'dev'; devCode?: string }
  | { ok: false; reason: 'not_configured' | 'failed' };

export function otpMessage(code: string): string {
  return `رمز التحقق لإنشاء حسابك في مسرى: ${code}\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.`;
}

export async function deliverOtp(channel: SignupChannel, to: string, code: string): Promise<OtpDelivery> {
  // Explicit opt-in avoids changing existing webhook delivery silently.
  if (channel === 'EMAIL' && process.env.OTP_EMAIL_PROVIDER === 'resend') {
    if (!/^\d{6}$/.test(code)) return { ok: false, reason: 'failed' };
    const result = await sendEmail({
      to,
      subject: 'رمز التحقق لحسابك في مَسرى',
      text: otpMessage(code),
      html: `<html lang="ar" dir="rtl"><body style="margin:0;padding:24px;background:#FAF7FE;font-family:Arial,sans-serif;color:#1A1126"><div style="max-width:480px;margin:auto;background:#fff;padding:32px;border-radius:16px"><h1 style="color:#61428C;font-size:24px">مَسرى</h1><h2 style="font-size:20px">تأكيد بريدك الإلكتروني</h2><p>استخدم الرمز التالي لإكمال إنشاء حسابك ومركزك:</p><p dir="ltr" style="font-size:32px;font-weight:bold;color:#61428C;text-align:center">${code}</p><p>صالح لمدة 10 دقائق. لا تشارك الرمز مع أحد.</p><p>إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.</p></div></body></html>`,
    });
    return result.ok ? { ok: true, via: 'resend' } : { ok: false, reason: result.reason === 'not_configured' ? 'not_configured' : 'failed' };
  }
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
    // للتطوير فقط؛ لا نسجل رمز المصادقة أو بيانات الاتصال في السجلات.
    return { ok: true, via: 'dev', devCode: code };
  }

  return { ok: false, reason: 'not_configured' };
}
