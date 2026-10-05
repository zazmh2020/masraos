import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import { getT } from '@/lib/i18n/server';

/** فوتر الموقع التسويقي الموحّد — روابط مطلقة تعمل من أي صفحة. يتطلّب الغلاف `.mdl.mh` و home.css. */
export default async function MasraFooter() {
  const { t } = await getT();
  return (
    <footer className="mh-footer">
      <div className="mh-wrap">
        <div className="mh-footer-grid">
          <div className="mh-footer-brand">
            <span className="mh-footer-logo"><LogoMark size={28} /> {t('brand')}</span>
            <p>{t('footer.desc')}</p>
            <Link href="/signup" className="mh-btn mh-btn-primary mh-btn-sm">{t('home.footer.cta')}</Link>
          </div>
          <nav aria-label={t('home.footer.product')}>
            <h2>{t('home.footer.product')}</h2>
            <ul>
              <li><Link href="/features">{t('nav.features')}</Link></li>
              <li><Link href="/#how-it-works">{t('nav.journey')}</Link></li>
              <li><Link href="/#roles">{t('nav.roles')}</Link></li>
              <li><Link href="/#pricing">{t('nav.pricing')}</Link></li>
              <li><Link href="/about">{t('nav.about')}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t('home.footer.account')}>
            <h2>{t('home.footer.account')}</h2>
            <ul>
              <li><Link href="/signup">{t('home.footer.signup')}</Link></li>
              <li><Link href="/login">{t('nav.login')}</Link></li>
              <li><Link href="/#faq">{t('home.footer.faq')}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t('home.footer.legal')}>
            <h2>{t('home.footer.legal')}</h2>
            <ul>
              <li><Link href="/contact">{t('footer.contact')}</Link></li>
              <li><Link href="/privacy">{t('footer.privacy')}</Link></li>
              <li><Link href="/terms">{t('footer.terms')}</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mh-wordmark" aria-hidden="true">{t('brand')}</div>
        <div className="mh-footer-bottom">{t('footer.rights')}</div>
      </div>
    </footer>
  );
}
