import Link from 'next/link';
import type { ReactNode } from 'react';
import Reveal from '@/components/Reveal';
import { getT } from '@/lib/i18n/server';

/** عنوان صغير فوق العناوين (خط قصير + نص). */
export function Eyebrow({ children, onDeep }: { children: ReactNode; onDeep?: boolean }) {
  return <span className={`v2-eyebrow ${onDeep ? 'is-onDeep' : ''}`}>{children}</span>;
}

/** شريط العنوان البنفسجي العميق للصفحات الثانوية — الرأس الشفاف يجلس فوقه. */
export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="v2-page-hero">
      <div className="v2-wrap">
        <div className="v2-rise"><Eyebrow onDeep>{eyebrow}</Eyebrow></div>
        <h1 className="v2-rise" style={{ animationDelay: '0.08s' }}>{title}</h1>
        {lead && <p className="v2-hero-sub v2-rise" style={{ animationDelay: '0.16s' }}>{lead}</p>}
        {children}
      </div>
    </section>
  );
}

/** رأس قسم: عنوان صغير + عنوان + وصف. */
export function SectionHead({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <Reveal className="v2-head">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="v2-h2">{title}</h2>
      {lead && <p className="v2-lead">{lead}</p>}
    </Reveal>
  );
}

/** الدعوة الأخيرة الموحّدة: زر أساسي واحد (العرض التجريبي إن هُيّئ، وإلا إنشاء حساب) + رابط تواصل. */
export async function CtaBand({ title, lead }: { title?: string; lead?: string }) {
  const { t } = await getT();
  const demoEnabled = !!process.env.DEMO_LOGIN_EMAIL;
  return (
    <section className="v2-cta">
      <div className="v2-wrap v2-cta-inner">
        <Reveal>
          <h2>{title ?? t('cta.title')}</h2>
          <p>{lead ?? t('cta.lead')}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="v2-actions">
            <a href={demoEnabled ? '/api/auth/demo' : '/signup'} className="v2-btn v2-btn-light">{t(demoEnabled ? 'hero.cta.demo' : 'hero.cta.explore')}</a>
            <Link href="/contact" className="v2-link v2-link-onDeep">{t('cta.contact')} <span className="v2-arrow" aria-hidden="true">←</span></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
