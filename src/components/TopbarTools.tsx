'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InboxMessage, InboxNotification } from '@/lib/inbox';
import LangToggle from '@/components/LangToggle';
import { useT } from '@/lib/i18n/LocaleProvider';

export interface SearchItem {
  label: string;
  href: string;
  section?: string;
}

interface Props {
  searchItems: SearchItem[];
  messages: InboxMessage[];
  notifications: InboxNotification[];
  storageKey: string; // للفصل بين الجهة والأدمن في تتبّع «المقروء»
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString('ar-u-nu-latn');
}

type Panel = 'search' | 'messages' | 'notif' | null;

const NOTIF_ICON: Record<string, string> = {
  member: '👤', announcement: '📣', task: '✅', request: '📝', donation: '💛', student: '🎓',
};

export default function TopbarTools({ searchItems, messages, notifications, storageKey }: Props) {
  const router = useRouter();
  const t = useT();
  const [panel, setPanel] = useState<Panel>(null);
  const [q, setQ] = useState('');
  const [seenMsg, setSeenMsg] = useState(0);
  const [seenNotif, setSeenNotif] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setSeenMsg(Number(localStorage.getItem(`${storageKey}_seen_msg`)) || 0);
        setSeenNotif(Number(localStorage.getItem(`${storageKey}_seen_notif`)) || 0);
      } catch {
        /* تجاهل */
      }
    });
    return () => cancelAnimationFrame(id);
  }, [storageKey]);

  // إغلاق عند النقر خارج المكوّن
  useEffect(() => {
    if (!panel) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPanel(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [panel]);

  const results = useMemo(() => {
    const term = q.trim();
    if (!term) return [];
    return searchItems.filter((it) => it.label.includes(term)).slice(0, 8);
  }, [q, searchItems]);

  const unreadMsg = messages.filter((m) => new Date(m.time).getTime() > seenMsg).length;
  const unreadNotif = notifications.filter((n) => new Date(n.time).getTime() > seenNotif).length;

  function openMessages() {
    setPanel((p) => (p === 'messages' ? null : 'messages'));
    const now = Date.now();
    setSeenMsg(now);
    try { localStorage.setItem(`${storageKey}_seen_msg`, String(now)); } catch { /* */ }
  }
  function openNotif() {
    setPanel((p) => (p === 'notif' ? null : 'notif'));
    const now = Date.now();
    setSeenNotif(now);
    try { localStorage.setItem(`${storageKey}_seen_notif`, String(now)); } catch { /* */ }
  }
  function go(href: string) {
    setPanel(null);
    setQ('');
    router.push(href);
  }

  return (
    <div className="tbt" ref={wrapRef}>
      {/* البحث */}
      <div className={`tbt-search ${panel === 'search' && results.length ? 'is-open' : ''}`}>
        <svg className="tbt-search-ic" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" /></svg>
        <input
          type="search"
          value={q}
          placeholder={t('tb.search')}
          onChange={(e) => { setQ(e.target.value); setPanel('search'); }}
          onFocus={() => setPanel('search')}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0].href); }}
          aria-label={t('tb.search')}
        />
        {panel === 'search' && q.trim() && (
          <div className="tbt-drop tbt-results">
            {results.length ? (
              results.map((r) => (
                <button key={r.href} className="tbt-result" onClick={() => go(r.href)}>
                  <span>{r.label}</span>
                  {r.section && <span className="tbt-result-sec">{r.section}</span>}
                </button>
              ))
            ) : (
              <div className="tbt-empty">{t('tb.noResults')} «{q.trim()}»</div>
            )}
          </div>
        )}
      </div>

      {/* الرسائل */}
      <div className="tbt-slot">
        <button className="tbt-btn" onClick={openMessages} aria-label={t('tb.messages')} aria-expanded={panel === 'messages'}>
          <svg width="19" height="19" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h16v11H7l-4 3z" /></svg>
          {unreadMsg > 0 && <span className="tbt-dot">{unreadMsg}</span>}
        </button>
        {panel === 'messages' && (
          <div className="tbt-drop tbt-inbox">
            <div className="tbt-inbox-head">{t('tb.messages')}</div>
            {messages.length ? messages.map((m) => (
              <div key={m.id} className="tbt-msg">
                <div className="tbt-msg-top"><span className="tbt-msg-title">{m.pinned ? '📌 ' : ''}{m.title}</span><span className="tbt-time">{timeAgo(m.time)}</span></div>
                <p className="tbt-msg-body">{m.body}</p>
              </div>
            )) : <div className="tbt-empty">{t('tb.noMessages')}</div>}
          </div>
        )}
      </div>

      {/* الجرس */}
      <div className="tbt-slot">
        <button className="tbt-btn" onClick={openNotif} aria-label={t('tb.notifications')} aria-expanded={panel === 'notif'}>
          <svg width="19" height="19" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3a5 5 0 0 0-5 5v3l-2 3h14l-2-3V8a5 5 0 0 0-5-5z" /><path d="M9 18a2 2 0 0 0 4 0" /></svg>
          {unreadNotif > 0 && <span className="tbt-dot">{unreadNotif}</span>}
        </button>
        {panel === 'notif' && (
          <div className="tbt-drop tbt-inbox">
            <div className="tbt-inbox-head">{t('tb.notifications')}</div>
            {notifications.length ? notifications.map((n) => (
              <div key={n.id} className="tbt-notif">
                <span className={`tbt-notif-ic ${n.type}`}>{NOTIF_ICON[n.type] ?? '📣'}</span>
                <div className="tbt-notif-tx"><span>{n.title}</span><span className="tbt-time">{timeAgo(n.time)}</span></div>
              </div>
            )) : <div className="tbt-empty">{t('tb.noNotifications')}</div>}
          </div>
        )}
      </div>

      <LangToggle />
    </div>
  );
}
