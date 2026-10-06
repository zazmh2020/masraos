'use client';

import { IconShape } from '@/components/Icon';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Teacher = {
  id: string; name: string; phone: string | null; specialization: string | null;
  isActive: boolean; halaqatCount: number; userId: string | null;
};
type UserRef = { id: string; name: string };

export default function TeachersView({ teachers, users }: { teachers: Teacher[]; users: UserRef[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/teachers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, specialization }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setName(''); setPhone(''); setSpecialization(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/teachers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('edu.tc.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/teachers/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('edu.tc.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="t-name">{t('edu.tc.name')}</label>
              <input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="t-phone">{t('edu.tc.phone')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="t-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="t-spec">{t('edu.tc.spec')} <span className="org-hint">{t('edu.tc.specHint')}</span></label>
              <input id="t-spec" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('edu.tc.add')}
            </button>
          </div>
        </form>
      )}

      {teachers.length === 0 ? (
        <div className="org-empty"><IconShape name="teachers" variant="soft" size="xl" /><p>{t('edu.tc.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr><th>{t('edu.tc.thTeacher')}</th><th>{t('edu.tc.spec')}</th><th>{t('edu.tc.thHalaqat')}</th><th>{t('edu.tc.account')}</th><th>{t('view.status')}</th><th></th></tr>
            </thead>
            <tbody>
              {teachers.map((tc) => (
                <tr key={tc.id} className={tc.isActive ? '' : 'is-inactive'}>
                  <td><strong>{tc.name}</strong>{tc.phone && <small dir="ltr">{tc.phone}</small>}</td>
                  <td>{tc.specialization ?? '—'}</td>
                  <td>{tc.halaqatCount}</td>
                  <td>
                    <select className="org-inline-select" value={tc.userId ?? ''} disabled={busyId === tc.id}
                      onChange={(e) => patch(tc.id, { userId: e.target.value || null })} aria-label={t('edu.tc.account')}>
                      <option value="">{t('edu.tc.noAccount')}</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </td>
                  <td><span className={`org-badge ${tc.isActive ? 'is-on' : ''}`}>{tc.isActive ? t('status.teacher.active') : t('status.teacher.inactive')}</span></td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-quiet" disabled={busyId === tc.id} onClick={() => patch(tc.id, { isActive: !tc.isActive })}>
                      {tc.isActive ? t('edu.tc.deactivate') : t('edu.tc.activate')}
                    </button>
                    <button className="org-btn org-btn-danger" disabled={busyId === tc.id} onClick={() => remove(tc.id)}>{t('view.delete')}</button>
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
