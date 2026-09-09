'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ASSESSMENT_KINDS } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Assessment = {
  id: string; title: string; kind: string; score: number | null; maxScore: number;
  errors: number | null; alerts: number | null;
  result: string; notes: string | null; studentName: string; date: string;
};
type Student = { id: string; name: string };

export default function AssessmentsView({
  assessments, students, canManage, orgName, orgLogo = null,
}: { assessments: Assessment[]; students: Student[]; canManage: boolean; orgName: string; orgLogo?: string | null }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtDate = (d: string) => dateFmt.format(new Date(d));
  const kindLabel = (v: string) => t(`assess.kind.${v}`);
  const resultLabel = (v: string) => t(`assess.result.${v}`);
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('MEMORIZATION_TEST');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [errorsN, setErrorsN] = useState('');
  const [alertsN, setAlertsN] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(false);

  const printedAt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/assessments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, title, kind, score: score || null, maxScore, errors: errorsN || null, alerts: alertsN || null, date, notes }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setStudentId(''); setTitle(''); setKind('MEMORIZATION_TEST'); setScore(''); setMaxScore('100'); setErrorsN(''); setAlertsN(''); setDate(''); setNotes(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('assess.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/assessments/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        {assessments.length > 0 && (
          <button className="org-btn org-btn-outline" onClick={() => setPreview(true)}>{t('assess.exportPdf')}</button>
        )}
        {canManage && students.length > 0 && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('assess.new')}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}
      {students.length === 0 && <div className="org-empty">{t('assess.needStudents')}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="as-student">{t('assess.student')}</label>
              <select id="as-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">{t('assess.pickStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="as-kind">{t('assess.kind')}</label>
              <select id="as-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                {ASSESSMENT_KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="as-title">{t('assess.title')}</label>
            <input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="as-score">{t('assess.score')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="as-score" type="number" min="0" step="0.5" dir="ltr" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="as-max">{t('assess.maxScore')}</label>
              <input id="as-max" type="number" min="1" step="0.5" dir="ltr" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="as-date">{t('assess.date')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="as-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="as-errors">{t('assess.errors')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="as-errors" type="number" min="0" dir="ltr" lang="en" value={errorsN} onChange={(e) => setErrorsN(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="as-alerts">{t('assess.alerts')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="as-alerts" type="number" min="0" dir="ltr" lang="en" value={alertsN} onChange={(e) => setAlertsN(e.target.value)} />
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="as-notes">{t('assess.notes')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="as-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('assess.save')}
            </button>
          </div>
        </form>
      )}

      {assessments.length === 0 ? (
        students.length > 0 && <div className="org-empty">{t('assess.none')}</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr>
              <th>{t('assess.student')}</th><th>{t('assess.colTest')}</th><th>{t('assess.score')}</th>
              <th dir="ltr">{t('assess.errors')} / {t('assess.alerts')}</th>
              <th>{t('view.status')}</th><th>{t('assess.date')}</th>{canManage && <th></th>}
            </tr></thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.studentName}</strong></td>
                  <td>{a.title}<small>{kindLabel(a.kind)}</small></td>
                  <td dir="ltr">{a.score === null ? '—' : `${a.score} / ${a.maxScore}`}</td>
                  <td dir="ltr">{a.errors ?? 0} / {a.alerts ?? 0}</td>
                  <td><span className={`org-pill apr-badge-${a.result === 'PASS' ? 'approved' : a.result === 'FAIL' ? 'rejected' : 'pending'}`}>{resultLabel(a.result)}</span></td>
                  <td>{fmtDate(a.date)}</td>
                  {canManage && (
                    <td className="org-row-actions">
                      <button className="org-btn org-btn-danger" disabled={busyId === a.id} onClick={() => remove(a.id)}>{t('view.delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== معاينة قبل تصدير PDF ===== */}
      {preview && (
        <div className="qm-preview" role="dialog" aria-modal="true">
          <div className="qm-preview-bar">
            <span className="qm-preview-name">{t('assess.pageTitle')}</span>
            <div className="qm-preview-actions">
              <button className="org-btn org-btn-primary" onClick={() => window.print()}>{t('assess.exportPdf')}</button>
              <button className="org-btn org-btn-outline" onClick={() => setPreview(false)}>{t('qm.close')}</button>
            </div>
          </div>
          <div className="qm-preview-scroll">
            <article className="qm-doc" lang="en">
              <header className="qm-doc-head">
                {orgLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="qm-doc-logo" src={orgLogo} alt="" />
                )}
                <div className="qm-doc-org">{orgName}</div>
                <h1 className="qm-doc-title">{t('assess.pageTitle')}</h1>
                <div className="qm-doc-sub">{t('assess.reportCount', { n: assessments.length })}</div>
              </header>
              <table className="qm-doc-table">
                <thead>
                  <tr>
                    <th>{t('assess.student')}</th>
                    <th>{t('assess.colTest')}</th>
                    <th>{t('assess.kind')}</th>
                    <th>{t('assess.score')}</th>
                    <th>{t('assess.errors')}</th>
                    <th>{t('assess.alerts')}</th>
                    <th>{t('view.status')}</th>
                    <th>{t('assess.date')}</th>
                    <th>{t('assess.notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.studentName}</td>
                      <td>{a.title}</td>
                      <td>{kindLabel(a.kind)}</td>
                      <td dir="ltr">{a.score === null ? '—' : `${a.score} / ${a.maxScore}`}</td>
                      <td dir="ltr">{a.errors ?? 0}</td>
                      <td dir="ltr">{a.alerts ?? 0}</td>
                      <td>{resultLabel(a.result)}</td>
                      <td dir="ltr">{a.date}</td>
                      <td className="qm-doc-notes">{a.notes ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="qm-doc-foot">{t('qm.generatedAt', { date: printedAt })}</div>
            </article>
          </div>
        </div>
      )}
    </>
  );
}
