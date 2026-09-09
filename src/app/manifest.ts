import type { MetadataRoute } from 'next';

/** بيان تطبيق الويب — يجعل مسرى قابلًا للتثبيت على الجوال كتطبيق (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مسرى — منظومة إدارة المؤسسات',
    short_name: 'مسرى',
    description: 'منظومة رقمية متكاملة لإدارة المؤسسات والمراكز القرآنية والجمعيات.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6f5fb',
    theme_color: '#6b57a0',
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
