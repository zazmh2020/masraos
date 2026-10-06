'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { EMPLOYEE_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Employee = {
  id: string; name: string; phone: string | null; email: string | null;
  position: string | null; status: string; departmentId: string | null;
};
type Ref = { id: string; name: string };

export default function EmployeesView({ employees, departments }: { employees: Employee[]; departments: Ref[] }) {
  const { t } = useLocale();
  const statusLabel = (v: string) => t(`status.employee.${v}`);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name ?? '—' : '—');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/resources/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, position, status, departmentId: departmentId || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setName(''); setPhone(''); setEmail(''); setPosition(''); setStatus('ACTIVE'); setDepartmentId(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/employees/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('res.emp.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/resources/employees/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('res.emp.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="e-name">{t('res.emp.name')}</label>
              <input id="e-name" value={name} onChange={(ev) => setName(ev.target.value)} required /></div>
            <div className="org-field"><label htmlFor="e-pos">{t('res.emp.position')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="e-pos" value={position} onChange={(ev) => setPosition(ev.target.value)} /></div>
          </div>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="e-phone">{t('res.emp.phone')}</label>
              <input id="e-phone" dir="ltr" value={phone} onChange={(ev) => setPhone(ev.target.value)} /></div>
            <div className="org-field"><label htmlFor="e-email">{t('res.emp.email')}</label>
              <input id="e-email" dir="ltr" value={email} onChange={(ev) => setEmail(ev.target.value)} /></div>
          </div>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="e-status">{t('view.status')}</label>
              <select id="e-status" value={status} onChange={(ev) => setStatus(ev.target.value)}>
                {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select></div>
            <div className="org-field"><label htmlFor="e-dept">{t('view.unitShort')}</label>
              <select id="e-dept" value={departmentId} onChange={(ev) => setDepartmentId(ev.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select></div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('res.emp.create')}
            </button>
          </div>
        </form>
      )}

      {employees.length === 0 ? (
        <div className="org-empty"><IconShape name="users" variant="soft" size="xl" /><p>{t('res.emp.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr><th>{t('res.emp.colEmployee')}</th><th>{t('res.emp.position')}</th><th>{t('view.status')}</th><th>{t('view.unitShort')}</th><th></th></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.name}</strong>{e.phone && <small dir="ltr">{e.phone}</small>}</td>
                  <td>{e.position ?? '—'}</td>
                  <td>
                    <select className="org-inline-select" value={e.status} disabled={busyId === e.id}
                      onChange={(ev) => patch(e.id, { status: ev.target.value })}>
                      {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td>{deptName(e.departmentId)}</td>
                  <td className="org-row-actions">
                    <button className="org-btn org-btn-danger" disabled={busyId === e.id} onClick={() => remove(e.id)}>{t('view.delete')}</button>
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
