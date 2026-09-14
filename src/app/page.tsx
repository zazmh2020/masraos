import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import WelcomeIntro from '@/components/WelcomeIntro';
import MasraHeader from '@/components/landing/MasraHeader';
import Mockup from '@/components/landing/Mockup';
import SystemsShowcase from '@/components/landing/SystemsShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import ProductShowcase from '@/components/landing/ProductShowcase';
import Testimonials from '@/components/landing/Testimonials';
import MasraAIChat from '@/components/landing/MasraAIChat';
import MasraAssistant from '@/components/landing/MasraAssistant';
import PricingPlans from '@/components/PricingPlans';
import { getT } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/platform-settings';
import { getActiveHeroSlides } from '@/lib/hero';
import '@/styles/masra.css';
import '@/styles/pricing.css';

const STAR = (
  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9z" /></svg>
);

// الترتيب الرسمي للقطاعات (يطابق SECTORS في lib/org-types.ts): مراكز القرآن أولًا «متاح الآن».
const AUDIENCES = [
  { icon: 'education/education-quran', k: 'aud.quran' },
  { icon: 'organization/organization-institution', k: 'aud.charity' },
  { icon: 'people/people-groups', k: 'aud.humanitarian' },
  { icon: 'education/education-education', k: 'aud.education' },
  { icon: 'analytics/analytics-growth', k: 'aud.development' },
  { icon: 'organization/organization-building', k: 'aud.waqf' },
];

const FEATURES = [
  { icon: 'organization/organization-structure', k: 'feat.central' },
  { icon: 'operations/operations-activities', k: 'feat.flexible' },
  { icon: 'people/people-permissions', k: 'feat.perms' },
  { icon: 'analytics/analytics-analytics', k: 'feat.reports' },
  { icon: 'analytics/analytics-growth', k: 'feat.scale' },
  { icon: 'identity/identity-digital-identity', k: 'feat.arabic' },
];

const SECURITY = [
  { icon: 'people/people-permissions', k: 'sec2.perms' },
  { icon: 'actions/actions-lock', k: 'sec2.access' },
  { icon: 'identity/identity-security', k: 'sec2.data' },
  { icon: 'organization/organization-office', k: 'sec2.workspaces' },
];

const INTEGRATIONS = ['int.email', 'int.payment', 'int.whatsapp', 'int.google', 'int.microsoft', 'int.api'];

