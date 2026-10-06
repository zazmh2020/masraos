'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DONATION_METHODS, DONATION_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Donation = {
  id: string; donorName: string; amount: number; method: string; status: string;
  note: string | null; campaignId: string | null; donatedAt: string;
};
type Ref = { id: string; name: string };

const numFmt = new Intl.NumberFormat('en-US');

export default function DonationsView({
  donations, campaigns, totalReceived, canManage,
}: { donations: Donation[]; campaigns: Ref[]; totalReceived: number; canManage: boolean }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const methodLabel = (v: string) => t(`don.method.${v}`);
  const statusLabel = (v: string) => t(`status.donation.${v}`);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [status, setStatus] = useState('RECEIVED');
  const [campaignId, setCampaignId] = useState('');
  const [donatedAt, setDonatedAt] = useState('');
  const [note, setNote] = useState('');

  const campName = (id: string | null) => (id ? campaigns.find((c) => c.id === id)?.name ?? '—' : '—');
  const shown = useMemo(
    () => (filter === 'ALL' ? donations : donations.filter((d) => d.status === filter)),
    [donations, filter],
  );

  function resetForm() {
    setDonorName(''); setAmount(''); setMethod('CASH'); setStatus('RECEIVED');
    setCampaignId(''); setDonatedAt(''); setNote('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/donations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorName, amount, method, status, note, donatedAt, campaignId: campaignId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('don.createErr'));
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/donations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.saveErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('don.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/donations/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.deleteErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-stats">
        <div className="org-stat">
          <div className="org-stat-label">{t('don.totalReceived')}</div>
          <div className="org-stat-value">{numFmt.format(totalReceived)}</div>
        </div>
        <div className="org-stat">
          <div className="org-stat-label">{t('don.count')}</div>
          <div className="org-stat-value">{donations.length}</div>
        </div>
      </div>

      <div className="org-toolbar">
        <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('don.filterByStatus')}>
          <option value="ALL">{t('don.allStatuses')}</option>
          {DONATION_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <span className="org-toolbar-spacer" />
        <a className="org-btn org-btn-outline" href="/api/org/export?type=donations">⬇ {t('view.exportCsv')}</a>
        {canManage && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('don.new')}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="d-donor">{t('don.donorName')}</label>
              <input id="d-donor" value={donorName} onChange={(e) => setDonorName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="d-amount">{t('don.amount')}</label>
              <input id="d-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="d-date">{t('don.date')} <span className="org-hint">{t('don.dateHint')}</span></label>
              <input id="d-date" type="date" value={donatedAt} onChange={(e) => setDonatedAt(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="d-method">{t('don.payMethod')}</label>
              <select id="d-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {DONATION_METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="d-status">{t('view.status')}</label>
              <select id="d-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {DONATION_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="d-camp">{t('don.campaign')}</label>
              <select id="d-camp" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                <option value="">{t('don.noCampaign')}</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="d-note">{t('don.note')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="d-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('don.registering') : t('don.submit')}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty"><IconShape name="donations" variant="soft" size="xl" /><p>{donations.length === 0 ? t('don.none') : t('don.noneInStatus')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>{t('don.colDonor')}</th>
                <th>{t('don.amount')}</th>
                <th>{t('don.methodShort')}</th>
                <th>{t('view.status')}</th>
                <th>{t('don.campaign')}</th>
                <th>{t('don.dateCol')}</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.donorName}</strong>
                    {d.note && <small>{d.note}</small>}
                  </td>
                  <td>{numFmt.format(d.amount)}</td>
                  <td>{methodLabel(d.method)}</td>
                  <td>
                    {canManage ? (
                      <select className="org-inline-select" value={d.status} disabled={busyId === d.id}
                        onChange={(e) => patch(d.id, { status: e.target.value })}>
                        {DONATION_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    ) : (
                      <span className={`org-badge ${d.status === 'RECEIVED' ? 'is-on' : ''}`}>{statusLabel(d.status)}</span>
                    )}
                  </td>
                  <td>{campName(d.campaignId)}</td>
                  <td>{dateFmt.format(new Date(d.donatedAt))}</td>
                  {canManage && (
                    <td className="org-row-actions">
                      <button className="org-btn org-btn-danger" disabled={busyId === d.id} onClick={() => remove(d.id)}>{t('view.delete')}</button>
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
