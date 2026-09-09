import { headers } from 'next/headers';

/**
 * يستخرج slug المؤسسة من الدومين الفرعي.
 *
 * أمثلة:
 * - alqoran.masraos.com   →  "alqoran"
 * - admin.masraos.com     →  null (لوحة مالك المنصة)
 * - masraos.com           →  null (الموقع التعريفي)
 * - alqoran.midad.localhost:3000  →  "alqoran" (التطوير المحلّي)
 */
export async function getTenantSlug(): Promise<string | null> {
  const h = await headers();
  const host = h.get('host') ?? '';

  // إزالة المنفذ إن وُجد
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  // نحتاج 3 أجزاء على الأقل ليكون هناك دومين فرعي
  // مثال: alqoran.midad.localhost = 3 أجزاء
  // مثال: midad.localhost = جزءان فقط (لا دومين فرعي)
  if (parts.length < 3) return null;

  const subdomain = parts[0];

  // كلمات محجوزة لا تُعدّ مؤسسات
  const reserved = ['www', 'admin', 'api', 'app'];
  if (reserved.includes(subdomain)) return null;

  return subdomain;
}

/**
 * يتحقق إن كان الطلب واردًا للوحة مالك المنصة (admin.*)
 */
export async function isAdminHost(): Promise<boolean> {
  const h = await headers();
  const host = h.get('host') ?? '';
  const hostname = host.split(':')[0];
  return hostname.startsWith('admin.');
}
