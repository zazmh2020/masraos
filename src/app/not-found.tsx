import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import '@/styles/status-page.css';

// 404 — بلغة الزائر، برموز الهوية؛ مستقلة عن رأس الموقع لأنها قد تظهر داخل اللوحة أيضًا
export default async function NotFound() {
  const { t } = await getT();
  return (
    <main id="main" className="sp-page">
      <div className="sp-box">
        <p className="sp-code" aria-hidden="true">404</p>
        <h1>{t('status.404.title')}</h1>
        <p>{t('status.404.d')}</p>
        <div className="sp-actions">
          <Link href="/" className="sp-btn">{t('status.home')}</Link>
          <Link href="/contact" className="sp-link">{t('cta.contact')}</Link>
        </div>
      </div>
    </main>
  );
}
