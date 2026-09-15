'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import LangToggle from '@/components/LangToggle';
import CurrencyToggle from '@/components/CurrencyToggle';
import { useT } from '@/lib/i18n/LocaleProvider';

const SYSTEMS_MEGA = [
  { icon: 'people/people-users', k: 'mega.sys.people' },
  { icon: 'operations/operations-projects', k: 'mega.sys.projects' },
  { icon: 'finance/finance-donations', k: 'mega.sys.finance', gold: true },
  { icon: 'people/people-beneficiaries', k: 'mega.sys.beneficiaries' },
  { icon: 'analytics/analytics-analytics', k: 'mega.sys.reports' },
  { icon: 'ai/ai-ai-assistant', k: 'mega.sys.ai', gold: true },
];

const JIHAT_MEGA = [
  { icon: 'organization/organization-institution', k: 'mega.jihat.charity' },
  { icon: 'education/education-quran', k: 'mega.jihat.quran', gold: true },
  { icon: 'education/education-education', k: 'mega.jihat.edu' },
  { icon: 'people/people-groups', k: 'mega.jihat.humanitarian' },
];

const chev = (
  <svg className="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5" /></svg>
);

function Mega({ items, href, wide }: { items: typeof SYSTEMS_MEGA; href: string; wide?: boolean }) {
  const t = useT();
  return (
    <div className={`mdl-mega ${wide ? '' : 'narrow'}`}>
      {items.map((it) => (
        <a key={it.k} href={href} className="mdl-mega-item">
          <span className={`mdl-mega-ic ${it.gold ? 'gold' : ''}`}><Icon name={it.icon} size={19} /></span>
          <span className="mdl-mega-tx"><span className="t">{t(`${it.k}.t`)}</span><span className="d">{t(`${it.k}.d`)}</span></span>
        </a>
      ))}
    </div>
  );
}

export default function MasraHeader() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`mdl-header ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="mdl-navbar" aria-label="التنقل الرئيسي">
        <button className="mdl-menu-btn" aria-label="القائمة" onClick={() => setOpen(true)}>
          <svg width="24" height="18" viewBox="0 0 26 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M1 1h24M1 10h24M1 19h24" /></svg>
        </button>
        <a href="#home" className="mdl-brand" aria-label="مسرى">
          <LogoMark size={26} className="mark" />
          <span className="name">{t('brand')}</span>
        </a>

        <div className="mdl-nav-links">
          <a href="#home" className="mdl-nav-link">{t('nav.home')}</a>
          <a href="#platform" className="mdl-nav-link">{t('nav.platform')}</a>
          <div className="mdl-has-menu">
            <a href="#systems" className="mdl-nav-link">{t('nav.systems')} {chev}</a>
            <Mega items={SYSTEMS_MEGA} href="#systems" wide />
          </div>
          <div className="mdl-has-menu">
            <a href="#platform" className="mdl-nav-link">{t('nav.orgs')} {chev}</a>
            <Mega items={JIHAT_MEGA} href="#platform" />
          </div>
          <a href="#ai" className="mdl-nav-link">{t('nav.ai')}</a>
          <a href="#pricing" className="mdl-nav-link">{t('nav.pricing')}</a>
          <a href="#about" className="mdl-nav-link">{t('nav.about')}</a>
        </div>

        <div className="mdl-nav-actions">
          <CurrencyToggle />
          <LangToggle />
          <Link href="/login" className="mdl-btn mdl-btn-white">{t('nav.login')}</Link>
        </div>
      </nav>

      <div className={`mdl-drawer ${open ? 'is-open' : ''}`}>
        <div className="mdl-drawer-scrim" onClick={() => setOpen(false)} />
        <div className="mdl-drawer-panel">
          <div className="mdl-drawer-head">
            <span className="mdl-brand"><LogoMark size={26} className="mark" style={{ color: 'var(--p)' }} /><span className="name" style={{ color: 'var(--dark)' }}>مسرى</span></span>
            <button className="mdl-menu-btn" aria-label="إغلاق" style={{ color: 'var(--text)', display: 'inline-flex' }} onClick={() => setOpen(false)}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l14 14M18 4L4 18" /></svg>
            </button>
          </div>
          {[['#home', 'nav.home'], ['#platform', 'nav.platform'], ['#systems', 'nav.systems'], ['#ai', 'nav.ai'], ['#pricing', 'nav.pricing'], ['#about', 'nav.about']].map(([h, key]) => (
            <a key={key} href={h} onClick={() => setOpen(false)}>{t(key)}</a>
          ))}
          <Link href="/login" className="mdl-btn mdl-btn-primary" onClick={() => setOpen(false)}>{t('nav.login')}</Link>
        </div>
      </div>
    </header>
  );
}
