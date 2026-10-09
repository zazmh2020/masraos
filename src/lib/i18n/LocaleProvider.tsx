'use client';

import { createContext, useCallback, useContext, useMemo, useEffect, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirFor, type Locale } from './config';
import { translate } from './dictionaries';

interface LocaleContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => void;
  /** جارٍ تبديل اللغة (بانتظار محتوى الخادم باللغة الجديدة). */
  switching: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** النطاق الأب (آخر جزأين) لمشاركة الكوكي عبر النطاقات الفرعية.
 *  يُتجاهَل للنطاقات العامة (vercel.app…) لأن المتصفح يرفض ضبطها. */
function shareableDomain(): string | undefined {
  const host = window.location.hostname;
  if (/^\d+(\.\d+){3}$/.test(host)) return undefined; // IP
  const parts = host.split('.');
  if (parts.length < 2) return undefined; // localhost وحده
  const base = parts.slice(-2).join('.');
  // نطاقات استضافة عامة — لا يمكن ضبط كوكي على نطاقها الأب
  const PUBLIC_SUFFIXES = ['vercel.app', 'netlify.app', 'github.io', 'pages.dev', 'onrender.com'];
  if (PUBLIC_SUFFIXES.includes(base)) return undefined;
  return base;
}

/** يحفظ اللغة في الكوكي + التخزين المحلي ويعيد التحميل لتطبيقها على كل الصفحة.
 *  نضبط كوكي على المضيف نفسه (مضمون دائمًا) + كوكي على النطاق الأب عند إمكانه
 *  (للمشاركة بين النطاقات الفرعية مثل admin.* و<slug>.*). */
export function persistLocale(next: Locale) {
  try {
    const opts = `path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${LOCALE_COOKIE}=${next}; ${opts}`; // host-only (يعمل دائمًا)
    const domain = shareableDomain();
    if (domain) document.cookie = `${LOCALE_COOKIE}=${next}; ${opts}; domain=${domain}`;
    localStorage.setItem(LOCALE_COOKIE, next);
  } catch {
    /* تجاهل */
  }
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  // تبديل دفعة واحدة: لا نغيّر النصوص ولا الاتجاه في المتصفح قبل وصول محتوى الخادم باللغة الجديدة،
  // حتى لا تظهر صفحة مختلطة (نص عربي باتجاه إنجليزي). عند وصوله يتبدّل كل شيء معًا.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(initialLocale);
    try {
      document.documentElement.lang = initialLocale;
      document.documentElement.dir = dirFor(initialLocale);
      delete document.documentElement.dataset.switching;
    } catch { /* تجاهل */ }
  }, [initialLocale]);
  // احتياط: إن انتهى التحديث دون تغيّر اللغة (خطأ شبكة مثلًا) نزيل حالة التبديل
  useEffect(() => { if (!isPending) delete document.documentElement.dataset.switching; }, [isPending]);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    try { document.documentElement.dataset.switching = 'true'; } catch { /* تجاهل */ } // خفوت قصير بدل الصفحة المختلطة
    startTransition(() => router.refresh()); // محتوى الخادم باللغة الجديدة — بلا إعادة تحميل ولا فقدان موضع التمرير
  }, [router]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      t: (key, vars) => translate(locale, key, vars),
      setLocale,
      switching: isPending,
    }),
    [locale, setLocale, isPending],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // احتياط إن استُخدم خارج الموفّر
  return {
    locale: DEFAULT_LOCALE,
    dir: dirFor(DEFAULT_LOCALE),
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    setLocale: () => {},
    switching: false,
  };
}

/** اختصار للحصول على دالة الترجمة فقط. */
export function useT() {
  return useLocale().t;
}
