'use client';

import { useEffect } from 'react';

/** يسجّل ظهور شاشة التحميل في الجلسة، ويُنهيها بالضغط أو Escape، ويخفيها نهائيًا بعد التلاشي. */
export default function SplashDismiss({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    const root = document.documentElement;
    const el = document.getElementById('site-splash');
    if (!el || root.classList.contains('splash-seen')) return;
    try { sessionStorage.setItem(storageKey, '1'); } catch { /* التخزين غير متاح: تظهر مرة أخرى فقط */ }

    const done = () => root.classList.add('splash-seen');
    const leave = () => el.classList.add('is-leaving');
    const onEnd = (e: AnimationEvent) => { if (e.target === el && e.animationName === 'site-splash-out') done(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') leave(); };
    const fallback = setTimeout(done, 4000);

    el.addEventListener('animationend', onEnd);
    el.addEventListener('click', leave);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(fallback);
      el.removeEventListener('animationend', onEnd);
      el.removeEventListener('click', leave);
      window.removeEventListener('keydown', onKey);
    };
  }, [storageKey]);

  return null;
}
