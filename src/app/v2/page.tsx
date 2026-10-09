import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import V2Header from '@/components/v2/V2Header';
import V2Tour from '@/components/v2/V2Tour';
import V2Pricing from '@/components/v2/V2Pricing';
import { getT } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/platform-settings';
import '@/styles/v2.css';

// نسخة ثانية للصفحة الرئيسية للمراجعة — غير مفهرسة حتى تُعتمد
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('v2.meta.title'), description: t('hero.sub'), robots: { index: false, follow: false } };
}

const PILLARS = [['hero.trust.systems', 'v2.pillar.1.d'], ['hero.trust.isolation', 'v2.pillar.2.d'], ['hero.trust.rtl', 'v2.pillar.3.d']];
const PROBLEMS = ['ps.p1', 'ps.p2', 'ps.p3', 'ps.p4'];
const ROLES = ['manager', 'teacher', 'staff', 'guardian'];
const SECURITY: [string, boolean][] = [['sec2.perms', false], ['sec2.workspaces', false], ['sec2.access', false], ['sec2.audit', false], ['sec2.mfa', true], ['sec2.sso', true]];

function Eyebrow({ children, onDeep }: { children: ReactNode; onDeep?: boolean }) {
  return <span className={`v2-eyebrow ${onDeep ? 'is-onDeep' : ''}`}>{children}</span>;
}

export default async function HomeV2() {
  const [{ t, locale }, settings] = await Promise.all([getT(), getPlatformSettings()]);
  const demoEnabled = !!process.env.DEMO_LOGIN_EMAIL;
  const primaryHref = demoEnabled ? '/api/auth/demo' : '/signup';
  const primaryLabel = t(demoEnabled ? 'hero.cta.demo' : 'hero.cta.explore');
  const faqs = settings.homeFaqs?.length ? settings.homeFaqs : [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));

  return (
    <div className="v2">
      <V2Header />
      <main id="main">
        {/* 01 — الواجهة الأولى: رسالة واحدة + لقطة حقيقية */}
        <section className="v2-hero">
          <div className="v2-wrap v2-hero-copy">
            <Reveal><Eyebrow onDeep>{t('hero.eyebrow')}</Eyebrow></Reveal>
            <Reveal delay={0.05}>
              <h1>{settings.heroTitle1 || t('hero.title1')} <span>{settings.heroTitle2 || t('hero.title2')}</span></h1>
            </Reveal>
            <Reveal delay={0.1}><p className="v2-hero-sub">{settings.heroSubtitle || t('hero.sub')}</p></Reveal>
            <Reveal delay={0.15}>
              <div className="v2-actions">
                <a href={primaryHref} className="v2-btn v2-btn-light">{primaryLabel}</a>
                <a href="#pricing" className="v2-link v2-link-onDeep">{t('nav.pricing')} <span className="v2-arrow" aria-hidden="true">←</span></a>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2} y={28} className="v2-wrap v2-hero-shot">
            <figure className="v2-hero-fig">
              <div className="v2-frame">
                <div className="v2-frame-bar" aria-hidden="true"><i /><i /><i /><span dir="ltr">masraos.com</span></div>
                <Image src={`/v2/dashboard-${locale}.webp`} width={1920} height={1200} priority sizes="(max-width: 1200px) 100vw, 1160px"
                  alt={t('v2.shot.tag')} className="v2-shot-img" />
              </div>
              <figcaption className="v2-tag">{t('v2.shot.tag')}</figcaption>
            </figure>
          </Reveal>
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
        <section id="tour" className="v2-section v2-tint">
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
        <section id="how" className="v2-section">
          <div className="v2-wrap">
            <Reveal className="v2-head">
              <Eyebrow>{t('sec.how.eyebrow')}</Eyebrow>
              <h2 className="v2-h2">{t('sec.how.title')}</h2>
              <p className="v2-lead">{t('sec.how.lead')}</p>
            </Reveal>
            <ol className="v2-steps">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n}>
                  <Reveal delay={n * 0.05}><span className="v2-step-num">{n}</span><h3>{t(`how.${n}.t`)}</h3><p>{t(`how.${n}.d`)}</p></Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

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
              <div className="v2-faq">
                {faqs.map((f, i) => (
                  <details key={i}>
                    <summary>{f.q}<span className="v2-faq-mark" aria-hidden="true" /></summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* 09 — الدعوة الأخيرة */}
        <section className="v2-cta">
          <div className="v2-wrap v2-cta-inner">
            <Reveal>
              <h2>{t('cta.title')}</h2>
              <p>{t('cta.lead')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="v2-actions">
                <a href={primaryHref} className="v2-btn v2-btn-light">{primaryLabel}</a>
                <Link href="/contact" className="v2-link v2-link-onDeep">{t('cta.contact')} <span className="v2-arrow" aria-hidden="true">←</span></Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="v2-footer">
        <div className="v2-wrap v2-footer-grid">
          <div>
            <span className="v2-brand"><LogoMark size={26} /><span>{t('brand')}</span></span>
            <p>{t('footer.desc')}</p>
          </div>
          <nav aria-label={t('footer.col.platform')}>
            <h2>{t('footer.col.platform')}</h2>
            <a href="#tour">{t('nav.platform')}</a><a href="#ai">{t('nav.ai')}</a><a href="#pricing">{t('nav.pricing')}</a>
          </nav>
          <nav aria-label={t('footer.col.solutions')}>
            <h2>{t('footer.col.solutions')}</h2>
            <a href="#how">{t('nav.journey')}</a><a href="#roles">{t('nav.roles')}</a><Link href="/audiences">{t('nav.orgs')}</Link>
          </nav>
          <nav aria-label={t('footer.col.support')}>
            <h2>{t('footer.col.support')}</h2>
            <Link href="/login">{t('nav.login')}</Link><Link href="/contact">{t('footer.contact')}</Link>
            <Link href="/privacy">{t('footer.privacy')}</Link><Link href="/terms">{t('footer.terms')}</Link>
          </nav>
        </div>
        <div className="v2-wrap v2-footer-base">{t('footer.rights')}</div>
      </footer>
    </div>
  );
}
