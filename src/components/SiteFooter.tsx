import { LogoMark } from '@/components/Logo';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <LogoMark size={30} className="footer-brand-logo" />
          <div>
            <div className="footer-brand-name">مسرى</div>
            <div className="footer-brand-tag">منظومة رقمية متكاملة</div>
          </div>
        </div>

        <div className="footer-links">
          <a href="#about">عن المنصة</a>
          <a href="#systems">الأنظمة</a>
          <a href="#features">المميزات</a>
          <a href="#audiences">الجهات</a>
          <a href="#about-masra">عن مسرى</a>
          <a href="#contact">تواصل معنا</a>
        </div>

        <p className="footer-copy">مسرى © 2026 — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  );
}
