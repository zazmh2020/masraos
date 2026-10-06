'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Fee = { id: string; title: string; amount: number; dueDate: string | null; paid: boolean; studentName: string };
type Student = { id: string; name: string };
const numFmt = new Intl.NumberFormat('en-US');

export default function FeesView({ fees, students, canManage }: { fees: Fee[]; students: Student[]; canManage: boolean }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric' });
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('ALL');

  const totals = useMemo(() => {
    const paid = fees.filter((f) => f.paid).reduce((s, f) => s + f.amount, 0);
    const due = fees.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);
    return { paid, due };
  }, [fees]);
  const shown = filter === 'ALL' ? fees : fees.filter((f) => (filter === 'PAID' ? f.paid : !f.paid));

  async function create(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy('__new');
    try {
      const res = await fetch('/api/org/fees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, studentId, dueDate: dueDate || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setTitle(''); setAmount(''); setStudentId(''); setDueDate(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusy(null); }
  }

  async function togglePaid(f: Fee) {
    setBusy(f.id);
    try {
      const res = await fetch(`/api/org/fees/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid: !f.paid }) });
      if (res.ok) router.refresh();
    } finally { setBusy(null); }
  }
  async function remove(id: string) {
    if (!confirm(t('fee.deleteConfirm'))) return;
    setBusy(id);
    try { const res = await fetch(`/api/org/fees/${id}`, { method: 'DELETE' }); if (res.ok) router.refresh(); } finally { setBusy(null); }
  }

  return (
    <>
      <div className="org-stats">
        <div className="org-stat"><div className="org-stat-label">{t('fee.totalPaid')}</div><div className="org-stat-value">{numFmt.format(totals.paid)}</div></div>
        <div className="org-stat"><div className="org-stat-label">{t('fee.totalDue')}</div><div className="org-stat-value">{numFmt.format(totals.due)}</div></div>
      </div>

      <div className="org-toolbar">
        <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">{t('fee.all')}</option>
          <option value="DUE">{t('fee.dueOnly')}</option>
          <option value="PAID">{t('fee.paidOnly')}</option>
        </select>
        <span className="org-toolbar-spacer" />
        {canManage && <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>{creating ? t('shell.cancel') : t('fee.new')}</button>}
      </div>
      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="f-student">{t('fee.student')}</label>
              <select id="f-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">{t('edu.mz.choose')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div className="org-field"><label htmlFor="f-title">{t('fee.title')}</label>
              <input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t('fee.titlePh')} /></div>
            <div className="org-field"><label htmlFor="f-amount">{t('fee.amount')}</label>
              <input id="f-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="f-due">{t('fee.due')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="f-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div className="org-form-actions"><button type="submit" className="org-btn org-btn-primary" disabled={busy === '__new'}>{busy === '__new' ? t('form.saving') : t('fee.create')}</button></div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty"><IconShape name="donations" variant="soft" size="xl" /><p>{t('fee.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr><th>{t('fee.student')}</th><th>{t('fee.title')}</th><th>{t('fee.amount')}</th><th>{t('fee.due')}</th><th>{t('view.status')}</th><th></th></tr></thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f.id}>
                  <td><strong>{f.studentName}</strong></td>
                  <td>{f.title}</td>
                  <td>{numFmt.format(f.amount)}</td>
                  <td>{f.dueDate ? dateFmt.format(new Date(f.dueDate)) : '—'}</td>
                  <td><span className={`org-status ${f.paid ? 'org-reqstatus-approved' : 'org-reqstatus-pending'}`}>{f.paid ? t('fee.paid') : t('fee.unpaid')}</span></td>
                  <td className="org-row-actions">
                    {canManage && <button className="org-btn org-btn-quiet" disabled={busy === f.id} onClick={() => togglePaid(f)}>{f.paid ? t('fee.markUnpaid') : t('fee.markPaid')}</button>}
                    {canManage && <button className="org-btn org-btn-danger" disabled={busy === f.id} onClick={() => remove(f.id)}>{t('view.delete')}</button>}
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
