'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** زر تبديل الوضع الفاتح/الداكن — يحفظ الاختيار في localStorage. */
export default function ThemeToggle({ className = '', onDeep = false }: { className?: string; onDeep?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setDark(document.documentElement.dataset.theme === 'dark');
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('midad_theme', next ? 'dark' : 'light'); } catch { /* تجاهل */ }
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${onDeep ? 'on-deep' : ''} ${className}`}
      onClick={toggle}
      aria-label={dark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      suppressHydrationWarning
    >
      <Icon name={ready && dark ? 'sun' : 'moon'} size={16} />
    </button>
  );
}
