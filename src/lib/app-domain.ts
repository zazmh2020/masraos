/**
 * النطاق الأساسي للمنصّة المستخدَم لبناء روابط العرض (لوحة المالك وروابط المؤسسات).
 * يُضبط عبر NEXT_PUBLIC_APP_DOMAIN (مثال: masraos.com للإنتاج)، وإلا يعود لنطاق التطوير المحلّي.
 * ملاحظة: توجيه النطاقات الفرعية نفسه يعتمد على APP_ROOT_DOMAINS في proxy.ts / session.ts.
 */
export const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'midad.localhost:3000').trim();

const PROTO = APP_DOMAIN.includes('localhost') ? 'http' : 'https';

/** رابط الجذر (الموقع التعريفي / تسجيل الدخول). */
export function rootUrl(path = ''): string {
  return `${PROTO}://${APP_DOMAIN}${path}`;
}

/** مضيف المؤسسة بالنطاق الفرعي، مثل: alquran.masraos.com */
export function tenantHost(slug: string): string {
  return `${slug}.${APP_DOMAIN}`;
}

/** رابط كامل لمساحة المؤسسة. */
export function tenantUrl(slug: string, path = ''): string {
  return `${PROTO}://${tenantHost(slug)}${path}`;
}
