'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Branch = {
  id: string; name: string; code: string | null; city: string | null;
  address: string | null; phone: string | null; manager: string | null; isActive: boolean;
};

export default function BranchesView({ branches, canManage }: { branches: Branch[]; canManage: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');
  const [address, setAddress] = useState('');

  function reset() { setName(''); setCode(''); setCity(''); setPhone(''); setManager(''); setAddress(''); }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/branches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, city, phone, manager, address }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { reset(); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/branches/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('branch.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/branches/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      {canManage && (
        <div className="org-toolbar">
          <span className="org-toolbar-spacer" />
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('branch.new')}
          </button>
        </div>
      )}

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="b-name">{t('branch.name')}</label>
              <input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="b-code">{t('branch.code')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="b-code" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          </div>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="b-city">{t('branch.city')}</label>
              <input id="b-city" value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="b-phone">{t('branch.phone')}</label>
              <input id="b-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="b-manager">{t('branch.manager')}</label>
              <input id="b-manager" value={manager} onChange={(e) => setManager(e.target.value)} /></div>
            <div className="org-field"><label htmlFor="b-address">{t('branch.address')}</label>
              <input id="b-address" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('branch.create')}
            </button>
          </div>
        </form>
      )}

      {branches.length === 0 ? (
        <div className="org-empty"><IconShape name="building" variant="soft" size="xl" /><p>{t('branch.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr>
              <th>{t('branch.colBranch')}</th><th>{t('branch.city')}</th>
              <th>{t('branch.manager')}</th><th>{t('view.status')}</th>{canManage && <th></th>}
            </tr></thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} style={b.isActive ? undefined : { opacity: 0.55 }}>
                  <td>
                    <strong>{b.name}</strong>
                    {b.code && <small>{t('branch.code')}: {b.code}</small>}
                    {b.phone && <small dir="ltr">{b.phone}</small>}
                  </td>
                  <td>{b.city ?? '—'}{b.address && <small>{b.address}</small>}</td>
                  <td>{b.manager ?? '—'}</td>
                  <td>
                    {canManage ? (
                      <select className="org-inline-select" value={b.isActive ? '1' : '0'} disabled={busyId === b.id}
                        onChange={(e) => patch(b.id, { isActive: e.target.value === '1' })}>
                        <option value="1">{t('branch.active')}</option>
                        <option value="0">{t('branch.inactive')}</option>
                      </select>
                    ) : (
                      <span className={`org-pill ${b.isActive ? 'org-pill-ok' : 'org-pill-muted'}`}>
                        {b.isActive ? t('branch.active') : t('branch.inactive')}
                      </span>
                    )}
                  </td>
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
