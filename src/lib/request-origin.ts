/* ============================================================
   حماية إضافية من الطلبات العابرة للمواقع (CSRF) — طبقة فوق كوكي SameSite=Lax.
   أي طلب معدِّل إلى /api مصدره موقع آخر يُرفض. الطلبات بلا ترويسة Origin
   (من الخادم إلى الخادم مثل Stripe، أو أدوات سطر الأوامر) لا تحمل كوكي المتصفّح فتُترك.
   ============================================================ */

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function allowedHost(originHost: string, requestHost: string, roots: string[]): boolean {
  if (originHost === requestHost) return true;
  const name = originHost.split(':')[0];
  return roots.some((root) => name === root || name.endsWith(`.${root}`));
}

/** هل هذا طلب معدِّل إلى الواجهة البرمجية قادم من موقع آخر؟ */
export function isCrossSiteMutation(
  method: string,
  path: string,
  headers: Headers,
  roots: string[],
): boolean {
  if (!MUTATING.has(method.toUpperCase()) || !path.startsWith('/api/')) return false;
  if (path.startsWith('/api/webhooks/')) return false; // موقّعة بأسرار المزوّد، لا بالكوكي
  const host = headers.get('host') ?? '';
  const origin = headers.get('origin');
  if (origin) {
    if (origin === 'null') return true;
    try {
      return !allowedHost(new URL(origin).host, host, roots);
    } catch {
      return true;
    }
  }
  return headers.get('sec-fetch-site') === 'cross-site';
}
