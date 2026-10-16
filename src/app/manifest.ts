import { BRAND } from '@/lib/brand';
import { getLocale } from '@/lib/i18n/server';
import type { MetadataRoute } from 'next';

/** بيان تطبيق الويب — يجعل مسرى قابلًا للتثبيت على الجوال كتطبيق (PWA). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale();
  const brand = BRAND[locale];
  return {
    name: brand.corporate,
    short_name: brand.name,
    description: brand.positioning,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF7FE',
    theme_color: '#61428C',
    lang: locale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    categories: ['education', 'productivity', 'business'],
    icons: [
      { src: '/icons/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