export default async function HomePage() {
  const { t } = await getT();
  const settings = await getPlatformSettings();
  const slides = await getActiveHeroSlides();
  const slide = slides[0] ?? null; // شريحة الواجهة المنشورة تقود الهيرو إن وُجدت

  // المميزات: محتوى مالك المنصّة إن وُجد، وإلا النصوص الافتراضية (أيقونات دوّارة للمخصّصة)
  const features = settings.homeFeatures?.length
    ? settings.homeFeatures.map((f, i) => ({ icon: FEATURES[i % FEATURES.length].icon, title: f.title, desc: f.desc }))
    : FEATURES.map((f) => ({ icon: f.icon, title: t(`${f.k}.t`), desc: t(`${f.k}.d`) }));

  // الأسئلة الشائعة: محتوى المالك إن وُجد، وإلا الأسئلة الافتراضية
  const faqs = settings.homeFaqs?.length
    ? settings.homeFaqs
    : [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));

  const showAnnounce = settings.announcementActive && !!settings.announcement;

  return (
    <div className={`mdl ${showAnnounce ? 'has-announce' : ''}`}>
      <WelcomeIntro />
      {showAnnounce && (
        settings.announcementLink
          ? settings.announcementLink.startsWith('/')
            ? <Link href={settings.announcementLink} className="mdl-announce is-link">{settings.announcement}</Link>
            : <a href={settings.announcementLink} target="_blank" rel="noopener noreferrer" className="mdl-announce is-link">{settings.announcement}</a>
          : <div className="mdl-announce" role="status">{settings.announcement}</div>
      )}
      <MasraHeader />

      <main>
        {/* ========== HERO ========== */}
        <section id="home" className="mdl-hero">
          <div className="mdl-wrap mdl-hero-grid">
            <div>
              <Reveal><span className="mdl-hero-eyebrow">{t('hero.eyebrow')}</span></Reveal>
              <Reveal><h1>
                {slide
                  ? slide.title
                  : <>{settings.heroTitle1 || t('hero.title1')}<br /><span className="hl">{settings.heroTitle2 || t('hero.title2')}</span></>}
              </h1></Reveal>
              <Reveal delay={0.1}>
                <p className="mdl-hero-sub">{slide?.subtitle || settings.heroSubtitle || t('hero.sub')}</p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mdl-hero-actions">
                  {slide?.ctaText && slide.ctaLink
                    ? (slide.ctaLink.startsWith('/')
                        ? <Link href={slide.ctaLink} className="mdl-btn mdl-btn-primary">{slide.ctaText}</Link>
                        : <a href={slide.ctaLink} className="mdl-btn mdl-btn-primary" target="_blank" rel="noopener noreferrer">{slide.ctaText}</a>)
                    : <Link href="/login" className="mdl-btn mdl-btn-primary">{t('hero.cta.login')}</Link>}
                  <a href="#systems" className="mdl-btn mdl-btn-white">{t('hero.cta.explore')}</a>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mdl-hero-trust">
                  <span><strong>12</strong> {t('hero.trust.systems')}</span>
                  <span className="sep" />
                  <span><strong>100%</strong> {t('hero.trust.isolation')}</span>
                  <span className="sep" />
                  <span><strong>RTL</strong> {t('hero.trust.rtl')}</span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2} y={30}>
              <div className="mdl-hero-stage">
                {/* مكدّس بطاقات مائل: واجهات متراكبة بزوايا */}
                <div className="mdl-fan">
                  <div className="mdl-fan-card back-2"><Mockup kind="reports" /></div>
                  <div className="mdl-fan-card back-1"><Mockup kind="projects" /></div>
                  <div className="mdl-fan-card front"><Mockup kind="dashboard" /></div>
                </div>
                <div className="mdl-float mdl-float-1">
                  <span className="fic brand"><Icon name="analytics/analytics-growth" size={17} /></span>
                  <div><div className="ftitle">{t('hero.float.completion')}</div><div className="fval">86%</div></div>
                </div>
                <div className="mdl-float mdl-float-2">
                  <span className="fic gold"><Icon name="analytics/analytics-reports" size={17} /></span>
                  <div><div className="ftitle">{t('hero.float.report')}</div><div className="fval">{t('hero.float.reportVal')}</div></div>
                </div>
                <div className="mdl-float mdl-float-3">
                  <span className="fic brand"><Icon name="people/people-users" size={17} /></span>
                  <div><div className="ftitle">{t('hero.float.newMembers')}</div><div className="fval">+12</div></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== PLATFORM VALUE + AUDIENCES ========== */}
        <section id="platform" className="mdl-section">
          <div className="mdl-wrap mdl-center">
            <Reveal>
              <span className="mdl-eyebrow">{t('sec.platform.eyebrow')}</span>
              <h2 className="mdl-h2">{t('sec.platform.title')}</h2>
              <p className="mdl-lead">{t('sec.platform.lead')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mdl-chips">
                {AUDIENCES.map((a) => (
                  <span key={a.k} className="mdl-chip"><Icon name={a.icon} className="ic" size={17} />{t(a.k)}</span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== SYSTEMS (interactive) ========== */}
        <section id="systems" className="mdl-section" style={{ background: 'var(--tint)' }}>
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.systems.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.systems.title')}</h2>
                <p className="mdl-lead">{t('sec.systems.lead')}</p>
              </div>
            </Reveal>
            <SystemsShowcase />
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.how.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.how.title')}</h2>
                <p className="mdl-lead">{t('sec.how.lead')}</p>
              </div>
            </Reveal>
            <HowItWorks />
          </div>
        </section>

        {/* ========== PRODUCT SHOWCASE ========== */}
        <section className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.product.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.product.title')}</h2>
                <p className="mdl-lead">{t('sec.product.lead')}</p>
              </div>
            </Reveal>
            <ProductShowcase />
          </div>
        </section>

        {/* ========== MASRA AI ========== */}
        <section id="ai" className="mdl-section mdl-ai">
          <div className="mdl-wrap mdl-ai-grid">
            <Reveal>
              <div>
                <span className="mdl-eyebrow">{t('sec.ai.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.ai.title')}</h2>
                <p className="mdl-lead">{t('sec.ai.lead')}</p>
                <div className="mdl-hero-actions">
                  <Link href="/login" className="mdl-btn mdl-btn-primary">{t('sec.ai.cta')}</Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15} y={30}><MasraAIChat /></Reveal>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.features.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.features.title')}</h2>
              </div>
            </Reveal>
            <div className="mdl-feats">
              {features.map((f, i) => (
                <Reveal key={i} delay={(i % 3) * 0.06}>
                  <div className="mdl-feat">
                    <span className="fi"><Icon name={f.icon} size={22} /></span>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ========== SECURITY ========== */}
        <section className="mdl-section mdl-sec">
          <div className="mdl-wrap mdl-sec-grid">
            <Reveal>
              <div>
                <span className="mdl-eyebrow">{t('sec.security.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.security.title')}</h2>
                <p className="mdl-lead" style={{ marginBottom: '1.5rem' }}>{t('sec.security.lead')}</p>
                <div className="mdl-sec-list">
                  {SECURITY.map((s) => (
                    <div key={s.k} className="mdl-sec-item"><Icon name={s.icon} size={20} /><span>{t(s.k)}</span></div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mdl-shield">
                <div className="mdl-shield-wrap">
                  <span className="ring" /><span className="ring two" />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== INTEGRATIONS ========== */}
        <section className="mdl-section">
          <div className="mdl-wrap mdl-center">
            <Reveal>
              <span className="mdl-eyebrow">{t('sec.integrations.eyebrow')}</span>
              <h2 className="mdl-h2">{t('sec.integrations.title')}</h2>
              <p className="mdl-lead">{t('sec.integrations.lead')}</p>
            </Reveal>
          </div>
          <div className="mdl-marquee">
            <div className="mdl-marquee-track">
              {[...INTEGRATIONS, ...INTEGRATIONS].map((n, i) => (
                <span key={i} className="mdl-int"><Icon name="actions/actions-link" size={18} />{t(n)}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ========== STORIES (social proof — قبل التسعير) ========== */}
        <section className="mdl-section" style={{ background: 'var(--tint)' }}>
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.stories.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.stories.title')}</h2>
                <p className="mdl-lead">{t('sec.stories.lead')}</p>
                <div className="mdl-rating">
                  <span className="mdl-rating-score">4.9</span>
                  <span className="mdl-rating-stars">{STAR}{STAR}{STAR}{STAR}{STAR}</span>
                  <span className="mdl-rating-meta">{t('sec.stories.rating', { n: '+40' })}</span>
                </div>
              </div>
            </Reveal>
            <Testimonials />
          </div>
        </section>

        {/* ========== PRICING ========== */}
        <section id="pricing" className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.pricing.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.pricing.title')}</h2>
                <p className="mdl-lead">{t('sec.pricing.lead')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mdl-pricing">
                <PricingPlans />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== FAQ ========== */}
        <section id="faq" className="mdl-section" style={{ background: 'var(--tint)' }}>
          <div className="mdl-wrap mdl-faq-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.faq.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.faq.title')}</h2>
                <p className="mdl-lead">{t('sec.faq.lead')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mdl-faq">
                {faqs.map((f, i) => (
                  <details key={i} className="mdl-faq-item">
                    <summary>{f.q}<span className="mdl-faq-mark" aria-hidden="true" /></summary>
                    <div className="mdl-faq-a">{f.a}</div>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="mdl-cta">
          <div className="mdl-wrap mdl-cta-inner">
            <Reveal>
              <h2>{t('cta.title')}</h2>
              <p>{t('cta.lead')}</p>
              <div className="mdl-cta-actions">
                <Link href="/login" className="mdl-btn mdl-btn-primary">{t('cta.login')}</Link>
                <a href="#about" className="mdl-btn mdl-btn-white">{t('cta.contact')}</a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ========== FOOTER ========== */}
      <footer id="about" className="mdl-footer">
        <div className="mdl-wrap">
          <div className="mdl-footer-grid">
            <div>
              <div className="fb-name"><LogoMark size={26} className="mark" /> {t('brand')}</div>
              <p className="fb-desc">{t('footer.desc')}</p>
            </div>
            <div>
              <h5>{t('footer.col.platform')}</h5>
              <ul><li><a href="#platform">{t('footer.overview')}</a></li><li><a href="#systems">{t('nav.systems')}</a></li><li><a href="#ai">{t('nav.ai')}</a></li></ul>
            </div>
            <div>
              <h5>{t('footer.col.solutions')}</h5>
              <ul><li><a href="#platform">{t('nav.orgs')}</a></li><li><a href="#systems">{t('nav.systems')}</a></li><li><a href="#about">{t('nav.about')}</a></li></ul>
            </div>
            <div>
              <h5>{t('footer.col.support')}</h5>
              <ul><li><Link href="/login">{t('nav.login')}</Link></li><li><a href="#about">{t('footer.contact')}</a></li><li><Link href="/privacy">{t('footer.privacy')}</Link></li><li><Link href="/terms">{t('footer.terms')}</Link></li></ul>
            </div>
          </div>
          <div className="mdl-footer-bottom">{t('footer.rights')}</div>
        </div>
      </footer>

      <MasraAssistant />
    </div>
  );
}
