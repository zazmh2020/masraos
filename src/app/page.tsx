import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import MasraHeader from '@/components/landing/MasraHeader';
import Mockup from '@/components/landing/Mockup';
import SystemsShowcase from '@/components/landing/SystemsShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import ProductShowcase from '@/components/landing/ProductShowcase';
import MasraAIChat from '@/components/landing/MasraAIChat';
import MasraAssistant from '@/components/landing/MasraAssistant';
import PricingPreview from '@/components/landing/PricingPreview';
import { getT } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/platform-settings';
import { getActiveHeroSlides } from '@/lib/hero';
import '@/styles/masra.css';
import '@/styles/pricing.css';

const FEATURES = [
  { icon: 'organization/organization-structure', k: 'feat.central' },
  { icon: 'operations/operations-activities', k: 'feat.flexible' },
  { icon: 'people/people-permissions', k: 'feat.perms' },
  { icon: 'analytics/analytics-analytics', k: 'feat.reports' },
  { icon: 'analytics/analytics-growth', k: 'feat.scale' },
  { icon: 'identity/identity-digital-identity', k: 'feat.arabic' },
];

const SECURITY: { icon: string; k: string; soon?: boolean }[] = [
  { icon: 'people/people-permissions', k: 'sec2.perms' },
  { icon: 'organization/organization-office', k: 'sec2.workspaces' },
  { icon: 'actions/actions-lock', k: 'sec2.access' },
  { icon: 'analytics/analytics-reports', k: 'sec2.audit' },
  { icon: 'identity/identity-security', k: 'sec2.mfa', soon: true },
  { icon: 'identity/identity-digital-identity', k: 'sec2.sso', soon: true },
];

const INTEGRATIONS = ['int.email', 'int.payment', 'int.whatsapp', 'int.google', 'int.microsoft', 'int.api'];


