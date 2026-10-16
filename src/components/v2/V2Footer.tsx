import BrandLockup from '@/components/BrandLockup';
import FooterLink from '@/components/v2/FooterLink';
import { getT } from '@/lib/i18n/server';

/** تذييل الموقع التسويقي — روابط مطلقة (‎/#قسم‎) لتعمل من الصفحة الرئيسية وأي صفحة أخرى. */
export default async function V2Footer() {
  const { t, locale } = await getT();
  return (
    <footer id="about" className="v2-footer">
      <div className="v2-wrap v2-footer-grid">
        <div>
          <span className="v2-brand">
            <BrandLockup dir={locale === 'ar' ? 'rtl' : 'ltr'} height={40} label={t('brand.corporate')} />
          </span>
          <p>{t('footer.desc')}</p>
        </div>
        <nav aria-label={t('footer.col.platform')}>
          <h2>{t('footer.col.platform')}</h2>
          <FooterLink href="/about">{t('footer.whatIs')}</FooterLink>
          <FooterLink href="/features">{t('footer.features')}</FooterLink>
          <FooterLink href="/#systems">{t('nav.platform')}</FooterLink>
          <FooterLink href="/#ai">{t('nav.ai')}</FooterLink>
          <FooterLink href="/pricing">{t('nav.pricing')}</FooterLink>
        </nav>
        <nav aria-label={t('footer.col.solutions')}>
          <h2>{t('footer.col.solutions')}</h2>
          <FooterLink href="/#how-it-works">{t('nav.journey')}</FooterLink>
          <FooterLink href="/#roles">{t('nav.roles')}</FooterLink>
          <FooterLink href="/audiences">{t('nav.orgs')}</FooterLink>
        </nav>
        <nav aria-label={t('footer.col.support')}>
          <h2>{t('footer.col.support')}</h2>
          <FooterLink href="/about-masra">{t('footer.aboutUs')}</FooterLink>
          <FooterLink href="/login">{t('nav.login')}</FooterLink>
          <FooterLink href="/contact">{t('footer.contact')}</FooterLink>
          <FooterLink href="/privacy">{t('footer.privacy')}</FooterLink>
          <FooterLink href="/terms">{t('footer.terms')}</FooterLink>
        </nav>
      </div>
      <div className="v2-wrap v2-footer-base">{t('footer.rights')}</div>
    </footer>
  );
}
