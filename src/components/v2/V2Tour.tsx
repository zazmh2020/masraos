'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, type KeyboardEvent } from 'react';
import Icon from '@/components/Icon';
import { useLocale, useT } from '@/lib/i18n/LocaleProvider';

const TOOLS = [
  { key: 'students', icon: 'students' },
  { key: 'attendance', icon: 'attendance' },
  { key: 'memorization', icon: 'memorization' },
  { key: 'statistics', icon: 'analytics' },
] as const;

/**
 * جولة المنتج: تبويبات (WAI-ARIA tabs) تبدّل لقطة حقيقية من اللوحة مع وصفها.
 * المؤشّر المنزلق بين التبويبات مقتبس من نمط VengeanceUI `spotlight-navbar` (MIT — https://github.com/Ashutoshx7/VengeanceUI):
 * عنصر واحد بـ layoutId ينتقل بين التبويبات، بلا ارتداد (0.35s).
 */
export default function V2Tour() {
  const t = useT();
  const { locale } = useLocale();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const rtl = locale === 'ar';
  const reduce = useReducedMotion();

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, Home: -active, End: TOOLS.length - 1 - active }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = (active + step + TOOLS.length) % TOOLS.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  const tool = TOOLS[active];
  return (
    <div className="v2-tour">
      <div className="v2-tour-tabs" role="tablist" aria-label={t('v2.tour.label')} onKeyDown={onKey}>
        {TOOLS.map((x, i) => (
          <button key={x.key} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`v2-tab-${x.key}`}
            aria-selected={i === active} aria-controls="v2-tour-panel" tabIndex={i === active ? 0 : -1}
            className="v2-tour-tab" onClick={() => setActive(i)}>
            {i === active && <motion.span layoutId="v2-tab-pill" className="v2-tab-pill" transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.35 }} />}
            <Icon name={x.icon} size={18} tone={i === active ? 'duo' : 'line'} />{t(`v2.tour.${x.key}.t`)}
          </button>
        ))}
      </div>
      <div id="v2-tour-panel" role="tabpanel" aria-labelledby={`v2-tab-${tool.key}`} className="v2-tour-panel">
        <div className="v2-tour-copy">
          <h3>{t(`v2.tour.${tool.key}.t`)}</h3>
          <p>{t(`v2.tour.${tool.key}.d`)}</p>
          <ul className="v2-checks">
            {[1, 2, 3].map((n) => <li key={n}><Icon name="check" size={16} />{t(`v2.tour.${tool.key}.b${n}`)}</li>)}
          </ul>
        </div>
        <figure className="v2-shot">
          <Image key={`${tool.key}-${locale}`} src={`/v2/${tool.key}-${locale}.webp`} width={1400} height={941}
            sizes="(max-width: 960px) 100vw, 760px" alt={t(`v2.tour.${tool.key}.t`)} className="v2-shot-img v2-fade" />
          <figcaption className="v2-tag">{t('v2.shot.tag')}</figcaption>
        </figure>
      </div>
    </div>
  );
}
