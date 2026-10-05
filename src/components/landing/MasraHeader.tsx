'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '@/components/Logo';
import Icon from '@/components/Icon';
import LangToggle from '@/components/LangToggle';
import CurrencyToggle from '@/components/CurrencyToggle';
import { useT } from '@/lib/i18n/LocaleProvider';

const LINKS = [
  ['/#platform', 'nav.platform'],
  ['/#how-it-works', 'nav.journey'],
  ['/#roles', 'nav.roles'],
  ['/#pricing', 'nav.pricing'],
  ['/contact', 'nav.contact'],
];

export default function MasraHeader() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function closeMenu() {
    drawer.current?.close();
  }

  return (
    <header className={`mdl-header ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="mdl-navbar" aria-label={t('nav.menu')}>
        <button ref={trigger} type="button" className="mdl-menu-btn" aria-label={t('nav.menu')} aria-expanded={open} aria-controls="marketing-navigation" onClick={() => { drawer.current?.showModal(); setOpen(true); }}>
          <Icon name="menu" size={24} />
        </button>
        <Link href="/#home" className="mdl-brand" aria-label={t('brand')}>
          <LogoMark size={26} className="mark" /><span className="name">{t('brand')}</span>
        </Link>
        <div className="mdl-nav-links">
          {LINKS.map(([href, key]) => <Link key={key} href={href} className="mdl-nav-link">{t(key)}</Link>)}
        </div>
        <div className="mdl-nav-actions">
          <CurrencyToggle /><LangToggle />
          <Link href="/login" className="mdl-nav-link mdl-nav-login">{t('nav.login')}</Link>
          <Link href="/signup" className="mdl-btn mdl-btn-primary">{t('home.cta.signup')}</Link>
        </div>
      </nav>
      <dialog id="marketing-navigation" ref={drawer} className="mdl-mobile-dialog" aria-label={t('nav.menu')} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={e => { if (e.target === e.currentTarget) closeMenu(); }}>
        <div className="mdl-mobile-links">
          <div className="mdl-drawer-head">
            <span className="mdl-brand"><LogoMark size={26} className="mark" /><span className="name">{t('brand')}</span></span>
            <button type="button" className="mdl-btn" onClick={closeMenu}>{t('nav.closeMenu')}</button>
          </div>
          {LINKS.map(([href, key]) => <Link key={key} href={href} onClick={closeMenu}>{t(key)}</Link>)}
          <Link href="/login" onClick={closeMenu}>{t('nav.login')}</Link>
          <Link href="/signup" className="mdl-btn mdl-btn-primary" onClick={closeMenu}>{t('home.cta.signup')}</Link>
        </div>
      </dialog>
    </header>
  );
}
