'use client';

import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

const STEPS: { k: string; icon: string }[] = [
  { k: 'how.1', icon: 'organization/organization-institution' },
  { k: 'how.2', icon: 'education/education-quran' },
  { k: 'how.3', icon: 'education/education-education' },
  { k: 'how.4', icon: 'analytics/analytics-analytics' },
  { k: 'how.5', icon: 'analytics/analytics-reports' },
];

export default function HowItWorks() {
  const t = useT();
  return (
    <div className="mdl-steps-grid">
      {STEPS.map((s, i) => (
        <Reveal key={s.k} delay={i * 0.06} y={24}>
          <div className="mdl-stepc">
            <div className="mdl-stepc-top">
              <span className="mdl-stepc-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="mdl-stepc-ic"><Icon name={s.icon} size={20} /></span>
            </div>
            <h4>{t(`${s.k}.t`)}</h4>
            <p>{t(`${s.k}.d`)}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
