'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { persistLocale, useLocale } from '@/lib/i18n/LocaleProvider';
import { translate } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

/** نافذة اختيار اللغة عند أول زيارة — على الصفحة الرئيسية فقط، لا داخل المنصّة. */
export default function LangGate({ hasChosen }: { hasChosen: boolean }) {
  const [open, setOpen] = useState(false);
  const { setLocale } = useLocale();
  const pathname = usePathname();
  // لا تظهر إلا على الموقع التعريفي (الجذر) — لا في الدخول أو لوحات الجهات أو الإدارة
  const onLanding = pathname === '/';

  useEffect(() => {
    if (hasChosen || !onLanding) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [hasChosen, onLanding]);

  if (!open || !onLanding) return null;

  // تبديل سلس بلا إعادة تحميل (تحديث فوري + مزامنة محتوى الخادم عبر router.refresh)
  function choose(locale: Locale) {
    setLocale(locale);
    setOpen(false);
  }

  // إغلاق دون اختيار: اعتماد العربية افتراضيًا (الصفحة عربية أصلًا)
  function dismiss() {
    persistLocale('ar');
    setOpen(false);
  }

  return (
    <div className="lang-gate-scrim" role="dialog" aria-modal="true" aria-label="Language / اللغة" onClick={dismiss}>
      <div className="lang-gate" onClick={(e) => e.stopPropagation()}>
        <button className="lang-gate-x" onClick={dismiss} aria-label="إغلاق / Close">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
        </button>
        <div className="lang-gate-logo">مسرى · Masra</div>
        <h2>{translate('ar', 'lang.title')}</h2>
        <p className="lang-gate-en">{translate('en', 'lang.title')}</p>
        <div className="lang-gate-opts">
          <button className="lang-gate-opt" onClick={() => choose('ar')}>
            <span className="lang-gate-flag">ع</span>
            <span>العربية</span>
          </button>
          <button className="lang-gate-opt" onClick={() => choose('en')}>
            <span className="lang-gate-flag">EN</span>
            <span>English</span>
          </button>
        </div>
      </div>
    </div>
  );
}
