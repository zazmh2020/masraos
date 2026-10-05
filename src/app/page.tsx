import Link from 'next/link';
import Image from 'next/image';
import Reveal from '@/components/Reveal';
import { LogoMark } from '@/components/Logo';
import MasraHeader from '@/components/landing/MasraHeader';
import MasraFooter from '@/components/landing/MasraFooter';
import MasraAIChat from '@/components/landing/MasraAIChat';
import MasraAssistant from '@/components/landing/MasraAssistant';
import PricingPreview from '@/components/landing/PricingPreview';
import { getT } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/platform-settings';
import { getActiveHeroSlides } from '@/lib/hero';
import '@/styles/masra.css';
import '@/styles/pricing.css';
import '@/styles/home.css';

/* ============================================================
   الصفحة الرئيسية — مراكز تعليم القرآن.
   إيقاع لوني (بنفسجي داكن / لافندر / أبيض) بدل صفحة بيضاء كاملة،
   زر أساسي واحد لكل قسم، وأيقونات أقل: الأرقام والخطوط تقوم مقامها.
   كل الصور لقطات من واجهات مَسرى ببيانات توضيحية (موسومة)،
   ولا شعارات عملاء أو شهادات أو أرقام مختلقة.
   ============================================================ */

const STRIP = ['home.strip.students', 'home.strip.halaqat', 'home.strip.attendance', 'home.strip.memo', 'home.strip.exams', 'home.strip.guardians', 'home.strip.points'];
const STEPS = [1, 2, 3, 4, 5];
const ROLES = [
  { k: 'admin', img: '/shots/orgshell.webp' },
  { k: 'teacher', img: '/shots/exams.webp' },
  { k: 'staff', img: '/shots/overview.webp' },
];
const TRUST = ['sec2.perms', 'sec2.workspaces', 'sec2.access', 'sec2.audit'];
const FEATURE_KEYS = ['feat.central', 'feat.flexible', 'feat.perms', 'feat.reports', 'feat.scale', 'feat.arabic'];

// التكاملات المخطط لها حول المحور (مواضع ثابتة كنسبة مئوية من الحاوية)
const INTEGRATIONS = [
  { k: 'int.email', x: 14, y: 22 },
  { k: 'int.whatsapp', x: 86, y: 22 },
  { k: 'int.payment', x: 6, y: 62 },
  { k: 'int.google', x: 94, y: 62 },
  { k: 'int.microsoft', x: 28, y: 92 },
  { k: 'int.api', x: 72, y: 92 },
];

const num = (n: number) => String(n).padStart(2, '0');

function Shot({ src, alt, label, priority }: { src: string; alt: string; label: string; priority?: boolean }) {
  return (
    <figure className="mh-shot">
      <div className="mh-shot-bar" aria-hidden="true"><i /><i /><i /></div>
      <Image src={src} alt={alt} width={1600} height={1000} sizes="(max-width: 960px) 100vw, 640px" priority={priority} />
      <figcaption className="mh-shot-tag">{label}</figcaption>
    </figure>
  );
}

