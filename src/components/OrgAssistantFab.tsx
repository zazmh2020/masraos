'use client';

import { useState } from 'react';
import AssistantChat from '@/components/AssistantChat';
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
              <span className="oaf-spark" aria-hidden="true">✦</span>
              {t('onav.assistant')}
            </span>
            <button className="oaf-x" onClick={() => setOpen(false)} aria-label={t('shell.cancel')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
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
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
        ) : (
          <span className="oaf-fab-spark" aria-hidden="true">✦</span>
        )}
      </button>
    </div>
  );
}
