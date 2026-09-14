'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { InboxNotification } from '@/lib/inbox';

const ICON: Record<string, string> = {
  member: '👤', announcement: '📣', task: '✅', request: '📝', donation: '💛', student: '🎓',
};

export default function NotificationsList({ notifications, storageKey }: { notifications: InboxNotification[]; storageKey: string }) {
  const { t, locale } = useLocale();
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const [seen, setSeen] = useState(0);

  useEffect(() => {
    // قراءة التخزين المحلي تتم بعد التركيب لتفادي عدم تطابق SSR
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setSeen(Number(localStorage.getItem(`${storageKey}_seen_notif`)) || 0); } catch { /* */ }
  }, [storageKey]);

  function markAll() {
    const now = Date.now();
    try { localStorage.setItem(`${storageKey}_seen_notif`, String(now)); } catch { /* */ }
    setSeen(now);
  }

  const unread = notifications.filter((n) => new Date(n.time).getTime() > seen).length;

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-outline" disabled={unread === 0} onClick={markAll}>{t('notif.markAll')}</button>
      </div>
      {notifications.length === 0 ? (
        <div className="org-empty">{t('notif.none')}</div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => {
            const isUnread = new Date(n.time).getTime() > seen;
            return (
              <div key={n.id} className={`notif-row ${isUnread ? 'is-unread' : ''}`}>
                <span className="notif-ic">{ICON[n.type] ?? '📣'}</span>
                <span className="notif-tx">{n.title}</span>
                <time className="notif-time">{fmt.format(new Date(n.time))}</time>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
