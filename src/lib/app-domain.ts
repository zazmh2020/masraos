/**
 * النطاق الأساسي للمنصّة المستخدَم لبناء روابط العرض (لوحة المالك وروابط المؤسسات).
 * يُضبط عبر NEXT_PUBLIC_APP_DOMAIN (مثال: masraos.com للإنتاج)، وإلا يعود لنطاق التطوير المحلّي.
 * ملاحظة: توجيه النطاقات الفرعية نفسه يعتمد على APP_ROOT_DOMAINS في proxy.ts / session.ts.
 */
export const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'midad.localhost:3000').trim();

const PROTO = APP_DOMAIN.includes('localhost') ? 'http' : 'https';

/** وضع التوجيه بالمسار: مساحات المؤسسات على masraos.com/org/<slug> بدل النطاقات الفرعية.
 *  يُفعَّل على الاستضافة المشتركة التي لا تدعم النطاقات الفرعية. */
export const PATH_ROUTING = process.env.NEXT_PUBLIC_APP_PATH_ROUTING === '1';

/** رابط الجذر (الموقع التعريفي / تسجيل الدخول). */
export function rootUrl(path = ''): string {
  return `${PROTO}://${APP_DOMAIN}${path}`;
}

/** مضيف/عنوان المؤسسة للعرض — نطاق فرعي أو مسار حسب الوضع. */
export function tenantHost(slug: string): string {
  return PATH_ROUTING ? `${APP_DOMAIN}/org/${slug}` : `${slug}.${APP_DOMAIN}`;
}

/** رابط كامل لمساحة المؤسسة. */
export function tenantUrl(slug: string, path = ''): string {
  return PATH_ROUTING ? `${PROTO}://${APP_DOMAIN}/org/${slug}${path}` : `${PROTO}://${slug}.${APP_DOMAIN}${path}`;
}
