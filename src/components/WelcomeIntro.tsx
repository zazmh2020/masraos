'use client';

import { useEffect, useState } from 'react';
import '@/styles/intro.css';

/**
 * مقدّمة ترحيبية تظهر مرّة واحدة عند دخول الموقع في الجلسة، ثم لا تتكرّر
 * مع التنقّل أو التحديث حتى تُغلق نافذة المتصفّح وتُفتح من جديد.
 * (تُحفظ في sessionStorage.) تبدأ ظاهرة لتفادي وميض المحتوى خلفها.
 */
export default function WelcomeIntro() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // ظهرت مسبقًا في هذه الجلسة؟ لا تكرّرها
    let seen = false;
    try { seen = sessionStorage.getItem('midad_intro_seen') === '1'; } catch { seen = false; }
    // قراءة التخزين تتم بعد التركيب لتفادي عدم تطابق SSR
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (seen) { setShow(false); return; }
    try { sessionStorage.setItem('midad_intro_seen', '1'); } catch { /* تجاهل */ }

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const hold = reduce ? 700 : 2100;
    const leaveT = setTimeout(() => setLeaving(true), hold);
    const doneT = setTimeout(() => setShow(false), hold + 650);

    return () => {
      clearTimeout(leaveT);
      clearTimeout(doneT);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`intro ${leaving ? 'is-leaving' : ''}`}
      role="presentation"
      onClick={() => setLeaving(true)}
    >
      <div className="intro-glow intro-glow-1" />
      <div className="intro-glow intro-glow-2" />

      <div className="intro-stage">
        <div className="intro-mark">
          <span className="intro-mark-ar">مسرى</span>
        </div>
        <div className="intro-line" />
        <p className="intro-tagline">من التقنية إلى الأثر</p>
      </div>
    </div>
  );
}
