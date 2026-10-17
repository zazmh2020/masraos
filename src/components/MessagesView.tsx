'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Convo = { userId: string; name: string; last: string; at: string; unread: number };
type Msg = { id: string; body: string; mine: boolean; at: string };
type Member = { id: string; name: string };

export default function MessagesView({
  base, members, conversations, activeId, activeName, thread,
}: {
  base: string; members: Member[]; conversations: Convo[];
  activeId: string | null; activeName: string | null; thread: Msg[];
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const timeFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
  const dayFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric' });

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // تعليم المحادثة كمقروءة عند فتحها + التمرير لآخر رسالة
  useEffect(() => {
    if (!activeId) return;
    fetch('/api/org/messages/read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withUserId: activeId }),
    }).catch(() => {});
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [activeId, thread.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/org/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: activeId, body }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.netErr'));
      else { setText(''); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusy(false); }
  }

  return (
    <div className="msg-wrap">
      <aside className="msg-list">
        <div className="msg-new">
          <label htmlFor="msg-pick" className="org-hint">{t('msg.startNew')}</label>
          <select id="msg-pick" className="org-inline-select" value="" onChange={(e) => e.target.value && router.push(`${base}?with=${e.target.value}`)}>
            <option value="">{t('msg.pickMember')}</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        {conversations.length === 0 ? (
          <p className="org-hint msg-empty-list">{t('msg.noConvos')}</p>
        ) : (
          <div className="msg-convos">
            {conversations.map((c) => (
              <Link key={c.userId} href={`${base}?with=${c.userId}`} className={`msg-convo ${c.userId === activeId ? 'is-active' : ''}`}>
                <span className="msg-avatar" aria-hidden="true">{c.name.slice(0, 1)}</span>
                <span className="msg-convo-main">
                  <span className="msg-convo-top"><strong>{c.name}</strong><span className="msg-convo-time">{dayFmt.format(new Date(c.at))}</span></span>
                  <span className="msg-convo-last">{c.last}</span>
                </span>
                {c.unread > 0 && <span className="msg-unread"><span className="num-glyph">{c.unread}</span></span>}
              </Link>
            ))}
          </div>
        )}
      </aside>

      <section className="msg-thread">
        {!activeId ? (
          <div className="org-empty msg-pick-hint">{t('msg.pickHint')}</div>
        ) : (
          <>
            <header className="msg-thread-head"><span className="msg-avatar" aria-hidden="true">{activeName?.slice(0, 1)}</span><strong>{activeName}</strong></header>
            <div className="msg-bubbles">
              {thread.length === 0 ? (
                <p className="org-hint msg-start">{t('msg.startHint')}</p>
              ) : thread.map((m) => (
                <div key={m.id} className={`msg-bubble ${m.mine ? 'mine' : 'theirs'}`}>
                  <span className="msg-body">{m.body}</span>
                  <span className="msg-time">{timeFmt.format(new Date(m.at))}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            {error && <div className="org-alert">{error}</div>}
            <form className="msg-compose" onSubmit={send}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('msg.placeholder')} maxLength={4000} />
              <button type="submit" className="org-btn org-btn-primary" disabled={busy || !text.trim()}>{t('msg.send')}</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
