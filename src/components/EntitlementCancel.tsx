'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

/** إلغاء انضمام مؤسسة للبرنامج (لمالك المنصّة) — مع سبب إلزامي مختصر. */
export default function EntitlementCancel({ id }: { id: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function cancel() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/entitlement/${id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setOpen(false); router.refresh(); }
      else setError(d.error ?? t('form.saveErr'));
    } catch { setError(t('form.netErr')); }
    finally { setBusy(false); }
  }

  if (!open) {
    return <button type="button" className="btn-admin-outline entadm-cancel" onClick={() => setOpen(true)}>{t('entadm.cancel')}</button>;
  }
  return (
    <div className="entadm-cancelbox">
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder={t('entadm.reasonPh')} maxLength={500} />
      {error && <div className="org-alert">{error}</div>}
      <div className="entadm-cancelbtns">
        <button type="button" className="btn-admin-outline" onClick={() => setOpen(false)} disabled={busy}>{t('shell.cancel')}</button>
        <button type="button" className="btn-admin-danger" onClick={cancel} disabled={busy}>{busy ? t('form.saving') : t('entadm.confirmCancel')}</button>
      </div>
    </div>
  );
}
