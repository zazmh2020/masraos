import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { BRAND } from '@/lib/brand';
import { blockedFor, clientIp, hit, throttleKey } from '@/lib/auth-throttle';
import { issueResetToken, resetUrl } from '@/lib/password-reset';
import { reportError } from '@/lib/observe';

const RULES = {
  email: { limit: 3, windowSec: 3600, blockSec: 3600 }, // 3 طلبات للبريد في الساعة
  ip: { limit: 10, windowSec: 3600, blockSec: 3600 }, // 10 طلبات من العنوان في الساعة
};

/** رد عام واحد دائمًا — لا يكشف إن كان البريد مسجّلًا أو موقوفًا أو تجاوز الحد. */
const generic = () => NextResponse.json({ ok: true, message: 'إن كان البريد مسجّلًا لدينا فستصلك رسالة بخطوات الاستعادة.' });

function resetEmail(link: string) {
  const html = `<html lang="ar" dir="rtl"><body style="margin:0;padding:24px;background:#FAF7FE;font-family:Arial,sans-serif;color:#1A1126"><div style="max-width:480px;margin:auto;background:#fff;padding:32px;border-radius:16px"><h1 style="color:#61428C;font-size:24px">${BRAND.ar.name}</h1><h2 style="font-size:20px">استعادة كلمة المرور</h2><p>طلبت إعادة تعيين كلمة المرور. الرابط صالح لمدة 30 دقيقة ويُستعمل مرة واحدة:</p><p style="text-align:center;margin:28px 0"><a href="${link}" style="background:#61428C;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700">تعيين كلمة مرور جديدة</a></p><p style="font-size:13px;color:#555">إذا لم تطلب ذلك فتجاهل الرسالة؛ كلمة مرورك الحالية لم تتغير.</p></div></body></html>`;
  const text = `${BRAND.ar.name} — استعادة كلمة المرور\n\nالرابط صالح لمدة 30 دقيقة ويُستعمل مرة واحدة:\n${link}\n\nإذا لم تطلب ذلك فتجاهل الرسالة.`;
  return { subject: `${BRAND.ar.name} — استعادة كلمة المرور`, html, text };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !email.includes('@')) {
    return NextResponse.json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا.' }, { status: 400 });
  }

  const emailKey = throttleKey('reset:email', email);
  const ipKey = throttleKey('reset:ip', clientIp(request));
  if (await blockedFor([emailKey, ipKey])) return generic();
  const [byEmail, byIp] = await Promise.all([hit(emailKey, RULES.email), hit(ipKey, RULES.ip)]);
  if (byEmail.count > RULES.email.limit || byIp.count > RULES.ip.limit) return generic();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, isActive: true, organization: { select: { isActive: true } } },
  });
  if (!user || !user.isActive || (user.organization && !user.organization.isActive)) return generic();

  const token = await issueResetToken(user.id);
  const link = resetUrl(token, request.url);
  if (!link) {
    await reportError({ message: 'password reset: NEXT_PUBLIC_APP_DOMAIN is not set; reset email not sent', where: 'auth/password/forgot' });
    return generic();
  }

  const sent = await sendEmail({ to: user.email, ...resetEmail(link) });
  if (!sent.ok) {
    if (process.env.NODE_ENV !== 'production') {
      // التطوير فقط: لا مزوّد بريد — يُطبع الرابط في سجل الخادم المحلي لإكمال التجربة
      console.info(`[dev] password reset link for ${user.email}: ${link}`);
    } else {
      await reportError({ message: `password reset email not sent (${sent.reason})`, where: 'auth/password/forgot' });
    }
  }
  return generic();
}
