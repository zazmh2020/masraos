/* ============================================================
   ترويسات أمان HTTP — تُطبَّق من next.config.ts على كل الاستجابات.

   CSP بلا nonces (حسب دليل Next.js «Without Nonces») كي تبقى الصفحات الثابتة ثابتة:
   - script-src يسمح بـ 'unsafe-inline' لأن Next.js يحقن سكربتات تهيئة inline؛
     الانتقال إلى nonce أو SRI خطوة لاحقة مستقلة لأنها تغيّر طريقة التصيير.
   - لا سكربتات أو إطارات خارجية؛ الخطوط محلية؛ الصور قد تأتي من https (شعارات الجهات، الأعلام).
   - connect-src يسمح بـ https: لأن رفع الوثائق يتم مباشرة إلى مزوّد S3 الذي يُضبط من البيئة.
   HSTS في الإنتاج فقط وبدون includeSubDomains حتى يُتحقق من HTTPS على كل النطاقات الفرعية.
   ============================================================ */

export type HeaderPair = { key: string; value: string };

export function contentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https:${isDev ? ' ws: wss:' : ''}`,
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function securityHeaders(isDev: boolean): HeaderPair[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(isDev) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-write=(self)' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]),
  ];
}

/** استجابات الواجهات البرمجية تحمل بيانات الجلسة والمؤسسة — لا تُخزَّن في أي ذاكرة وسيطة. */
export const apiHeaders: HeaderPair[] = [{ key: 'Cache-Control', value: 'no-store' }];
