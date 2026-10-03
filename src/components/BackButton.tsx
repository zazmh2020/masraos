'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';
import Icon from '@/components/Icon';

/** زرّ العودة للصفحة السابقة — يختفي في الصفحة الجذر (base). */
export default function BackButton({ base, className = 'app-back' }: { base?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  if (base && pathname === base) return null;
  return (
    <button className={className} onClick={() => router.back()} aria-label={t('shell.back')} title={t('shell.back')}>
      <Icon name="back" size={20} className="app-back-ic" />
      <span>{t('shell.back')}</span>
    </button>
  );
}
