'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '@/components/Logo';
import Icon from '@/components/Icon';
import LangToggle from '@/components/LangToggle';
import CurrencyToggle from '@/components/CurrencyToggle';
import { useT } from '@/lib/i18n/LocaleProvider';

// روابط مطلقة (‎/#قسم‎) لتعمل من الرئيسية وأي صفحة — نفس أقسام الرأس السابق
const LINKS = [
  ['/#systems', 'nav.platform'],
  ['/#how-it-works', 'nav.journey'],
  ['/#roles', 'nav.roles'],
  ['/#pricing', 'nav.pricing'],
  ['/contact', 'nav.contact'],
];

type Announcement = { text: string; link: string | null } | null;

/** شريط الإعلان (من لوحة المالك) — نص ثابت هادئ بلا حركة مستمرّة. */
function AnnounceBar({ a }: { a: NonNullable<Announcement> }) {
  if (!a.link) return <div className="v2-announce" role="status"><span>{a.text}</span></div>;
  return a.link.startsWith('/')
    ? <Link href={a.link} className="v2-announce is-link"><span>{a.text}</span></Link>
    : <a href={a.link} className="v2-announce is-link" target="_blank" rel="noopener noreferrer"><span>{a.text}</span></a>;
}

/** رأس الموقع: شفاف فوق الواجهة الأولى، صلب بنفسجي عميق عند التمرير، ودرج للجوال. يُطوى شريط الإعلان عند التمرير. */
export default function V2Header({ announcement = null }: { announcement?: Announcement }) {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => drawer.current?.close();

  return (
    <header className={`v2-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#main" className="v2-skip">{t('v2.skip')}</a>
      {announcement && <AnnounceBar a={announcement} />}
      <nav className="v2-nav v2-wrap" aria-label={t('nav.menu')}>
        <Link href="/" className="v2-brand" aria-label={t('brand')}>
          <LogoMark size={26} /><span>{t('brand')}</span>
        </Link>
        <div className="v2-nav-links">
          {LINKS.map(([href, key]) => <a key={key} href={href}>{t(key)}</a>)}
        </div>
        <div className="v2-nav-actions">
          <CurrencyToggle /><LangToggle />
          <Link href="/login" className="v2-btn v2-btn-onDeep">{t('nav.login')}</Link>
          <button ref={trigger} type="button" className="v2-menu-btn" aria-label={t('nav.menu')} aria-expanded={open} aria-controls="v2-menu"
            onClick={() => { drawer.current?.showModal(); setOpen(true); }}>
            <Icon name="menu" size={22} />
          </button>
        </div>
      </nav>
      <dialog id="v2-menu" ref={drawer} className="v2-drawer" aria-label={t('nav.menu')}
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="v2-drawer-panel">
          <div className="v2-drawer-head">
            <span className="v2-brand"><LogoMark size={26} /><span>{t('brand')}</span></span>
            <button type="button" className="v2-icon-btn" onClick={close} aria-label={t('nav.closeMenu')}><Icon name="close" size={20} /></button>
          </div>
          {LINKS.map(([href, key]) => <a key={key} href={href} onClick={close}>{t(key)}</a>)}
          <Link href="/login" className="v2-btn v2-btn-primary" onClick={close}>{t('nav.login')}</Link>
        </div>
      </dialog>
    </header>
  );
}
