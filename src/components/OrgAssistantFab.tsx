'use client';

import { useState } from 'react';
import AssistantChat from '@/components/AssistantChat';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

/** زرّ عائم يفتح مساعد مسرى الذكي على أي صفحة داخل المنصّة. */
export default function OrgAssistantFab({
  ready, endpoint, suggestions, placeholder, hint,
}: {
  ready: boolean;
  endpoint?: string;
  suggestions?: string[];
  placeholder?: string;
  hint?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="oaf">
      {open && (
        <div className="oaf-panel" role="dialog" aria-label={t('onav.assistant')}>
          <div className="oaf-head">
            <span className="oaf-title">
              <Icon name="assistant" size={20} className="oaf-spark" />
              {t('onav.assistant')}
            </span>
            <button className="oaf-x" onClick={() => setOpen(false)} aria-label={t('shell.cancel')}>
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className="oaf-body">
            <AssistantChat ready={ready} endpoint={endpoint} suggestions={suggestions} placeholder={placeholder} hint={hint} />
          </div>
        </div>
      )}
      <button
        className={`oaf-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('onav.assistant')}
        title={t('onav.assistant')}
      >
        {open ? (
          <Icon name="close" size={24} />
        ) : (
          <Icon name="assistant" size={24} className="oaf-fab-spark" />
        )}
      </button>
    </div>
  );
}
