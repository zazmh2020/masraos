'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CAP_GROUPS } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Role = { id: string; name: string; permissions: string[]; memberCount: number };

export default function CustomRolesView({ roles }: { roles: Role[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | '__new' | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [caps, setCaps] = useState<Set<string>>(new Set());

  function open(role?: Role) {
    setError('');
    if (role) { setEditing(role.id); setName(role.name); setCaps(new Set(role.permissions)); }
    else { setEditing('__new'); setName(''); setCaps(new Set()); }
  }
  function close() { setEditing(null); setName(''); setCaps(new Set()); }

  function toggle(cap: string) {
    setCaps((prev) => { const n = new Set(prev); if (n.has(cap)) n.delete(cap); else n.add(cap); return n; });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    const isNew = editing === '__new';
    const url = isNew ? '/api/org/roles' : `/api/org/roles/${editing}`;
    try {
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, permissions: [...caps] }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr'));
      else { close(); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm(t('crole.deleteConfirm'))) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/org/roles/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusy(false); }
  }

  return (
    <div className="crole-wrap">
      <div className="org-toolbar">
        <h3 className="crole-h">{t('crole.title')}</h3>
        <span className="org-toolbar-spacer" />
        {editing === null && <button className="org-btn org-btn-primary" onClick={() => open()}>{t('crole.new')}</button>}
      </div>
      <p className="crole-intro">{t('crole.intro')}</p>

      {error && <div className="org-alert">{error}</div>}

      {editing !== null && (
        <form className="org-form crole-form" onSubmit={save}>
          <div className="org-field">
            <label htmlFor="cr-name">{t('crole.name')}</label>
            <input id="cr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('crole.namePh')} required />
          </div>
          <div className="crole-caps">
            {CAP_GROUPS.map((g) => (
              <div key={g.labelKey} className="crole-group">
                <span className="crole-group-name">{t(g.labelKey)}</span>
                <div className="crole-group-caps">
                  {g.caps.map((c) => (
                    <label key={c.key} className={`crole-cap ${caps.has(c.key) ? 'is-on' : ''}`}>
                      <input type="checkbox" checked={caps.has(c.key)} onChange={() => toggle(c.key)} />
                      {t(`roles.level.${c.kind}`)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busy}>{busy ? t('form.saving') : t('crole.save')}</button>
            <button type="button" className="org-btn org-btn-ghost" onClick={close}>{t('shell.cancel')}</button>
          </div>
        </form>
      )}

      {roles.length === 0 ? (
        editing === null && <div className="org-empty"><IconShape name="administration" variant="soft" size="xl" /><p>{t('crole.none')}</p></div>
      ) : (
        <div className="crole-list">
          {roles.map((r) => (
            <div key={r.id} className="crole-item">
              <div className="crole-item-main">
                <strong>{r.name}</strong>
                <span className="crole-item-meta">{t('crole.capsCount', { n: r.permissions.length })} · {t('crole.members', { n: r.memberCount })}</span>
              </div>
              <div className="crole-item-actions">
                <button className="org-btn" disabled={busy} onClick={() => open(r)}>{t('view.edit')}</button>
                <button className="org-btn org-btn-danger" disabled={busy} onClick={() => remove(r.id)}>{t('view.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
