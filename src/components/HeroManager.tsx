'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LocaleProvider';

export interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  order: number;
  status: string;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
}

const STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];

export default function HeroManager({ initial }: { initial: Slide[] }) {
  const t = useT();
  const router = useRouter();
  const [editing, setEditing] = useState<Slide | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startNew() {
    setError('');
    setEditing({ id: '', title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '', order: initial.length, status: 'DRAFT', startAt: null, endAt: null, enabled: true });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true); setError('');
    const isNew = !editing.id;
    try {
      const res = await fetch(isNew ? '/api/admin/hero' : `/api/admin/hero/${editing.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, startAt: editing.startAt || null, endAt: editing.endAt || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr'));
      else { setEditing(null); router.refresh(); }
    } catch { setError(t('form.netErr')); }
    finally { setBusy(false); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/hero/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false); router.refresh();
  }

  async function del(id: string) {
    if (!window.confirm(t('hero.confirmDelete'))) return;
    setBusy(true);
    await fetch(`/api/admin/hero/${id}`, { method: 'DELETE' });
    setBusy(false); router.refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= initial.length) return;
    const a = initial[i], b = initial[j];
    setBusy(true);
    await Promise.all([
      fetch(`/api/admin/hero/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/hero/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) }),
    ]);
    setBusy(false); router.refresh();
  }

  const set = (k: keyof Slide, v: unknown) => setEditing((s) => (s ? { ...s, [k]: v } : s));

  return (
    <div className="hero-mgr">
      {error && <div className="org-alert" style={{ marginBottom: '0.8rem' }}>{error}</div>}

      {editing ? (
        <form className="admin-form" onSubmit={save}>
          <fieldset>
            <legend>{editing.id ? t('hero.edit') : t('hero.new')}</legend>
            <div className="admin-field">
              <label>{t('hero.f.title')}</label>
              <input value={editing.title} onChange={(e) => set('title', e.target.value)} maxLength={160} required />
            </div>
            <div className="admin-field">
              <label>{t('hero.f.subtitle')}</label>
              <textarea rows={2} value={editing.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} maxLength={400} />
            </div>
            <div className="admin-field">
              <label>{t('hero.f.image')}</label>
              <input dir="ltr" value={editing.imageUrl ?? ''} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" />
            </div>
            <div className="hero-row2">
              <div className="admin-field">
                <label>{t('hero.f.ctaText')}</label>
                <input value={editing.ctaText ?? ''} onChange={(e) => set('ctaText', e.target.value)} maxLength={60} />
              </div>
              <div className="admin-field">
                <label>{t('hero.f.ctaLink')}</label>
                <input dir="ltr" value={editing.ctaLink ?? ''} onChange={(e) => set('ctaLink', e.target.value)} placeholder="/pricing · https://…" />
              </div>
            </div>
            <div className="hero-row2">
              <div className="admin-field">
                <label>{t('hero.f.status')}</label>
                <select value={editing.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`hero.status.${s}`)}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="hero-check"><input type="checkbox" checked={editing.enabled} onChange={(e) => set('enabled', e.target.checked)} /> {t('hero.f.enabled')}</label>
              </div>
            </div>
            <div className="hero-row2">
              <div className="admin-field">
                <label>{t('hero.f.start')}</label>
                <input type="datetime-local" value={(editing.startAt ?? '').slice(0, 16)} onChange={(e) => set('startAt', e.target.value)} />
              </div>
              <div className="admin-field">
                <label>{t('hero.f.end')}</label>
                <input type="datetime-local" value={(editing.endAt ?? '').slice(0, 16)} onChange={(e) => set('endAt', e.target.value)} />
              </div>
            </div>
          </fieldset>
          <div className="admin-form-actions">
            <button type="button" className="btn-admin-outline" onClick={() => setEditing(null)} disabled={busy}>{t('shell.cancel')}</button>
            <button type="submit" className="btn-admin-primary" disabled={busy}>{busy ? t('form.saving') : t('form.save')}</button>
          </div>
        </form>
      ) : (
        <>
          <div className="org-toolbar">
            <span className="org-toolbar-spacer" />
            <button className="btn-admin-primary" onClick={startNew}>{t('hero.new')}</button>
          </div>
          {initial.length === 0 ? (
            <div className="org-empty">{t('hero.none')}</div>
          ) : (
            <div className="hero-list">
              {initial.map((s, i) => (
                <div key={s.id} className={`hero-item ${s.enabled ? '' : 'is-off'}`}>
                  <div className="hero-item-ord">
                    <button className="hero-ord-btn" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={t('hero.moveUp')}>▲</button>
                    <button className="hero-ord-btn" onClick={() => move(i, 1)} disabled={busy || i === initial.length - 1} aria-label={t('hero.moveDown')}>▼</button>
                  </div>
                  <div className="hero-item-main">
                    <strong>{s.title}</strong>
                    {s.subtitle && <span className="hero-item-sub">{s.subtitle}</span>}
                  </div>
                  <span className={`hero-badge st-${s.status}`}>{t(`hero.status.${s.status}`)}</span>
                  <label className="hero-item-toggle" title={t('hero.f.enabled')}>
                    <input type="checkbox" checked={s.enabled} onChange={(e) => patch(s.id, { enabled: e.target.checked })} disabled={busy} />
                  </label>
                  <button className="hero-link-btn" onClick={() => { setError(''); setEditing(s); }}>{t('view.edit')}</button>
                  <button className="hero-link-btn danger" onClick={() => del(s.id)} disabled={busy}>{t('view.delete')}</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
