'use client';

import { IconShape } from '@/components/Icon';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MEMO_KINDS, MEMO_RATINGS } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Entry = {
  id: string; kind: string; content: string; rating: string;
  notes: string | null; studentName: string; date: string;
};
type Ref = { id: string; name: string };

export default function MemorizationView({ entries, students }: { entries: Entry[]; students: Ref[] }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [studentId, setStudentId] = useState('');
  const [kind, setKind] = useState('NEW');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('GOOD');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/memorization', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, kind, content, rating, date, notes }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr'));
      else { setContent(''); setNotes(''); setDate(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('edu.mz.deleteConfirm'))) return;
    setBusyId(id); setError('');
    try {
      const res = await fetch(`/api/org/education/memorization/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" disabled={students.length === 0}
          onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('edu.mz.new')}
        </button>
      </div>

      {students.length === 0 && <div className="org-alert">{t('edu.mz.addStudentsFirst')}</div>}
      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="m-student">{t('edu.mz.student')}</label>
              <select id="m-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">{t('edu.mz.choose')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="m-kind">{t('edu.mz.kind')}</label>
              <select id="m-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                {MEMO_KINDS.map((k) => <option key={k} value={k}>{t('status.memoKind.' + k)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="m-date">{t('edu.mz.date')} <span className="org-hint">{t('edu.mz.dateHint')}</span></label>
              <input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="m-content">{t('edu.mz.content')}</label>
              <input id="m-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('edu.mz.contentPh')} required />
            </div>
            <div className="org-field">
              <label htmlFor="m-rating">{t('edu.mz.rating')}</label>
              <select id="m-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
                {MEMO_RATINGS.map((r) => <option key={r} value={r}>{t('status.memoRating.' + r)}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="m-notes">{t('edu.mz.notes')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="m-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('edu.mz.saveRecord')}
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="org-empty"><IconShape name="memorization" variant="soft" size="xl" /><p>{t('edu.mz.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr><th>{t('edu.mz.student')}</th><th>{t('edu.mz.kind')}</th><th>{t('edu.mz.content')}</th><th>{t('edu.mz.rating')}</th><th>{t('edu.mz.date')}</th><th></th></tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.studentName}</strong>{e.notes && <small>{e.notes}</small>}</td>
                  <td>{t('status.memoKind.' + e.kind)}</td>
                  <td>{e.content}</td>
                  <td><span className={`org-status org-rating-${e.rating.toLowerCase()}`}>{t('status.memoRating.' + e.rating)}</span></td>
                  <td>{dateFmt.format(new Date(e.date))}</td>
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
