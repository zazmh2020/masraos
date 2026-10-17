import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { reportError } from '@/lib/observe';

/* ============================================================
   الحماية من المحاولات المتكررة — مخزن مركزي في PostgreSQL (جدول auth_throttles)
   فيعمل مع أكثر من نسخة خادم، لا ذاكرة لكل عملية.

   - كل فشل يزيد عدّاد مفتاحه داخل نافذة زمنية بعملية ذرية واحدة (INSERT … ON CONFLICT).
   - عند تجاوز الحد يُقفل المفتاح مؤقتًا (blockedUntil) — لا قفل دائم للحساب.
   - المفاتيح بصمات HMAC بسرّ الجلسات: لا يُخزَّن البريد ولا عنوان IP بنصه.
   ============================================================ */

export type ThrottleRule = { limit: number; windowSec: number; blockSec: number };

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET غير معرّف');
  return value;
}

/** مفتاح ثابت غير قابل للعكس لقيمة حساسة (بريد/IP). */
export function throttleKey(scope: string, ...parts: string[]): string {
  const digest = createHmac('sha256', secret()).update(parts.join('\u0000')).digest('base64url').slice(0, 32);
  return `${scope}:${digest}`;
}

/**
 * عنوان العميل لأغراض التقييد فقط (ليس للمصادقة).
 * خلف وكيل الاستضافة يُضاف العنوان الحقيقي في آخر X-Forwarded-For؛ لذلك نأخذ الأخير
 * (المرسل لا يتحكم إلا بما قبله). بدون وكيل قد يُزوَّر — لهذا تبقى حدود الحساب مستقلة عن العنوان.
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const last = xff?.split(',').map((s) => s.trim()).filter(Boolean).pop();
  return (last || request.headers.get('x-real-ip') || 'unknown').slice(0, 64);
}

/**
 * إن لم يُطبَّق ترحيل auth_throttles بعد (الجدول غير موجود) لا نُسقط تسجيل الدخول كله:
 * نسجّل خطأً واضحًا ونكمل بلا تقييد. أي خطأ آخر يُرمى كالمعتاد.
 */
async function tolerateMissingTable<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const text = String((error as { message?: unknown })?.message ?? error);
    if (/auth_throttles|AuthThrottle/.test(text) && /does not exist|42P01|P2021/.test(text + String((error as { code?: unknown })?.code ?? ''))) {
      await reportError({ message: 'auth_throttles table missing: apply migration 20261017100000 — login throttling is OFF', where: 'auth-throttle' });
      return fallback;
    }
    throw error;
  }
}

/** أطول مدة قفل متبقية (بالثواني) بين المفاتيح، أو 0 إن لم يكن أي منها مقفلًا. */
export async function blockedFor(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  return tolerateMissingTable(0, async () => {
  const rows = await prisma.authThrottle.findMany({
    where: { key: { in: keys }, blockedUntil: { gt: new Date() } },
    select: { blockedUntil: true },
  });
  const until = Math.max(0, ...rows.map((r) => r.blockedUntil!.getTime()));
  return until ? Math.ceil((until - Date.now()) / 1000) : 0;
  });
}

/** يسجّل محاولة لمفتاح؛ عند بلوغ الحد (المحاولة رقم limit) يُقفل لما بعدها. يعيد العدد داخل النافذة. */
export async function hit(key: string, rule: ThrottleRule): Promise<{ count: number; blocked: boolean }> {
  return tolerateMissingTable({ count: 0, blocked: false }, async () => {
  const rows = await prisma.$queryRaw<{ count: number; blockedUntil: Date | null }[]>`
    INSERT INTO "auth_throttles" ("key", "count", "windowStart", "blockedUntil", "updatedAt")
    VALUES (${key}, 1, now(), NULL, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "auth_throttles"."windowStart" < now() - make_interval(secs => ${rule.windowSec})
                     THEN 1 ELSE "auth_throttles"."count" + 1 END,
      "windowStart" = CASE WHEN "auth_throttles"."windowStart" < now() - make_interval(secs => ${rule.windowSec})
                     THEN now() ELSE "auth_throttles"."windowStart" END,
      "blockedUntil" = CASE
        WHEN (CASE WHEN "auth_throttles"."windowStart" < now() - make_interval(secs => ${rule.windowSec})
                   THEN 1 ELSE "auth_throttles"."count" + 1 END) >= ${rule.limit}
        THEN now() + make_interval(secs => ${rule.blockSec})
        ELSE "auth_throttles"."blockedUntil" END,
      "updatedAt" = now()
    RETURNING "count", "blockedUntil"`;
  const row = rows[0];
  // تنظيف خفيف للسجلات القديمة (بلا مهمة مجدولة)
  if (Math.random() < 0.02) {
    await prisma.authThrottle.deleteMany({ where: { updatedAt: { lt: new Date(Date.now() - 2 * 86_400_000) } } }).catch(() => undefined);
  }
  return { count: Number(row?.count ?? 0), blocked: Boolean(row?.blockedUntil && row.blockedUntil.getTime() > Date.now()) };
  });
}

/** يمسح العدّادات بعد نجاح (مثل دخول صحيح). */
export async function clear(keys: string[]): Promise<void> {
  await tolerateMissingTable(undefined, async () => { await prisma.authThrottle.deleteMany({ where: { key: { in: keys } } }); });
}

/** رد 429 موحّد مع Retry-After. */
export function tooManyResponse(seconds: number, message = 'محاولات كثيرة. حاول مرة أخرى بعد قليل.'): Response {
  return Response.json({ error: message }, { status: 429, headers: { 'Retry-After': String(Math.max(1, seconds)) } });
}

/* ---------- قواعد الدخول ----------
   - الحساب + العنوان: 5 أخطاء في 15 دقيقة ← قفل 15 دقيقة (يوقف التخمين من جهاز واحد).
   - الحساب من أي عنوان: 30 خطأ في الساعة ← قفل 15 دقيقة (يوقف التخمين الموزّع؛ قفل قصير
     لا دائم حتى لا يستطيع مهاجم إغلاق حساب غيره طويلًا).
   - العنوان على كل الحسابات: 50 خطأ في 15 دقيقة ← قفل 30 دقيقة (يوقف رشّ كلمات المرور). */
export const LOGIN_RULES = {
  accountIp: { limit: 5, windowSec: 900, blockSec: 900 },
  account: { limit: 30, windowSec: 3600, blockSec: 900 },
  ip: { limit: 50, windowSec: 900, blockSec: 1800 },
} satisfies Record<string, ThrottleRule>;

export function loginKeys(email: string, ip: string) {
  return {
    accountIp: throttleKey('login:acct-ip', email, ip),
    account: throttleKey('login:acct', email),
    ip: throttleKey('login:ip', ip),
  };
}
