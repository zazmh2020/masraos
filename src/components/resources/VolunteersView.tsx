'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { VOLUNTEER_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Volunteer = { id: string; name: string; phone: string | null; skills: string | null; status: string };

export default function VolunteersView({ volunteers }: { volunteers: Volunteer[] }) {
  const { t } = useLocale();
  const statusLabel = (v: string) => t(`status.volunteer.${v}`);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/resources/volunteers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, skills, status }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setName(''); setPhone(''); setSkills(''); setStatus('ACTIVE'); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/volunteers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('res.vol.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/volunteers/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('res.vol.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="v-name">{t('res.vol.name')}</label>
              <input id="v-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="v-phone">{t('res.vol.phone')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="v-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="v-status">{t('view.status')}</label>
              <select id="v-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {VOLUNTEER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select></div>
          </div>
          <div className="org-field"><label htmlFor="v-skills">{t('res.vol.skills')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="v-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t('res.vol.skillsPlaceholder')} /></div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('res.vol.create')}
            </button>
          </div>
        </form>
      )}

      {volunteers.length === 0 ? (
        <div className="org-empty"><IconShape name="heart" variant="soft" size="xl" /><p>{t('res.vol.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr><th>{t('res.vol.colVolunteer')}</th><th>{t('res.vol.colSkills')}</th><th>{t('view.status')}</th><th></th></tr></thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.name}</strong>{v.phone && <small dir="ltr">{v.phone}</small>}</td>
                  <td>{v.skills ?? '—'}</td>
                  <td>
                    <select className="org-inline-select" value={v.status} disabled={busyId === v.id}
                      onChange={(e) => patch(v.id, { status: e.target.value })}>
                      {VOLUNTEER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-danger" disabled={busyId === v.id} onClick={() => remove(v.id)}>{t('view.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
