'use client';

import Reveal from '@/components/Reveal';
import Mockup, { type MockKind } from './Mockup';
import { useT } from '@/lib/i18n/LocaleProvider';
import Icon from '@/components/Icon';

interface Item {
  kind: MockKind;
  k: string;
}

const ITEMS: Item[] = [
  { kind: 'reports', k: 'prod.dashboard' },
  { kind: 'education', k: 'prod.education' },
  { kind: 'education', k: 'prod.hr' },
];

const CHECK = <Icon name="check" size={20} />;

export default function ProductShowcase() {
  const t = useT();
  return (
    <div className="mdl-shows">
      {ITEMS.map((it, i) => (
        <Reveal key={it.k} y={28}>
          {/* صفوف متبادلة: نقطة يمين/صورة يسار، ثم العكس */}
          <div className={`mdl-show-row ${i % 2 ? 'rev' : ''}`}>
            <div className="mdl-show-text">
              <span className="mdl-sd-badge">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t(`${it.k}.t`)}</h3>
              <p>{t(`${it.k}.d`)}</p>
              <ul>{['p1', 'p2', 'p3'].map((p) => <li key={p}>{CHECK}<span>{t(`${it.k}.${p}`)}</span></li>)}</ul>
            </div>
            <div className="mdl-show-media">
              <p className="mdl-preview-caption">{t('mockup.demo')}</p>
              <Mockup kind={it.kind} />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
