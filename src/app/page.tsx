import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import V2Header from '@/components/v2/V2Header';
import V2Tour from '@/components/v2/V2Tour';
import V2Pricing from '@/components/v2/V2Pricing';
import V2Faq from '@/components/v2/V2Faq';
import V2Footer from '@/components/v2/V2Footer';
import { CtaBand, Eyebrow } from '@/components/v2/blocks';
import SiteAssistant from '@/components/v2/SiteAssistant';
import WordReveal from '@/components/v2/motion/WordReveal';
import ScrollScale from '@/components/v2/motion/ScrollScale';
import ScrollLine from '@/components/v2/motion/ScrollLine';
import { getT } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/platform-settings';
import { getActiveHeroSlides } from '@/lib/hero';
import '@/styles/v2.css';

// الصفحة الرئيسية — مبنية وفق «الدليل الشامل»: لقطات حقيقية ببيانات توضيحية، حركة هادئة،
// وكل ما يُدار من لوحة المالك (الإعلان، شريحة الواجهة، المميزات، الأسئلة، نصوص الهيرو).

const PILLARS = [['hero.trust.systems', 'v2.pillar.1.d'], ['hero.trust.isolation', 'v2.pillar.2.d'], ['hero.trust.rtl', 'v2.pillar.3.d']];
const PROBLEMS = ['ps.p1', 'ps.p2', 'ps.p3', 'ps.p4'];
const ROLES = ['manager', 'teacher', 'staff', 'guardian'];
const SECURITY: [string, boolean][] = [['sec2.perms', false], ['sec2.workspaces', false], ['sec2.access', false], ['sec2.audit', false], ['sec2.mfa', true], ['sec2.sso', true]];

