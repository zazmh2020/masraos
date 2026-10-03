'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';
import Icon from '@/components/Icon';

/** زر تبديل اللغة عربي/إنجليزي — أيقونة كرة أرضية. */
export default function LangToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      onClick={() => setLocale(next)}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={locale === 'ar' ? 'English' : 'العربية'}
    >
      <Icon name="world" size={20} className="lang-toggle-ic" />
    </button>
  );
}
