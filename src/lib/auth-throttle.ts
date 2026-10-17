import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { reportError } from '@/lib/observe';

/* ============================================================
   الحماية من المحاولات المتكررة — مخزن مركزي في PostgreSQL (جدول auth_throttles)
   فيعمل مع أكثر من نسخة خادم؛ وعند تعذّره احتياطي في الذاكرة بنفس القواعد (انظر أدناه).

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

/* ---------- احتياطي آمن عند تعذّر المخزن المركزي ----------
   إن فشل الوصول إلى auth_throttles (ترحيل غير مطبَّق، انقطاع مؤقت، أي خطأ) لا نُسقط الدخول
   ولا نتجاوز الحدود: تنتقل العدّادات إلى ذاكرة العملية بنفس القواعد فورًا، ويُسجَّل خطأ واضح
   (مرة في الدقيقة على الأكثر). على نسخة خادم واحدة (Hostinger) يكون التقييد كاملًا؛ مع عدة نسخ
   يصير لكل نسخة حدّها حتى يعود المخزن. لا نعود للتقييد من القاعدة إلا بعد نجاح استعلامها. */
type MemEntry = { count: number; windowStart: number; blockedUntil: number };
const memory = new Map<string, MemEntry>();
const MEMORY_MAX_KEYS = 20_000;
let lastReport = 0;

async function reportFallback(error: unknown): Promise<void> {
  if (Date.now() - lastReport < 60_000) return;
  lastReport = Date.now();
  const detail = String((error as { message?: unknown })?.message ?? error).slice(0, 300);
  try {
    await reportError({ message: 'auth_throttles unavailable — throttling continues IN MEMORY (apply migration 20261017100000 / check database): ' + detail, where: 'auth-throttle' });
  } catch { /* لا يُسقط التسجيلُ الدخول */ }
}

function memHit(key: string, rule: ThrottleRule): { count: number; blocked: boolean } {
  const now = Date.now();
  let e = memory.get(key);
  if (!e || e.windowStart < now - rule.windowSec * 1000) e = { count: 0, windowStart: now, blockedUntil: e?.blockedUntil ?? 0 };
  e.count += 1;
  if (e.count >= rule.limit) e.blockedUntil = now + rule.blockSec * 1000;
  memory.delete(key);
  memory.set(key, e); // الأحدث في النهاية
  if (memory.size > MEMORY_MAX_KEYS) memory.delete(memory.keys().next().value as string); // أقدم مفتاح
  return { count: e.count, blocked: e.blockedUntil > now };
}

function memBlockedFor(keys: string[]): number {
  const now = Date.now();
  const until = Math.max(0, ...keys.map((k) => memory.get(k)?.blockedUntil ?? 0));
  return until > now ? Math.ceil((until - now) / 1000) : 0;
}

/** للاختبارات فقط. */
export function __resetThrottleMemory(): void { memory.clear(); lastReport = 0; }

/** أطول مدة قفل متبقية (بالثواني) بين المفاتيح، أو 0 إن لم يكن أي منها مقفلًا. */
export async function blockedFor(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  const local = memBlockedFor(keys); // قفل سُجّل أثناء تعطل المخزن يبقى ساريًا
  try {
    const rows = await prisma.authThrottle.findMany({
      where: { key: { in: keys }, blockedUntil: { gt: new Date() } },
      select: { blockedUntil: true },
    });
    const until = Math.max(0, ...rows.map((r) => r.blockedUntil!.getTime()));
    return Math.max(local, until ? Math.ceil((until - Date.now()) / 1000) : 0);
  } catch (error) {
    await reportFallback(error);
    return local;
  }
}

/** يسجّل محاولة لمفتاح؛ عند بلوغ الحد (المحاولة رقم limit) يُقفل لما بعدها. يعيد العدد داخل النافذة. */
export async function hit(key: string, rule: ThrottleRule): Promise<{ count: number; blocked: boolean }> {
  try {
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
  } catch (error) {
    await reportFallback(error);
    return memHit(key, rule);
  }
}

/** يمسح العدّادات بعد نجاح (مثل دخول صحيح). */
export async function clear(keys: string[]): Promise<void> {
  for (const k of keys) memory.delete(k);
  try {
    await prisma.authThrottle.deleteMany({ where: { key: { in: keys } } });
  } catch (error) {
    await reportFallback(error);
  }
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
