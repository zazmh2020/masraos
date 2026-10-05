import type { MetadataRoute } from 'next';

/** بيان تطبيق الويب — يجعل مسرى قابلًا للتثبيت على الجوال كتطبيق (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مَسرى — إدارة مراكز تعليم القرآن',
    short_name: 'مسرى',
    description: 'تنظيم عمل مراكز القرآن: الطلاب والحلقات والحضور وسجل الحفظ.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF7FE',
    theme_color: '#61428C',
    lang: 'ar',
    dir: 'rtl',
    categories: ['education', 'productivity', 'business'],
    icons: [
      { src: '/icons/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
