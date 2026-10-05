'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';
import Mockup, { type MockKind } from './Mockup';
import { useT } from '@/lib/i18n/LocaleProvider';

interface Sys {
  icon: string;
  k: string;
  kind: MockKind;
  cat: string;
  isNew?: boolean;
}

const SYSTEMS: Sys[] = [
  { icon: 'education/education-education', k: 'sysh.education', kind: 'education', cat: 'sysh.cat.education' },
  { icon: 'organization/organization-institution', k: 'sysh.org', kind: 'org', cat: 'sysh.cat.admin' },
  { icon: 'analytics/analytics-analytics', k: 'sysh.reports', kind: 'reports', cat: 'sysh.cat.analytics' },
];

export default function SystemsShowcase() {
  const t = useT();
  const [active, setActive] = useState(0);
  const sys = SYSTEMS[active];

  return (
    <div className="mdl-sys">
      <div className="mdl-sys-list">
        {SYSTEMS.map((s, i) => (
          <button
            key={s.k}
            type="button"
            aria-pressed={i === active}
            className={`mdl-sys-item ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="mdl-sys-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="mdl-sys-ic"><Icon name={s.icon} size={18} /></span>
            <span className="mdl-sys-label">
              {t(`${s.k}.label`)}
              <span className="mdl-sys-cat">{t(s.cat)}</span>
            </span>
            {s.isNew && <span className="mdl-sys-flag">{t('common.new')}</span>}
          </button>
        ))}
      </div>

      <div className="mdl-sys-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Mockup kind={sys.kind} />
          </motion.div>
        </AnimatePresence>
        <div className="mdl-sys-desc">
          <Icon name={sys.icon} size={18} />
          <span>{t(`${sys.k}.desc`)}</span>
        </div>
      </div>
    </div>
  );
}
