'use client';

import { useState, type FormEvent } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import '@/styles/landing.css';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // مؤقت — سيُربط لاحقاً بواجهة الإرسال الحقيقية
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-header">
          <div className="page-header-inner">
            <Reveal>
              <span className="eyebrow">تواصل معنا</span>
              <h1>لنتحدّث</h1>
              <p>
                لديك سؤال، اقتراح، أو تريد إنشاء مساحة لمؤسستك؟ نحن هنا.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section section-tint">
          <div className="contact-grid">
            <Reveal>
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-item-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="16" height="12" rx="2" />
                      <path d="M2 6l8 5 8-5" />
                    </svg>
                  </div>
                  <div>
                    <strong>البريد الإلكتروني</strong>
                    <span>hello@masraos.com</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h4l2 5-2 1.5c1 2 2.5 3.5 4.5 4.5l1.5-2 5 2v4a1 1 0 01-1 1A15 15 0 013 5a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <div>
                    <strong>الهاتف</strong>
                    <span dir="ltr">+90 000 000 0000</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 18s-6-5.5-6-10a6 6 0 0112 0c0 4.5-6 10-6 10z" />
                      <circle cx="10" cy="8" r="2" />
                    </svg>
                  </div>
                  <div>
                    <strong>الموقع</strong>
                    <span>إسطنبول، تركيا</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="10" r="8" />
                      <path d="M10 6v4l3 2" />
                    </svg>
                  </div>
                  <div>
                    <strong>أوقات العمل</strong>
                    <span>الأحد – الخميس، 9 صباحاً – 6 مساءً</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-row">
                  <div>
                    <label htmlFor="name">الاسم الكامل</label>
                    <input id="name" name="name" type="text" required />
                  </div>
                  <div>
                    <label htmlFor="org">اسم المؤسسة</label>
                    <input id="org" name="org" type="text" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email">البريد الإلكتروني</label>
                  <input id="email" name="email" type="email" dir="ltr" required />
                </div>

                <div>
                  <label htmlFor="subject">الموضوع</label>
                  <input id="subject" name="subject" type="text" required />
                </div>

                <div>
                  <label htmlFor="message">رسالتك</label>
                  <textarea id="message" name="message" required />
                </div>

                <button className="btn btn-primary" type="submit">
                  {sent ? 'تم الإرسال ✓' : 'إرسال الرسالة'}
                </button>
              </form>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