export default async function HomePage() {
  const [{ t }, settings, slides] = await Promise.all([
    getT(),
    getPlatformSettings(),
    getActiveHeroSlides(),
  ]);
  const slide = slides[0] ?? null; // شريحة الواجهة المنشورة تقود الهيرو إن وُجدت

  const features = settings.homeFeatures?.length
    ? settings.homeFeatures.map((f) => ({ title: f.title, desc: f.desc }))
    : FEATURE_KEYS.map((k) => ({ title: t(`${k}.t`), desc: t(`${k}.d`) }));

  const faqs = settings.homeFaqs?.length
    ? settings.homeFaqs
    : [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));

  const showAnnounce = settings.announcementActive && !!settings.announcement;
  const demoEnabled = !!process.env.DEMO_LOGIN_EMAIL;
  const demoLabel = t('mockup.demo');

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
  const announceInner = <span className="mdl-announce-track">{announceHalf('a')}{announceHalf('b')}</span>;

  // الزر الأساسي: زر الشريحة المنشورة إن وُجد، وإلا إنشاء الحساب
  const primaryCta = slide?.ctaText && slide.ctaLink
    ? (slide.ctaLink.startsWith('/')
        ? <Link href={slide.ctaLink} className="mh-btn mh-btn-light">{slide.ctaText}</Link>
        : <a href={slide.ctaLink} className="mh-btn mh-btn-light" target="_blank" rel="noopener noreferrer">{slide.ctaText}</a>)
    : <Link href="/signup" className="mh-btn mh-btn-light">{t('home.cta.signup')}</Link>;

  return (
    <div className={`mdl mh ${showAnnounce ? 'has-announce' : ''}`}>
      {showAnnounce && (
        settings.announcementLink
          ? settings.announcementLink.startsWith('/')
            ? <Link href={settings.announcementLink} className="mdl-announce is-link">{announceInner}</Link>
            : <a href={settings.announcementLink} target="_blank" rel="noopener noreferrer" className="mdl-announce is-link">{announceInner}</a>
          : <div className="mdl-announce" role="status">{announceInner}</div>
      )}
      <MasraHeader />

      <main id="home">
        {/* ========== HERO (بنفسجي داكن) ========== */}
        <section className="mh-hero">
          <div className="mh-wrap mh-hero-grid">
            <div className="mh-hero-copy">
              <Reveal><span className="mh-pill">{t('home.hero.pill')}</span></Reveal>
              <Reveal delay={0.05}>
                <h1 className="mh-h1">
                  {slide
                    ? slide.title
                    : <>{settings.heroTitle1 || t('hero.title1')} <span className="hl">{settings.heroTitle2 || t('hero.title2')}</span></>}
                </h1>
              </Reveal>
              <Reveal delay={0.1}><p className="mh-lead">{slide?.subtitle || settings.heroSubtitle || t('hero.sub')}</p></Reveal>
              <Reveal delay={0.15}>
                <div className="mh-actions">
                  {primaryCta}
                  {demoEnabled
                    ? <a href="/api/auth/demo" className="mh-link">{t('hero.cta.demo')}</a>
                    : <a href="#how-it-works" className="mh-link">{t('home.cta.how')}</a>}
                </div>
              </Reveal>
              <Reveal delay={0.2}><p className="mh-note">{t('home.hero.note')}</p></Reveal>
            </div>

            <Reveal delay={0.15} y={28} className="mh-hero-visual">
              <Shot src="/shots/overview.webp" alt={t('home.role.staff.d')} label={demoLabel} priority />
              <div className="mh-float" aria-hidden="true">
                <b>23/24</b><small>{t('home.float.att')}</small>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ما يعمل اليوم — قائمة نصية بدل شريط شعارات */}
        <div className="mh-strip">
          <div className="mh-wrap">
            <span className="mh-strip-title">{t('home.strip.title')}</span>
            <ul>{STRIP.map((k) => <li key={k}>{t(k)}</li>)}</ul>
          </div>
        </div>

        {/* ========== FOR THE PEOPLE WHO RUN CIRCLES ========== */}
        <section id="platform" className="mh-section">
          <div className="mh-wrap mh-people">
            <Reveal className="mh-people-media">
              <Shot src="/shots/attendance.webp" alt={t('home.people.b1')} label={demoLabel} />
            </Reveal>
            <Reveal delay={0.1} className="mh-people-copy">
              <span className="mh-eyebrow">{t('sec.platform.eyebrow')}</span>
              <h2 className="mh-h2">{t('home.people.title')}</h2>
              <p className="mh-p">{t('home.people.lead')}</p>
              <ul className="mh-lines">
                {['home.people.b1', 'home.people.b2', 'home.people.b3'].map((k) => <li key={k}>{t(k)}</li>)}
              </ul>
              <p className="mh-sector"><strong>{t('aud.quran')} · {t('aud.available')}</strong> {t('aud.later')}</p>
            </Reveal>
          </div>
        </section>

        {/* ========== HOW IT WORKS (لافندر) ========== */}
        <section id="how-it-works" className="mh-section mh-lilac">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-split-head">
                <div>
                  <span className="mh-eyebrow">{t('sec.how.eyebrow')}</span>
                  <h2 className="mh-h2">{t('home.how.title')}</h2>
                </div>
                <p className="mh-p">{t('home.how.lead')}</p>
              </div>
            </Reveal>
            <ol className="mh-steps">
              {STEPS.map((n, i) => (
                <Reveal key={n} delay={i * 0.06}>
                  <li className="mh-step">
                    <span className="mh-step-n" aria-hidden="true">{num(n)}</span>
                    <h3>{t(`how.${n}.t`)}</h3>
                    <p>{t(`how.${n}.d`)}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={0.1}>
              <div className="mh-wide-shot">
                <Shot src="/shots/schedule.webp" alt={t('home.how.title')} label={demoLabel} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== ROLES ========== */}
        <section id="roles" className="mh-section">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-head">
                <span className="mh-eyebrow">{t('home.roles.eyebrow')}</span>
                <h2 className="mh-h2">{t('home.roles.title')}</h2>
                <p className="mh-p">{t('home.roles.lead')}</p>
              </div>
            </Reveal>
            <div className="mh-roles">
              {ROLES.map((r, i) => (
                <div key={r.k} className={`mh-role ${i % 2 ? 'is-flip' : ''}`}>
                  <Reveal className="mh-role-media"><Shot src={r.img} alt={t(`home.role.${r.k}.d`)} label={demoLabel} /></Reveal>
                  <Reveal delay={0.1} className="mh-role-copy">
                    <span className="mh-role-n" aria-hidden="true">{num(i + 1)}</span>
                    <h3 className="mh-h3">{t(`home.role.${r.k}.t`)}</h3>
                    <p className="mh-p">{t(`home.role.${r.k}.d`)}</p>
                    <ul className="mh-lines">
                      {[1, 2, 3].map((n) => <li key={n}>{t(`home.role.${r.k}.b${n}`)}</li>)}
                    </ul>
                  </Reveal>
                </div>
              ))}
            </div>
            <p className="mh-guardian">{t('home.role.guardian')}</p>
          </div>
        </section>

        {/* ========== MASRA AI (بنفسجي داكن) ========== */}
        <section id="ai" className="mh-section mh-deep">
          <div className="mh-wrap mh-ai-grid">
            <Reveal>
              <div>
                <span className="mh-eyebrow">{t('sec.ai.eyebrow')}</span>
                <h2 className="mh-h2">{t('sec.ai.title')}</h2>
                <p className="mh-p">{t('sec.ai.lead')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1} y={24}><MasraAIChat /></Reveal>
          </div>
        </section>

        {/* ========== FEATURES — قائمة تحريرية بلا بطاقات ولا أيقونات ========== */}
        <section className="mh-section">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-split-head">
                <h2 className="mh-h2">{t('sec.features.title')}</h2>
                <p className="mh-p">{t('features.lead')} <Link href="/features" className="mh-inline-link">{t('nav.features')}</Link></p>
              </div>
            </Reveal>
            <ul className="mh-index">
              {features.map((f, i) => (
                <li key={i}>
                  <span className="mh-index-n" aria-hidden="true">{num(i + 1)}</span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ========== TRUST + INTEGRATIONS (لافندر) ========== */}
        <section className="mh-section mh-lilac">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-split-head">
                <h2 className="mh-h2">{t('home.trust.title')}</h2>
                <p className="mh-p">{t('sec.security.lead')}</p>
              </div>
            </Reveal>
            <ul className="mh-trust">
              {TRUST.map((k) => <li key={k}>{t(k)}</li>)}
            </ul>
            <p className="mh-muted">{t('home.trust.planned')}</p>

            <Reveal>
              <div className="mh-int">
                <div className="mh-head">
                  <span className="mh-eyebrow">{t('sec.integrations.eyebrow')}</span>
                  <h2 className="mh-h2">{t('sec.integrations.title')}</h2>
                  <p className="mh-p">{t('sec.integrations.lead')}</p>
                </div>
                <div className="mh-hub" role="img" aria-label={INTEGRATIONS.map((n) => t(n.k)).join('، ')}>
                  <svg className="mh-hub-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {INTEGRATIONS.map((n) => <line key={n.k} x1="50" y1="50" x2={n.x} y2={n.y} />)}
                  </svg>
                  <span className="mh-hub-core"><LogoMark size={30} /></span>
                  {INTEGRATIONS.map((n) => (
                    <span key={n.k} className="mh-hub-node" style={{ insetInlineStart: `${n.x}%`, top: `${n.y}%` }}>{t(n.k)}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== PRICING ========== */}
        <section id="pricing" className="mh-section">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-head">
                <span className="mh-eyebrow">{t('sec.pricing.eyebrow')}</span>
                <h2 className="mh-h2">{t('sec.pricing.title')}</h2>
                <p className="mh-p">{t('sec.pricing.lead')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}><PricingPreview /></Reveal>
          </div>
        </section>

        {/* ========== FAQ (لافندر) ========== */}
        <section id="faq" className="mh-section mh-lilac">
          <div className="mh-wrap mh-faq">
            <Reveal>
              <div className="mh-faq-side">
                <span className="mh-eyebrow">{t('sec.faq.eyebrow')}</span>
                <h2 className="mh-h2">{t('sec.faq.title')}</h2>
                <p className="mh-p">{t('sec.faq.lead')}</p>
                <p className="mh-muted">{t('home.faq.more')} <Link href="/contact" className="mh-inline-link">{t('home.faq.contact')}</Link></p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mh-faq-list">
                {faqs.map((f, i) => (
                  <details key={i} className="mh-faq-item">
                    <summary>{f.q}<span className="mh-faq-mark" aria-hidden="true" /></summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== FINAL CTA (بنفسجي داكن) ========== */}
        <section className="mh-section">
          <div className="mh-wrap">
            <Reveal>
              <div className="mh-cta">
                <h2>{t('cta.title')}</h2>
                <p>{t('cta.lead')}</p>
                <div className="mh-actions">
                  <Link href="/signup" className="mh-btn mh-btn-light">{t('home.cta.signup')}</Link>
                  <Link href="/contact" className="mh-link">{t('cta.contact')}</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <MasraFooter />

      <MasraAssistant />
    </div>
  );
}
