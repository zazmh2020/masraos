'use client';

import Link from 'next/link';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Student = {
  id: string; serial: number | null; section: string | null; name: string; phone: string | null;
  guardianName: string | null; guardianPhone: string | null;
  status: string; halaqaId: string | null;
};
type Ref = { id: string; name: string };

const SECTIONS = ['BOYS', 'GIRLS'] as const;

export default function StudentsView({ students, halaqat, basePath }: { students: Student[]; halaqat: Ref[]; basePath: string }) {
  const { t } = useLocale();
  const statusLabel = (v: string) => t(`status.student.${v}`);
  const sectionLabel = (v: string | null) => (v ? t(`section.${v}`) : '—');
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | NONE | <halaqaId>
  const [sectionFilter, setSectionFilter] = useState('ALL'); // ALL | BOYS | GIRLS
  const [query, setQuery] = useState(''); // بحث بالاسم أو الرقم التسلسلي

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [halaqaId, setHalaqaId] = useState('');
  const [section, setSection] = useState('');

  const halaqaName = (id: string | null) => (id ? halaqat.find((h) => h.id === id)?.name ?? '—' : '—');
  const shown = useMemo(() => {
    const q = query.trim();
    return students.filter((s) => {
      if (filter === 'NONE' && s.halaqaId) return false;
      if (filter !== 'ALL' && filter !== 'NONE' && s.halaqaId !== filter) return false;
      if (sectionFilter !== 'ALL' && s.section !== sectionFilter) return false;
      if (q) {
        const byName = s.name.toLowerCase().includes(q.toLowerCase());
        const bySerial = s.serial != null && String(s.serial) === q;
        if (!byName && !bySerial) return false;
      }
      return true;
    });
  }, [students, filter, sectionFilter, query]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, guardianName, guardianPhone, guardianEmail, status, halaqaId: halaqaId || null, section: section || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else {
        setName(''); setPhone(''); setGuardianName(''); setGuardianPhone(''); setGuardianEmail(''); setStatus('ACTIVE'); setHalaqaId(''); setSection('');
        setCreating(false); router.refresh();
      }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/students/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('edu.st.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/students/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <input
          className="org-inline-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('edu.st.searchPlaceholder')}
          aria-label={t('edu.st.searchPlaceholder')}
        />
        <select className="org-inline-select" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} aria-label={t('edu.st.section')}>
          <option value="ALL">{t('edu.st.allSections')}</option>
          {SECTIONS.map((s) => <option key={s} value={s}>{t(`section.${s}`)}</option>)}
        </select>
        {halaqat.length > 0 && (
          <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('edu.st.filterByHalaqa')}>
            <option value="ALL">{t('edu.st.allHalaqat')}</option>
            <option value="NONE">{t('edu.st.noHalaqa')}</option>
            {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
        <span className="org-toolbar-spacer" />
        <a className="org-btn org-btn-outline" href="/api/org/export?type=students">⬇ {t('view.exportCsv')}</a>
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('edu.st.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="s-name">{t('edu.st.name')}</label>
              <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="s-phone">{t('edu.st.phone')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="s-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="s-gname">{t('edu.st.guardianName')}</label>
              <input id="s-gname" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="s-gphone">{t('edu.st.guardianPhone')}</label>
              <input id="s-gphone" dir="ltr" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="s-gemail">{t('edu.st.guardianEmail')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="s-gemail" type="email" dir="ltr" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="s-status">{t('view.status')}</label>
              <select id="s-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="s-section">{t('edu.st.section')}</label>
              <select id="s-section" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">{t('edu.st.noSection')}</option>
                {SECTIONS.map((s) => <option key={s} value={s}>{t(`section.${s}`)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="s-halaqa">{t('edu.st.halaqa')}</label>
              <select id="s-halaqa" value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)}>
                <option value="">{t('edu.st.noHalaqaOpt')}</option>
                {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('edu.st.add')}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty">{students.length === 0 ? t('edu.st.none') : t('edu.st.noneInHalaqa')}</div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table org-table-center st-table">
            <thead>
              <tr>
                <th className="st-col-serial">{t('edu.st.thSerial')}</th>
                <th className="st-col-name">{t('edu.st.thStudent')}</th>
                <th>{t('edu.st.section')}</th>
                <th>{t('view.status')}</th>
                <th>{t('edu.st.halaqa')}</th>
                <th className="st-col-actions">{t('view.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td className="st-col-serial"><span className="st-serial" dir="ltr">{s.serial != null ? `#${s.serial}` : '—'}</span></td>
                  <td className="st-col-name">
                    <Link href={`${basePath}/${s.id}`} className="org-link"><strong>{s.name}</strong></Link>
                    {s.phone && <small dir="ltr">{s.phone}</small>}
                  </td>
                  <td>
                    <select className="org-inline-select" value={s.section ?? ''} disabled={busyId === s.id}
                      onChange={(e) => patch(s.id, { section: e.target.value || null })} aria-label={t('edu.st.section')}>
                      <option value="">{t('edu.st.noSection')}</option>
                      {SECTIONS.map((v) => <option key={v} value={v}>{sectionLabel(v)}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="org-inline-select" value={s.status} disabled={busyId === s.id}
                      onChange={(e) => patch(s.id, { status: e.target.value })}>
                      {STUDENT_STATUSES.map((v) => <option key={v} value={v}>{statusLabel(v)}</option>)}
                    </select>
                  </td>
                  <td>
                    {halaqat.length > 0 ? (
                      <select className="org-inline-select" value={s.halaqaId ?? ''} disabled={busyId === s.id}
                        onChange={(e) => patch(s.id, { halaqaId: e.target.value || null })} aria-label={t('edu.st.halaqa')}>
                        <option value="">{t('edu.st.noHalaqaOpt')}</option>
                        {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    ) : halaqaName(s.halaqaId)}
                  </td>
                  <td className="st-col-actions">
                    <button className="org-btn org-btn-danger" disabled={busyId === s.id} onClick={() => remove(s.id)}>{t('view.delete')}</button>
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