export default async function HomePage() {
  // جلب متوازٍ (بدل تسلسلي) — الترجمة والإعدادات وشرائح الهيرو مستقلّة
  const [{ t, locale }, settings, slides] = await Promise.all([
    getT(),
    getPlatformSettings(),
    getActiveHeroSlides(),
  ]);
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
  const demoEnabled = !!process.env.DEMO_LOGIN_EMAIL; // زر «شاهد المنصة» يظهر عند تهيئة حساب العرض

  // محتوى شريط الإعلان المتحرك — نِصفان متطابقان (كلٌّ يكرّر النصّ عدّة مرّات ليملأ العرض)،
  // والحركة تُزيح بمقدار نصف المسار فيبدو دورانًا متّصلًا بلا فراغ مهما كان طول النصّ.
  const announceHalf = (side: string) => (
    <span className="mdl-announce-half" key={side} aria-hidden={side === 'b' || undefined}>
      {[0, 1, 2, 3].map((i) => (
        <span className="mdl-announce-run" key={i}>
          <span>{settings.announcement}</span>
          <span className="mdl-announce-star" aria-hidden="true">✦</span>
        </span>
      ))}
    </span>
  );
  const announceInner = (
    <span className="mdl-announce-track">
      {announceHalf('a')}
      {announceHalf('b')}
    </span>
  );

  return (
    <div className={`mdl ${showAnnounce ? 'has-announce' : ''}`}>
      {showAnnounce && (
        settings.announcementLink
          ? settings.announcementLink.startsWith('/')
            ? <Link href={settings.announcementLink} className="mdl-announce is-link">{announceInner}</Link>
            : <a href={settings.announcementLink} target="_blank" rel="noopener noreferrer" className="mdl-announce is-link">{announceInner}</a>
          : <div className="mdl-announce" role="status">{announceInner}</div>
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
              <Reveal delay={0.15}>
                <p className="mdl-hero-tagline">{t('hero.tagline')}</p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mdl-hero-actions">
                  {slide?.ctaText && slide.ctaLink
                    ? (slide.ctaLink.startsWith('/')
                        ? <Link href={slide.ctaLink} className="mdl-btn mdl-btn-light">{slide.ctaText}</Link>
                        : <a href={slide.ctaLink} className="mdl-btn mdl-btn-light" target="_blank" rel="noopener noreferrer">{slide.ctaText}</a>)
                    : <a href={demoEnabled ? "/api/auth/demo" : "#systems"} className="mdl-btn mdl-btn-light">{t(demoEnabled ? 'hero.cta.demo' : 'hero.cta.explore')}</a>}
                  <a href="#pricing" className="mdl-btn mdl-btn-outline-light">{t('nav.pricing')}</a>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mdl-hero-trust">
                  <span>{t('hero.trust.systems')}</span>
                  <span className="sep" />
                  <span>{t('hero.trust.isolation')}</span>
                  <span className="sep" />
                  <span>{t('hero.trust.rtl')}</span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2} y={30}>
              <div className="mdl-hero-stage">
                <span className="mdl-demo-tag">{t('mockup.demo')}</span>
                {/* مكدّس بطاقات مائل: واجهات متراكبة بزوايا */}
                <div className="mdl-fan">
                  <div className="mdl-fan-card back-2"><Mockup kind="reports" /></div>
                  <div className="mdl-fan-card back-1"><Mockup kind="org" /></div>
                  <div className="mdl-fan-card front"><Mockup kind="education" /></div>
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


        {/* ========== PROBLEM → SOLUTION ========== */}
        <section className="mdl-section" style={{ background: 'var(--white)' }}>
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.ps.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.ps.title')}</h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mdl-ps" style={{ marginTop: '2.5rem' }}>
                <div className="mdl-problems">
                  {['ps.p1', 'ps.p2', 'ps.p3', 'ps.p4'].map((k) => (
                    <div key={k} className="mdl-prob"><span className="x"><Icon name="close" size={16} /></span><span>{t(k)}</span></div>
                  ))}
                </div>
                <div className="mdl-solution">
                  <h3>{t('ps.sol.title')}</h3>
                  <p>{t('ps.sol.desc')}</p>
                  <a href="#how-it-works" className="mdl-btn mdl-btn-light">{t('sec.how.eyebrow')}</a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== SYSTEMS (interactive) ========== */}
        <section id="systems" className="mdl-section">
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
        <section id="how-it-works" className="mdl-section" style={{ background: 'var(--white)' }}>
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
        <section id="roles" className="mdl-section">
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
                  <a href="#pricing" className="mdl-btn mdl-btn-primary">{t('sec.ai.cta')}</a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15} y={30}><MasraAIChat /></Reveal>
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
              <PricingPreview />
            </Reveal>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        {settings.homeFeatures?.length ? <section className="mdl-section">
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
        </section> : null}

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
                    <div key={s.k} className="mdl-sec-item"><Icon name={s.icon} size={20} /><span>{t(s.k)}{s.soon && <span className="mdl-soon">{t('badge.soon')}</span>}</span></div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mdl-shield">
                <div className="mdl-shield-wrap">
                  <span className="ring" /><span className="ring two" />
                  <Icon name="verified" size={48} />
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
              {/* القطاع المتاح فقط، والبقية سطر ثانوي واحد بدل شارات «قريبًا» متكرّرة */}
              <div className="mdl-chips">
                <span className="mdl-chip"><Icon name="education/education-quran" className="ic" size={17} />{t('aud.quran')}<span className="mdl-soon">{t('aud.available')}</span></span>
              </div>
              <p className="mdl-lead" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>{t('aud.later')}</p>
            </Reveal>
          </div>
        </section>

        {/* ========== INTEGRATIONS ========== */}
        <section className="mdl-section" style={{ background: 'var(--white)' }}>
          <div className="mdl-wrap mdl-center">
            <Reveal>
              <span className="mdl-eyebrow">{t('sec.integrations.eyebrow')}</span>
              <h2 className="mdl-h2">{t('sec.integrations.title')}</h2>
              <p className="mdl-lead">{t('sec.integrations.lead')}</p>
            </Reveal>
          </div>
          {/* قائمة ثابتة (بلا شريط متحرك) — التكاملات مخطط لها وليست مفعّلة */}
          <div className="mdl-wrap">
            <ul className="mdl-chips" aria-label={t('sec.integrations.title')} style={{ listStyle: 'none', padding: 0 }}>
              {INTEGRATIONS.map((n) => (
                <li key={n} className="mdl-int"><Icon name="actions/actions-link" size={18} />{t(n)}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ========== FAQ ========== */}
        <section id="faq" className="mdl-section" style={{ background: 'var(--white)' }}>
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
                <a href="#systems" className="mdl-btn mdl-btn-light">{t('hero.cta.explore')}</a>
                <Link href="/contact" className="mdl-btn mdl-btn-outline-light">{t('cta.contact')}</Link>
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
              <ul><li><a href="#platform">{t('nav.orgs')}</a></li><li><a href="#how-it-works">{t('nav.journey')}</a></li><li><a href="#roles">{t('nav.roles')}</a></li></ul>
            </div>
            <div>
              <h5>{t('footer.col.support')}</h5>
              <ul><li><Link href="/login">{t('nav.login')}</Link></li><li><Link href="/contact">{t('footer.contact')}</Link></li><li><Link href="/privacy">{t('footer.privacy')}</Link></li><li><Link href="/terms">{t('footer.terms')}</Link></li></ul>
            </div>
          </div>
          <div className="mdl-footer-bottom">{t('footer.rights')}</div>
        </div>
      </footer>

      <MasraAssistant />
    </div>
  );
}
