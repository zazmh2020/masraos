import { normalizeDigits } from '@/lib/normalize-digits';

/* ============================================================
   التحقق من مدخلات إنشاء الحساب — منطق نقيّ قابل للاختبار.
   نفس قواعد إنشاء المؤسسة من لوحة المالك (الرابط الفرعي، كلمة المرور).
   ============================================================ */

export const RESERVED_SLUGS = ['www', 'admin', 'api', 'app', 'midad', 'masra', 'masraos', 'mail', 'ftp', 'login', 'signup', 'site', 'verify', 'design'];

export type SignupChannel = 'EMAIL' | 'PHONE';
export type SignupField = 'name' | 'orgName' | 'slug' | 'email' | 'phone' | 'password' | 'channel';

export interface SignupInput {
  name: string;
  orgName: string;
  slug: string;
  email: string;
  phone: string | null;
  password: string;
  channel: SignupChannel;
}

export type SignupValidation =
  | { ok: true; data: SignupInput }
  | { ok: false; field: SignupField; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/; // 3–32، لا تبدأ/تنتهي بشرطة

/**
 * يوحّد رقم الجوال: أرقام لاتينية، بلا مسافات/شرطات، وصيغة دولية.
 * أرقام السعودية المحلية (05xxxxxxxx) تُحوَّل إلى +9665xxxxxxxx.
 */
export function normalizePhone(raw: string): string | null {
  let p = normalizeDigits(raw).replace(/[\s\-()]/g, '');
  if (!p) return null;
  if (p.startsWith('00')) p = `+${p.slice(2)}`;
  if (/^05\d{8}$/.test(p)) p = `+966${p.slice(1)}`;
  if (/^5\d{8}$/.test(p)) p = `+966${p}`;
  if (!p.startsWith('+')) p = `+${p}`;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

export function validateSignup(raw: unknown): SignupValidation {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  const name = str(b.name).trim();
  if (name.length < 2 || name.length > 80) return { ok: false, field: 'name', error: 'اكتب اسمك (من حرفين إلى 80 حرفًا).' };

  const orgName = str(b.orgName).trim();
  if (orgName.length < 2 || orgName.length > 120) return { ok: false, field: 'orgName', error: 'اكتب اسم المركز (من حرفين إلى 120 حرفًا).' };

  const slug = str(b.slug).trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return { ok: false, field: 'slug', error: 'رابط المركز: من 3 إلى 32 حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة، ولا يبدأ أو ينتهي بشرطة.' };
  if (RESERVED_SLUGS.includes(slug)) return { ok: false, field: 'slug', error: 'هذا الرابط محجوز، اختر رابطًا آخر.' };

  const email = str(b.email).trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, field: 'email', error: 'اكتب بريدًا إلكترونيًا صحيحًا.' };

  const channel = b.channel === 'PHONE' ? 'PHONE' : b.channel === 'EMAIL' ? 'EMAIL' : null;
  if (!channel) return { ok: false, field: 'channel', error: 'اختر طريقة استلام رمز التحقق.' };

  const phoneRaw = str(b.phone).trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) return { ok: false, field: 'phone', error: 'اكتب رقم جوال صحيحًا، مثل 05XXXXXXXX أو +9665XXXXXXXX.' };
  if (channel === 'PHONE' && !phone) return { ok: false, field: 'phone', error: 'رقم الجوال مطلوب لاستلام الرمز برسالة.' };

  const password = str(b.password);
  if (password.length < 8 || password.length > 128) return { ok: false, field: 'password', error: 'كلمة المرور: 8 محارف على الأقل.' };

  return { ok: true, data: { name, orgName, slug, email, phone, password, channel } };
}

/** رمز من 6 أرقام بعد تحويل الأرقام العربية/الفارسية إلى لاتينية. */
export function normalizeOtpInput(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = normalizeDigits(raw).replace(/\s/g, '');
  return /^\d{6}$/.test(code) ? code : null;
}
