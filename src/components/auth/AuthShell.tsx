'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import LangToggle from '@/components/LangToggle';
import { useT } from '@/lib/i18n/LocaleProvider';
import '@/styles/login.css';
import '@/styles/auth.css';

/**
 * غلاف صفحات الدخول وإنشاء الحساب: خلفية بنفسجية عميقة كاملة (نفس توهّج الصفحة الرئيسية)
 * وبطاقة بيضاء صلبة واحدة في المنتصف تحمل العلامة والنموذج. لا زجاج ولا عناصر عائمة متحركة،
 * والاتجاه يتبع لغة الصفحة.
 * wide: بطاقة أعرض قليلًا (نموذج إنشاء الحساب).
 */
export default function AuthShell({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  const t = useT();
  return (
    <div className="au-page">
      <div className="au-top">
        <Link href="/" className="au-home"><span className="au-arrow" aria-hidden="true">→</span>{t('login.home')}</Link>
        <LangToggle className="on-deep" />
      </div>

      <main id="main" className="au-main">
        <div className={`lg-card au-card ${wide ? 'su-card' : ''}`}>
          <Link href="/" className="au-brand" aria-label={t('brand')}>
            <span className="au-brand-mark"><LogoMark size={24} /></span>
            <span>{t('brand')}</span>
          </Link>
          {children}
        </div>
      </main>

      <p className="au-foot">{t('footer.rights')}</p>
    </div>
  );
}
