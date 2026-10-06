'use client';

import { IconShape } from '@/components/Icon';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { APPROVAL_CATEGORIES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import RiyalSign from '@/components/RiyalSign';

type Approval = {
  id: string; title: string; description: string | null; category: string;
  amount: string | null; status: string; decisionNote: string | null;
  requestedByName: string | null; decidedByName: string | null; createdAt: string;
};

export default function ApprovalsView({
  approvals, canDecide, canCreate,
}: { approvals: Approval[]; canDecide: boolean; canCreate: boolean }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtDate = (d: string) => dateFmt.format(new Date(d));
  const catLabel = (v: string) => t(`approval.cat.${v}`);
  const statusLabel = (v: string) => t(`approval.status.${v}`);

  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/approvals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, amount: amount || null, description }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setTitle(''); setCategory('GENERAL'); setAmount(''); setDescription(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function decide(id: string, status: 'APPROVED' | 'REJECTED') {
    const note = status === 'REJECTED' ? (prompt(t('approval.notePrompt')) ?? '') : '';
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/approvals/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decisionNote: note }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('approval.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/approvals/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const decided = approvals.filter((a) => a.status !== 'PENDING');

  const card = (a: Approval) => (
    <article key={a.id} className={`apr-card apr-${a.status.toLowerCase()}`}>
      <div className="apr-top">
        <span className="apr-cat">{catLabel(a.category)}</span>
        <span className={`org-pill apr-badge-${a.status.toLowerCase()}`}>{statusLabel(a.status)}</span>
      </div>
      <h4>{a.title}</h4>
      {a.amount && <div className="apr-amount">{Number(a.amount).toLocaleString(locale === 'en' ? 'en' : 'ar-u-nu-latn')} <RiyalSign title={t('unit.sar')} /></div>}
      {a.description && <p className="apr-desc">{a.description}</p>}
      <div className="apr-meta">
        <span>{t('approval.by')}: {a.requestedByName ?? '—'}</span>
        <span>{fmtDate(a.createdAt)}</span>
      </div>
      {a.status !== 'PENDING' && (a.decidedByName || a.decisionNote) && (
        <div className="apr-decision">
          {a.decidedByName && <span>{t('approval.decidedBy')}: {a.decidedByName}</span>}
          {a.decisionNote && <p>{a.decisionNote}</p>}
        </div>
      )}
      {a.status === 'PENDING' && (canDecide || canCreate) && (
        <div className="apr-actions">
          {canDecide && (
            <>
              <button className="org-btn org-btn-primary" disabled={busyId === a.id} onClick={() => decide(a.id, 'APPROVED')}>{t('approval.approve')}</button>
              <button className="org-btn org-btn-danger" disabled={busyId === a.id} onClick={() => decide(a.id, 'REJECTED')}>{t('approval.reject')}</button>
            </>
          )}
          <button className="org-btn org-btn-ghost" disabled={busyId === a.id} onClick={() => remove(a.id)}>{t('view.delete')}</button>
        </div>
      )}
    </article>
  );

  return (
    <>
      {canCreate && (
        <div className="org-toolbar">
          <span className="org-toolbar-spacer" />
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('approval.new')}
          </button>
        </div>
      )}

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field">
            <label htmlFor="a-title">{t('approval.title')}</label>
            <input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="a-cat">{t('approval.category')}</label>
              <select id="a-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {APPROVAL_CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="a-amount">{t('approval.amount')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="a-amount" type="number" min="0" step="0.01" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="a-desc">{t('approval.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="a-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('approval.submit')}
            </button>
          </div>
        </form>
      )}

      {approvals.length === 0 ? (
        <div className="org-empty"><IconShape name="completed" variant="soft" size="xl" /><p>{t('approval.none')}</p></div>
      ) : (
        <>
          <h3 className="apr-section">{t('approval.pending')} <span className="org-board-count">{pending.length}</span></h3>
          {pending.length === 0 ? <div className="org-empty"><IconShape name="completed" variant="soft" size="xl" /><p>{t('approval.noPending')}</p></div> : <div className="apr-grid">{pending.map(card)}</div>}
          {decided.length > 0 && (
            <>
              <h3 className="apr-section">{t('approval.decided')} <span className="org-board-count">{decided.length}</span></h3>
              <div className="apr-grid">{decided.map(card)}</div>
            </>
          )}
        </>
      )}
    </>
  );
}
