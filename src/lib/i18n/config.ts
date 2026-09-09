/* ============================================================
   مسرى — إعداد اللغات (i18n)
   ============================================================ */

export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ar';
export const LOCALE_COOKIE = 'midad_locale';

export function isLocale(v: string | undefined | null): v is Locale {
  return v === 'ar' || v === 'en';
}

export function dirFor(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
