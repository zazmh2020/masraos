import { BRAND } from '@/lib/brand';
import { getLocale } from '@/lib/i18n/server';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE, dirFor } from '@/lib/i18n/config';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { CurrencyProvider } from '@/components/CurrencyProvider';
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency } from '@/lib/currency';
import LangGate from '@/components/LangGate';
import PWARegister from '@/components/PWARegister';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const brand = BRAND[locale];
  return {
    title: `${brand.name} | ${brand.positioning}`,
    description: brand.description,
    applicationName: brand.name,
    appleWebApp: { capable: true, statusBarStyle: 'default', title: brand.name },
    openGraph: { title: brand.corporate, description: brand.description, siteName: brand.name, locale: locale === 'ar' ? 'ar_SA' : 'en_US', type: 'website' },
    twitter: { card: 'summary', title: brand.corporate, description: brand.description },
    icons: { icon: '/favicon.svg', apple: '/icons/pwa/apple-touch-icon.png' },
  };
}

export const viewport: Viewport = {
  themeColor: '#61428C',
  viewportFit: 'cover', // يتيح env(safe-area-inset-*) — النتوء والشريط السفلي في الجوالات
};

// مؤقّتًا: الموقع مقفول على الوضع الفاتح (أُزيل مبدّل الثيم — سيُعاد لاحقًا).
const themeScript = `document.documentElement.dataset.theme='light';`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const hasChosen = isLocale(cookieLocale);
  const locale = hasChosen ? cookieLocale : DEFAULT_LOCALE;
  const cookieCurrency = store.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cookieCurrency) ? cookieCurrency : DEFAULT_CURRENCY;

  return (
    <html lang={locale} dir={dirFor(locale)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>
          <CurrencyProvider initialCurrency={currency}>
            {children}
            <LangGate hasChosen={hasChosen} />
            <PWARegister />
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
