'use client';

import { IconShape } from '@/components/Icon';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Guardian = {
  id: string; fullName: string; phone: string | null; email: string | null;
  userId: string | null; userName: string | null; studentIds: string[];
};
type Ref = { id: string; name: string };

export default function GuardiansView({
  guardians, students, linkableUsers,
}: { guardians: Guardian[]; students: Ref[]; linkableUsers: Ref[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | '__new' | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

  function open(g?: Guardian) {
    setError('');
    if (g) { setEditing(g.id); setFullName(g.fullName); setPhone(g.phone ?? ''); setEmail(g.email ?? ''); setUserId(g.userId ?? ''); setPicked(new Set(g.studentIds)); }
    else { setEditing('__new'); setFullName(''); setPhone(''); setEmail(''); setUserId(''); setPicked(new Set()); }
  }
  function close() { setEditing(null); }
  function toggle(id: string) { setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    const isNew = editing === '__new';
    try {
      const res = await fetch(isNew ? '/api/org/education/guardians' : `/api/org/education/guardians/${editing}`, {
        method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, email, userId: userId || null, studentIds: [...picked] }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr'));
      else { close(); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm(t('guardian.deleteConfirm'))) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/org/education/guardians/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusy(false); }
  }

  // الحسابات المتاحة للربط: القابلة + الحساب المرتبط حاليًا بمن نعدّله
  const editingGuardian = guardians.find((g) => g.id === editing);
  const userOptions = [...linkableUsers];
  if (editingGuardian?.userId && !userOptions.some((u) => u.id === editingGuardian.userId)) {
    userOptions.unshift({ id: editingGuardian.userId, name: editingGuardian.userName ?? editingGuardian.userId });
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        {editing === null && <button className="org-btn org-btn-primary" onClick={() => open()}>{t('guardian.new')}</button>}
      </div>
      {error && <div className="org-alert">{error}</div>}

      {editing !== null && (
        <form className="org-form" onSubmit={save}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="g-name">{t('guardian.name')}</label>
              <input id="g-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="g-phone">{t('guardian.phone')}</label>
              <input id="g-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="g-email">{t('guardian.email')}</label>
              <input id="g-email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="g-user">{t('guardian.account')} <span className="org-hint">{t('view.optional')}</span></label>
              <select id="g-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">{t('guardian.noAccount')}</option>
                {userOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select></div>
          </div>
          <div className="org-field">
            <label>{t('guardian.children')} <span className="org-hint">{t('guardian.childrenHint')}</span></label>
            {students.length === 0 ? <p className="org-hint">{t('guardian.noStudents')}</p> : (
              <div className="crole-group-caps" style={{ marginTop: '0.3rem' }}>
                {students.map((s) => (
                  <label key={s.id} className={`crole-cap ${picked.has(s.id) ? 'is-on' : ''}`}>
                    <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />{s.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busy}>{busy ? t('form.saving') : t('guardian.save')}</button>
            <button type="button" className="org-btn org-btn-ghost" onClick={close}>{t('shell.cancel')}</button>
          </div>
        </form>
      )}

      {guardians.length === 0 ? (
        editing === null && <div className="org-empty"><IconShape name="users" variant="soft" size="xl" /><p>{t('guardian.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr>
              <th>{t('guardian.name')}</th><th>{t('guardian.children')}</th>
              <th>{t('guardian.account')}</th><th></th>
            </tr></thead>
            <tbody>
              {guardians.map((g) => (
                <tr key={g.id}>
                  <td><strong>{g.fullName}</strong>{g.phone && <small dir="ltr">{g.phone}</small>}</td>
                  <td>{g.studentIds.length === 0 ? '—' : g.studentIds.map(studentName).join('، ')}</td>
                  <td>{g.userName ? <span className="org-pill org-pill-ok">{g.userName}</span> : <span className="org-pill org-pill-muted">{t('guardian.noAccount')}</span>}</td>
                  <td className="org-row-actions">
                    <button className="org-btn" disabled={busy} onClick={() => open(g)}>{t('view.edit')}</button>
                    <button className="org-btn org-btn-danger" disabled={busy} onClick={() => remove(g.id)}>{t('view.delete')}</button>
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
