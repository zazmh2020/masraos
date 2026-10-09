'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import LangToggle from '@/components/LangToggle';
import { useT } from '@/lib/i18n/LocaleProvider';
import '@/styles/login.css';
import '@/styles/auth.css';

/**
 * غلاف صفحات الدخول وإنشاء الحساب (الدليل ص25–26): جانب بنفسجي عميق يحمل الرسالة والعلامة،
 * وجانب فاتح يحمل بطاقة النموذج. بطاقة صلبة (لا زجاج)، بلا عناصر عائمة متحركة،
 * والاتجاه يتبع لغة الصفحة (لا RTL مفروض).
 */
export default function AuthShell({ variant, children }: { variant: 'login' | 'signup'; children: ReactNode }) {
  const t = useT();
  return (
    <div className="au-page">
      <aside className="au-panel">
        <Link href="/" className="au-brand" aria-label={t('brand')}>
          <span className="au-brand-mark"><LogoMark size={24} /></span>
          <span>{t('brand')}</span>
        </Link>
        <div className="au-panel-copy">
          {variant === 'login' ? (
            <>
              <p className="au-panel-title">{t('hero.title1')} <span>{t('hero.title2')}</span></p>
              <p className="au-panel-sub">{t('hero.tagline')}</p>
            </>
          ) : (
            <>
              <p className="au-panel-title">{t('signup.sub')}</p>
              <ol className="au-panel-steps">
                {[1, 2, 3].map((n) => <li key={n}><i>{n}</i>{t(`auth.step${n}`)}</li>)}
              </ol>
            </>
          )}
        </div>
        <p className="au-panel-foot">{t('footer.rights')}</p>
      </aside>

      <div className="au-side">
        <div className="au-top">
          <Link href="/" className="au-home"><span className="au-arrow" aria-hidden="true">→</span>{t('login.home')}</Link>
          <LangToggle />
        </div>
        <main id="main" className="au-main">{children}</main>
      </div>
    </div>
  );
}
