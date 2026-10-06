'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Team = {
  id: string; name: string; description: string | null; lead: string | null;
  departmentId: string | null; departmentName: string | null;
};
type Ref = { id: string; name: string };

export default function TeamsView({ teams, departments }: { teams: Team[]; departments: Ref[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [lead, setLead] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/resources/teams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lead, description, departmentId: departmentId || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setName(''); setLead(''); setDescription(''); setDepartmentId(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('res.team.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/teams/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('res.team.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="tm-name">{t('res.team.name')}</label>
              <input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="tm-lead">{t('res.team.lead')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="tm-lead" value={lead} onChange={(e) => setLead(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="tm-dept">{t('view.unitShort')}</label>
              <select id="tm-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select></div>
          </div>
          <div className="org-field"><label htmlFor="tm-desc">{t('res.team.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="tm-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('res.team.create')}
            </button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="org-empty"><IconShape name="group" variant="soft" size="xl" /><p>{t('res.team.none')}</p></div>
      ) : (
        <div className="org-cards">
          {teams.map((tm) => (
            <article key={tm.id} className="org-card">
              <div className="org-card-head">
                <h3>{tm.name}</h3>
                {tm.departmentName && <span className="org-chip">{tm.departmentName}</span>}
              </div>
              {tm.lead && <span className="org-card-tag">{t('res.team.leadLabel', { v: tm.lead })}</span>}
              {tm.description && <p className="org-card-desc">{tm.description}</p>}
              <div className="org-card-actions">
                <span className="org-toolbar-spacer" />
                <button className="org-btn org-btn-danger" disabled={busyId === tm.id} onClick={() => remove(tm.id)}>{t('view.delete')}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
