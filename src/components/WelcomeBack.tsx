'use client';

import { useEffect, useState } from 'react';

/**
 * شاشة ترحيب تظهر عند كل دخول للموقع وعند تحديث الصفحة (تُعاد مع كل تحميل كامل
 * للّوحة). تعرض اسم المستخدم بحركات ولمسات تصميمية ثم تتلاشى. النقر يُنهيها.
 */
export default function WelcomeBack({ name, greeting }: { name: string; greeting: string }) {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hold = reduce ? 650 : 2000;
    const leaveT = setTimeout(() => setLeaving(true), hold);
    const doneT = setTimeout(() => setShow(false), hold + 650);
    return () => { clearTimeout(leaveT); clearTimeout(doneT); };
  }, []);

  if (!show) return null;

  return (
    <div className={`wlc ${leaving ? 'is-leaving' : ''}`} role="presentation" onClick={() => setLeaving(true)}>
      <span className="wlc-glow wlc-glow-1" />
      <span className="wlc-glow wlc-glow-2" />
      <div className="wlc-stage">
        <span className="wlc-spark">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /></svg>
        </span>
        <p className="wlc-greeting">{greeting}</p>
        <h1 className="wlc-name">{name}</h1>
        <span className="wlc-line" />
        <span className="wlc-brand">مسرى · Masra</span>
      </div>
    </div>
  );
}
