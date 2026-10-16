'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

const WELCOME_COOKIE = 'midad_welcome';
let welcomePending = false; // أُخذت العلامة ولم يُعرض الترحيب بعد

/** يحذف علامة الترحيب بكل نطاقات المضيف الممكنة (تُضبط على نطاق الجذر عند الدخول). */
function consumeWelcomeCookie() {
  const parts = window.location.hostname.split('.');
  document.cookie = `${WELCOME_COOKIE}=; Max-Age=0; path=/`;
  for (let i = 0; i < parts.length - 1; i++) {
    document.cookie = `${WELCOME_COOKIE}=; Max-Age=0; path=/; domain=${parts.slice(i).join('.')}`;
  }
}

/**
 * شاشة ترحيب تظهر مرة واحدة بعد تسجيل الدخول فقط (علامة midad_welcome التي يضعها
 * مسار الدخول)، لا مع كل تحديث للصفحة — كي لا تحجب اللوحة في الاستخدام اليومي.
 * تتلاشى سريعًا، والنقر أو Escape يُنهيها. ليست عنوانًا للصفحة (لا h1).
 */
export default function WelcomeBack({ name, greeting }: { name: string; greeting: string }) {
  const t = useT();
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // الحالة على مستوى الوحدة لا الكوكي وحده: React (Strict Mode) قد يشغّل التأثير مرتين،
    // فتحذف المرة الأولى الكوكي ويجب ألا تفقد المرة الثانية الترحيب.
    if (document.cookie.split('; ').some((c) => c.startsWith(`${WELCOME_COOKIE}=`))) {
      consumeWelcomeCookie();
      welcomePending = true;
    }
    if (!welcomePending) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hold = reduce ? 500 : 1200;
    // تأجيل الإظهار لدورة لاحقة يتجنّب setState متزامنًا داخل التأثير
    const showT = setTimeout(() => setShow(true), 0);
    const leaveT = setTimeout(() => setLeaving(true), hold);
    const doneT = setTimeout(() => { setShow(false); welcomePending = false; }, hold + 500);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLeaving(true); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(showT); clearTimeout(leaveT); clearTimeout(doneT); window.removeEventListener('keydown', onKey); };
  }, []);

  if (!show) return null;

  return (
    <div className={`wlc ${leaving ? 'is-leaving' : ''}`} role="presentation" onClick={() => setLeaving(true)}>
      <span className="wlc-glow wlc-glow-1" />
      <span className="wlc-glow wlc-glow-2" />
      <div className="wlc-stage">
        <span className="wlc-spark">
          <Icon name="assistant" size={48} />
        </span>
        <p className="wlc-greeting">{greeting}</p>
        <p className="wlc-name">{name}</p>
        <span className="wlc-line" />
        <span className="wlc-brand">{t('brand')}</span>
      </div>
    </div>
  );
}
