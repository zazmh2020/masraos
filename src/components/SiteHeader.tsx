'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LogoMark } from '@/components/Logo';

const links = [
  { href: '#home', label: 'الرئيسية' },
  { href: '#about', label: 'عن مسرى' },
  { href: '#systems', label: 'الأنظمة' },
  { href: '#features', label: 'المميزات' },
  { href: '#audiences', label: 'الجهات' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '#contact', label: 'تواصل معنا' },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Watch which section is currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    links.forEach((link) => {
      const id = link.href.substring(1);
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="التنقل الرئيسي">
        <a href="#home" className="nav-brand" aria-label="مسرى">
          <LogoMark size={26} className="nav-brand-logo" />
          <span className="nav-brand-name">مسرى</span>
        </a>

        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={activeSection === link.href.substring(1) ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <Link className="nav-login" href="/login">تسجيل الدخول</Link>
          <button
            className="nav-menu-btn"
            aria-label="القائمة"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="22" height="16" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1h22M1 9h22M1 17h22" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
