import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/* ============================================================
   رموز التحقق لمرة واحدة (OTP) — خادميّ فقط.
   الرمز لا يُخزَّن نصًّا: HMAC-SHA256 بسرّ الخادم ومعرّف الطلب،
   فتسريب قاعدة البيانات لا يكشف الرموز ولا يسمح بتخمينها دون السرّ.
   ============================================================ */

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;        // صلاحية الرمز: 10 دقائق
export const OTP_MAX_ATTEMPTS = 5;                // محاولات إدخال لكل رمز
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;  // انتظار بين طلبات إعادة الإرسال
export const OTP_MAX_SENDS = 5;                   // أقصى عدد إرسال لكل طلب

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET غير معرّف');
  return s;
}

/** رمز من 6 أرقام بتوزيع منتظم (crypto.randomInt). */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

export function hashOtp(requestId: string, code: string): string {
  return createHmac('sha256', secret()).update(`signup:${requestId}:${code}`).digest('hex');
}

/** مقارنة بزمن ثابت (تمنع هجمات التوقيت). */
export function verifyOtp(requestId: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtp(requestId, code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** إخفاء جزئي لعرض الوجهة دون كشفها كاملة: a••••@example.com */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return '••••';
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(2, Math.min(6, user.length - 1)))}@${domain}`;
}

/** +9665•••••12 */
export function maskPhone(phone: string): string {
  if (phone.length <= 6) return '••••';
  return `${phone.slice(0, 5)}${'•'.repeat(phone.length - 7)}${phone.slice(-2)}`;
}