export default async function HomePage() {
  const [{ t, locale }, settings, slides] = await Promise.all([getT(), getPlatformSettings(), getActiveHeroSlides()]);
  const slide = slides[0] ?? null; // شريحة الواجهة المنشورة تقود الهيرو إن وُجدت
  const announcement = settings.announcementActive && settings.announcement
    ? { text: settings.announcement, link: settings.announcementLink || null }
    : null;
  const demoEnabled = !!process.env.DEMO_LOGIN_EMAIL;
  const primaryHref = demoEnabled ? '/api/auth/demo' : '/signup';
  const primaryLabel = t(demoEnabled ? 'hero.cta.demo' : 'hero.cta.explore');
  // لقطة الهيرو: لوحة سطح المكتب، ولقطة الجوال على الشاشات الصغيرة (يُحمَّل واحدة فقط حسب الشاشة)
  const shotAlt = t('v2.shot.tag');
  const { props: { srcSet: mobileShot } } = getImageProps({ alt: shotAlt, src: `/v2/mobile-${locale}.webp`, width: 600, height: 1298, sizes: '320px' });
  const { props: heroShot } = getImageProps({ alt: shotAlt, src: `/v2/dashboard-${locale}.webp`, width: 1920, height: 1200, sizes: '(max-width: 1200px) 100vw, 1160px', loading: 'eager', fetchPriority: 'high' });
  const faqs = settings.homeFaqs?.length ? settings.homeFaqs : [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));

  return (
    <div className={`v2 ${announcement ? 'has-announce' : ''}`}>
      <V2Header announcement={announcement} />
      <main id="main">
        {/* 01 — الواجهة الأولى: رسالة واحدة + لقطة حقيقية */}
        <section id="home" className="v2-hero">
          <div className="v2-wrap v2-hero-copy">
            <div className="v2-rise"><Eyebrow onDeep>{t('hero.eyebrow')}</Eyebrow></div>
            <h1>
              {slide
                ? <WordReveal text={slide.title} delay={0.05} />
                : <>
                    <WordReveal text={settings.heroTitle1 || t('hero.title1')} delay={0.05} />{' '}
                    <span className="v2-hl"><WordReveal text={settings.heroTitle2 || t('hero.title2')} delay={0.3} /></span>
                  </>}
            </h1>
            <p className="v2-hero-sub v2-rise" style={{ animationDelay: '0.45s' }}>{slide?.subtitle || settings.heroSubtitle || t('hero.sub')}</p>
            <div className="v2-rise" style={{ animationDelay: '0.55s' }}>
              <div className="v2-actions">
                {slide?.ctaText && slide.ctaLink
                  ? (slide.ctaLink.startsWith('/')
                      ? <Link href={slide.ctaLink} className="v2-btn v2-btn-light">{slide.ctaText}</Link>
                      : <a href={slide.ctaLink} className="v2-btn v2-btn-light" target="_blank" rel="noopener noreferrer">{slide.ctaText}</a>)
                  : <a href={primaryHref} className="v2-btn v2-btn-light">{primaryLabel}</a>}
                <a href="#pricing" className="v2-btn v2-btn-onDeep">{t('nav.pricing')}</a>
              </div>
            </div>
          </div>
          <ScrollScale className="v2-wrap v2-hero-shot">
            <figure className="v2-hero-fig v2-rise" style={{ animationDelay: '0.35s' }}>
              <div className="v2-frame">
                <div className="v2-frame-bar" aria-hidden="true"><i /><i /><i /><span dir="ltr">masraos.com</span></div>
                <picture>
                  <source media="(max-width: 640px)" srcSet={mobileShot} sizes="320px" />
                  <img {...heroShot} alt={shotAlt} className="v2-shot-img v2-hero-img" />
                </picture>
              </div>
              <figcaption className="v2-tag">{t('v2.shot.tag')}</figcaption>
            </figure>
          </ScrollScale>
        </section>

        <section className="v2-pillars" aria-label={t('hero.eyebrow')}>
          <div className="v2-wrap v2-pillars-row">
            {PILLARS.map(([k, d]) => <div key={k}><b>{t(k)}</b><span>{t(d)}</span></div>)}
          </div>
        </section>

        {/* 02 — المشكلة والحل */}
        <section className="v2-section">
          <div className="v2-wrap v2-split">
            <Reveal>
              <Eyebrow>{t('sec.ps.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('sec.ps.title')}</h2>
              <p className="v2-lead">{t('ps.sol.desc')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <ol className="v2-numbered">
                {PROBLEMS.map((k, i) => <li key={k}><span className="v2-num">{String(i + 1).padStart(2, '0')}</span><span>{t(k)}</span></li>)}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* 03 — جولة المنتج: لقطات حقيقية */}
        <section id="systems" className="v2-section v2-tint">
          <div className="v2-wrap">
            <Reveal className="v2-head">
              <Eyebrow>{t('sec.systems.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('v2.tour.title')}</h2>
              <p className="v2-lead">{t('v2.tour.lead')}</p>
            </Reveal>
            <Reveal delay={0.1}><V2Tour /></Reveal>
          </div>
        </section>

        {/* 04 — كيف يعمل */}
        <section id="how-it-works" className="v2-section">
          <div className="v2-wrap">
            <Reveal className="v2-head">
              <Eyebrow>{t('sec.how.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('sec.how.title')}</h2>
              <p className="v2-lead">{t('sec.how.lead')}</p>
            </Reveal>
            <ScrollLine className="v2-steps">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n}>
                  <Reveal delay={n * 0.05}><span className="v2-step-num">{n}</span><h3>{t(`how.${n}.t`)}</h3><p>{t(`how.${n}.d`)}</p></Reveal>
                </li>
              ))}
            </ScrollLine>
          </div>
        </section>

        {/* المميزات — من لوحة المالك عند إضافتها */}
        {settings.homeFeatures?.length ? (
          <section id="features" className="v2-section v2-section-rule">
            <div className="v2-wrap">
              <Reveal className="v2-head">
                <Eyebrow>{t('sec.features.eyebrow')}</Eyebrow>
                <h2 className="v2-h2">{t('sec.features.title')}</h2>
              </Reveal>
              <div className="v2-feature-grid">
                {settings.homeFeatures.map((f, i) => (
                  <Reveal key={i} delay={(i % 3) * 0.05}>
                    <div className="v2-feature"><h3>{f.title}</h3><p>{f.desc}</p></div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 05 — الأدوار + الجوال */}
        <section id="roles" className="v2-section v2-tint">
          <div className="v2-wrap v2-roles">
            <div>
              <Reveal>
                <Eyebrow>{t('sec.product.eyebrow')}</Eyebrow>
                <h2 className="v2-h2">{t('sec.product.title')}</h2>
                <p className="v2-lead">{t('v2.roles.lead')}</p>
              </Reveal>
              <div className="v2-role-grid">
                {ROLES.map((r, i) => (
                  <Reveal key={r} delay={i * 0.05}>
                    <div className="v2-role">
                      <h3>{t(`v2.roles.${r}.t`)}</h3>
                      <p>{t(`v2.roles.${r}.d`)}</p>
                      <ul className="v2-checks">{[1, 2, 3].map((n) => <li key={n}><Icon name="check" size={16} />{t(`v2.roles.${r}.b${n}`)}</li>)}</ul>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={0.15} y={28}>
              <figure className="v2-phone">
                <Image src={`/v2/mobile-${locale}.webp`} width={600} height={1298} sizes="300px" alt={t('v2.roles.phone')} className="v2-shot-img" />
                <figcaption className="v2-tag">{t('v2.roles.phone')}</figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* 06 — المساعد والأمان */}
        <section id="ai" className="v2-section v2-deep">
          <div className="v2-wrap v2-duo">
            <Reveal>
              <div className="v2-duo-col">
                <Eyebrow onDeep>{t('sec.ai.eyebrow')}</Eyebrow>
                <h2 className="v2-h2">{t('sec.ai.title')}</h2>
                <p className="v2-lead">{t('sec.ai.lead')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="v2-duo-col">
                <Eyebrow onDeep>{t('sec.security.eyebrow')}</Eyebrow>
                <h2 className="v2-h2">{t('sec.security.title')}</h2>
                <p className="v2-lead">{t('sec.security.lead')}</p>
                <ul className="v2-sec-list">
                  {SECURITY.map(([k, soon]) => (
                    <li key={k}><Icon name="check" size={16} />{t(k)}{soon && <span className="v2-soon">{t('badge.soon')}</span>}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 07 — الباقات */}
        <section id="pricing" className="v2-section">
          <div className="v2-wrap">
            <Reveal className="v2-head">
              <Eyebrow>{t('sec.pricing.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('sec.pricing.title')}</h2>
              <p className="v2-lead">{t('sec.pricing.lead')}</p>
              <span className="v2-draft">{t('v2.pricing.tag')}</span>
            </Reveal>
            <Reveal delay={0.1}><V2Pricing /></Reveal>
          </div>
        </section>

        {/* 08 — الأسئلة الشائعة */}
        <section id="faq" className="v2-section v2-tint">
          <div className="v2-wrap v2-split">
            <Reveal>
              <Eyebrow>{t('sec.faq.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('sec.faq.title')}</h2>
              <p className="v2-lead">{t('sec.faq.lead')}</p>
              <p className="v2-faq-more">{t('v2.faq.more')} <Link href="/contact" className="v2-link">{t('cta.contact')} <span className="v2-arrow" aria-hidden="true">←</span></Link></p>
            </Reveal>
            <Reveal delay={0.1}>
              <V2Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* 09 — الدعوة الأخيرة */}
        <CtaBand />
      </main>

      <V2Footer />
      <SiteAssistant />
    </div>
  );
}
