'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Ev = { id: string; title: string; details: string | null; location: string | null; startAt: string; endAt: string | null };

export default function EventsView({ events, canManage }: { events: Ev[]; canManage: boolean }) {
  const { t, locale } = useLocale();
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const res = await fetch('/api/org/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, details, location, startAt, endAt: endAt || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setTitle(''); setDetails(''); setLocation(''); setStartAt(''); setEndAt(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm(t('ev.deleteConfirm'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/org/events/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } finally { setBusy(false); }
  }

  // الوقت الحالي لتصنيف الفعاليات (قادمة/منتهية) عند كل عرض
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.endAt ?? e.startAt).getTime() >= now);
  const past = events.filter((e) => new Date(e.endAt ?? e.startAt).getTime() < now);

  const card = (e: Ev, isPast: boolean) => (
    <article key={e.id} className={`org-card ev-card ${isPast ? 'is-past' : ''}`}>
      <div className="ev-date">
        <span className="ev-day">{new Date(e.startAt).getDate()}</span>
        <span className="ev-mon">{new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short' }).format(new Date(e.startAt))}</span>
      </div>
      <div className="ev-body">
        <h3>{e.title}</h3>
        <div className="org-card-meta"><span>{fmt.format(new Date(e.startAt))}</span>{e.location && <span>📍 {e.location}</span>}</div>
        {e.details && <p className="org-card-desc">{e.details}</p>}
      </div>
      {canManage && <button className="org-btn org-btn-danger" disabled={busy} onClick={() => remove(e.id)}>{t('view.delete')}</button>}
    </article>
  );

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('ev.new')}
          </button>
        )}
      </div>
      {error && <div className="org-alert">{error}</div>}
      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field">
            <label htmlFor="e-title">{t('ev.title')}</label>
            <input id="e-title" value={title} onChange={(ev) => setTitle(ev.target.value)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="e-start">{t('ev.start')}</label>
              <input id="e-start" type="datetime-local" value={startAt} onChange={(ev) => setStartAt(ev.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="e-end">{t('ev.end')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="e-end" type="datetime-local" value={endAt} onChange={(ev) => setEndAt(ev.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="e-loc">{t('ev.location')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="e-loc" value={location} onChange={(ev) => setLocation(ev.target.value)} />
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="e-det">{t('ev.details')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="e-det" rows={2} value={details} onChange={(ev) => setDetails(ev.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busy}>{busy ? t('form.saving') : t('ev.create')}</button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="org-empty">{t('ev.none')}</div>
      ) : (
        <>
          <h2 className="org-section-title">{t('ev.upcoming')}</h2>
          {upcoming.length === 0 ? <p className="org-panel-sub">{t('ev.noUpcoming')}</p> : <div className="org-cards ev-list">{upcoming.map((e) => card(e, false))}</div>}
          {past.length > 0 && (
            <>
              <h2 className="org-section-title">{t('ev.past')}</h2>
              <div className="org-cards ev-list">{past.map((e) => card(e, true))}</div>
            </>
          )}
        </>
      )}
    </>
  );
}
