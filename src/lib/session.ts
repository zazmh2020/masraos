import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

/* ============================================================
   الجلسة — كوكي موقّعة تحمل هوية المستخدم
   التوقيع يمنع تزوير محتواها من جهة المتصفح.
   ============================================================ */

const COOKIE_NAME = 'midad_session';
const MAX_AGE_DAYS = 7;

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  organizationSlug: string | null;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET غير معرّف في ملف .env');
  return value;
}

/** نطاقات الجذر التي يُفعَّل عليها التوجيه بالنطاق الفرعي (مطابقة للـ proxy). */
function rootDomains(): string[] {
  return (process.env.APP_ROOT_DOMAINS ?? 'midad.localhost,masraos.com')
    .split(',').map((s) => s.trim()).filter(Boolean);
}

/** نطاق الجذر الذي يقع تحته المضيف (أو null إن لم يكن ضمن نطاق معروف مثل *.vercel.app). */
export function matchedRoot(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0];
  for (const root of rootDomains()) {
    if (hostname === root || hostname.endsWith(`.${root}`)) return root;
  }
  return null;
}

/**
 * نطاق الكوكي: نطاق الجذر المعروف فقط (ليُشارَك عبر النطاقات الفرعية admin.* و<slug>.*).
 * على المضيفات غير المعروفة (مثل *.vercel.app أو IP) نعيد undefined = كوكي مربوط بالمضيف
 * — لأن ضبط domain=vercel.app لاحقة عامة يرفضه المتصفّح فتضيع الجلسة.
 */
export function sessionCookieDomain(host: string | null | undefined): string | undefined {
  return matchedRoot(host) ?? undefined;
}

/**
 * وجهة ما بعد الدخول:
 * - ضمن نطاق جذر معروف → نطاق فرعي: admin.<root> أو <slug>.<root>.
 * - خارجه (vercel.app، localhost بلا نطاق فرعي، IP) → مسار على نفس المضيف: /admin أو /org/<slug>.
 */
export function tenantDestination(host: string, proto: string, role: string, slug: string | null): string {
  const hostname = host.split(':')[0];
  const port = host.includes(':') ? `:${host.split(':')[1]}` : '';
  const root = matchedRoot(host);
  const p = proto.endsWith(':') ? proto : `${proto}:`;

  if (root) {
    let targetHost = hostname;
    if (role === 'PLATFORM_OWNER') targetHost = `admin.${root}`;
    else if (slug) targetHost = `${slug}.${root}`;
    return `${p}//${targetHost}${port}/`;
  }
  // بديل قائم على المسار — يعمل على أي استضافة
  const path = role === 'PLATFORM_OWNER' ? '/admin' : slug ? `/org/${slug}` : '/';
  return `${p}//${host}${path}`;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function serializeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return payload + '.' + sign(payload);
}

export function parseSession(token: string): SessionData | null {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sign(payload);

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(
  data: SessionData,
  remember: boolean,
  domain?: string,
) {
  const store = await cookies();
  store.set(COOKIE_NAME, serializeSession(data), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    domain, // مشترك بين الدومينات الفرعية عند تمريره
    maxAge: remember ? MAX_AGE_DAYS * 24 * 60 * 60 : undefined,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? parseSession(token) : null;
}

export async function destroySession(domain?: string) {
  const store = await cookies();
  // نحذف بنفس النطاق الذي أُنشئ به، وإلا يبقى الكوكي المشترك حيًّا
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    domain,
    maxAge: 0,
  });
}
