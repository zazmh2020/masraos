'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BENEFICIARY_CATEGORIES, BENEFICIARY_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Beneficiary = {
  id: string; name: string; phone: string | null; nationalId: string | null;
  category: string; status: string; notes: string | null;
  departmentId: string | null; programId: string | null;
};
type Ref = { id: string; name: string };

export default function BeneficiariesView({
  beneficiaries, departments, programs, canManage,
}: { beneficiaries: Beneficiary[]; departments: Ref[]; programs: Ref[]; canManage: boolean }) {
  const { t } = useLocale();
  const categoryLabel = (v: string) => t(`ben.cat.${v}`);
  const statusLabel = (v: string) => t(`status.beneficiary.${v}`);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [category, setCategory] = useState('FAMILY');
  const [status, setStatus] = useState('ACTIVE');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [notes, setNotes] = useState('');

  const nameOf = (list: Ref[], id: string | null) => (id ? list.find((x) => x.id === id)?.name ?? '—' : '—');
  const shown = useMemo(
    () => (filter === 'ALL' ? beneficiaries : beneficiaries.filter((b) => b.category === filter)),
    [beneficiaries, filter],
  );

  function resetForm() {
    setName(''); setPhone(''); setNationalId(''); setCategory('FAMILY');
    setStatus('ACTIVE'); setDepartmentId(''); setProgramId(''); setNotes('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/beneficiaries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, nationalId, category, status, notes, departmentId: departmentId || null, programId: programId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.createErr'));
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/beneficiaries/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.saveErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('ben.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/beneficiaries/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.deleteErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('ben.filterByCategory')}>
          <option value="ALL">{t('ben.allCategories')}</option>
          {BENEFICIARY_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
        </select>
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('ben.new')}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="b-name">{t('ben.name')}</label>
              <input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="b-phone">{t('ben.phone')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="b-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="b-nid">{t('ben.nid')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="b-nid" dir="ltr" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="b-cat">{t('ben.category')}</label>
              <select id="b-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {BENEFICIARY_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="b-status">{t('view.status')}</label>
              <select id="b-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {BENEFICIARY_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="b-dept">{t('view.unitShort')}</label>
              <select id="b-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="b-prog">{t('ben.program')}</label>
              <select id="b-prog" value={programId} onChange={(e) => setProgramId(e.target.value)}>
                <option value="">{t('ben.noProgram')}</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="b-notes">{t('ben.notes')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="b-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('ben.createFile')}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty"><IconShape name="beneficiaries" variant="soft" size="xl" /><p>{beneficiaries.length === 0 ? t('ben.none') : t('ben.noneInCategory')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>{t('ben.colBeneficiary')}</th>
                <th>{t('ben.category')}</th>
                <th>{t('view.status')}</th>
                <th>{t('view.unitShort')}</th>
                <th>{t('ben.program')}</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.name}</strong>
                    {b.phone && <small dir="ltr">{b.phone}</small>}
                    {b.nationalId && <small dir="ltr">{t('ben.idLabel', { v: b.nationalId })}</small>}
                  </td>
                  <td>
                    {canManage ? (
                      <select className="org-inline-select" value={b.category} disabled={busyId === b.id}
                        onChange={(e) => patch(b.id, { category: e.target.value })}>
                        {BENEFICIARY_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                      </select>
                    ) : categoryLabel(b.category)}
                  </td>
                  <td>
                    {canManage ? (
                      <select className="org-inline-select" value={b.status} disabled={busyId === b.id}
                        onChange={(e) => patch(b.id, { status: e.target.value })}>
                        {BENEFICIARY_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    ) : statusLabel(b.status)}
                  </td>
                  <td>{nameOf(departments, b.departmentId)}</td>
                  <td>{nameOf(programs, b.programId)}</td>
                  {canManage && (
                    <td className="org-row-actions">
                      <button className="org-btn org-btn-danger" disabled={busyId === b.id} onClick={() => remove(b.id)}>{t('view.delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
