'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { REQUEST_TYPES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Req = {
  id: string; type: string; status: string; details: string | null; reply: string | null;
  createdAt: string; requesterName: string; mine: boolean;
};

export default function RequestsView({
  requests, canManage,
}: { requests: Req[]; canManage: boolean }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const typeLabel = (v: string) => t(`req.type.${v}`);
  const statusLabel = (v: string) => t(`status.request.${v}`);
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('EXAM');
  const [details, setDetails] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, details }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setType('EXAM'); setDetails(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function decide(id: string, status: string) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('req.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/requests/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('req.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={submit}>
          <div className="org-field">
            <label htmlFor="rq-type">{t('req.type')}</label>
            <select id="rq-type" value={type} onChange={(e) => setType(e.target.value)}>
              {REQUEST_TYPES.map((rt) => <option key={rt} value={rt}>{typeLabel(rt)}</option>)}
            </select>
          </div>
          <div className="org-field">
            <label htmlFor="rq-details">{t('req.details')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="rq-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('req.detailsPh')} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('req.submit')}
            </button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <div className="org-empty">{t('req.none')}</div>
      ) : (
        <div className="org-cards">
          {requests.map((r) => (
            <article key={r.id} className="org-card">
              <div className="org-card-head">
                <h3>{typeLabel(r.type)}</h3>
                <span className={`org-status org-reqstatus-${r.status.toLowerCase()}`}>{statusLabel(r.status)}</span>
              </div>
              {r.details && <p className="org-card-desc">{r.details}</p>}
              <div className="org-card-meta">
                <span>{t('req.by', { name: r.requesterName })}</span>
                <span>{dateFmt.format(new Date(r.createdAt))}</span>
              </div>
              {r.reply && <p className="org-card-desc org-req-reply">{t('req.replyLabel', { v: r.reply })}</p>}
              <div className="org-card-actions">
                {canManage && r.status === 'PENDING' && (
                  <>
                    <button className="org-btn org-btn-primary" disabled={busyId === r.id} onClick={() => decide(r.id, 'APPROVED')}>{t('req.approve')}</button>
                    <button className="org-btn org-btn-outline" disabled={busyId === r.id} onClick={() => decide(r.id, 'REJECTED')}>{t('req.reject')}</button>
                  </>
                )}
                {(canManage || (r.mine && r.status === 'PENDING')) && (
                  <button className="org-btn org-btn-danger" disabled={busyId === r.id} onClick={() => remove(r.id)}>{t('view.delete')}</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
