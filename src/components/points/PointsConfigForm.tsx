'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

/** ضبط "النقاط لكل مسح" — يظهر لمدير المؤسسة فقط في صفحة المسابقة. */
export default function PointsConfigForm({ perScan }: { perScan: number }) {
  const { t } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(String(perScan));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setStatus(null);
    try {
      const res = await fetch(`/api/org/points/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsPerScan: Number(value) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setStatus({ ok: true, msg: t('ptsCfg.saved') }); router.refresh(); }
      else setStatus({ ok: false, msg: data.error ?? t('form.saveErr') });
    } catch {
      setStatus({ ok: false, msg: t('form.netErr') });
    } finally { setBusy(false); }
  }

  return (
    <form className="pts-config" onSubmit={save}>
      <div className="pts-config-head">
        <span className="pts-config-title">{t('ptsCfg.title')}</span>
        <span className="pts-config-hint">{t('ptsCfg.hint')}</span>
      </div>
      <div className="pts-config-row">
        <input
          className="pts-config-input"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
          inputMode="numeric"
          aria-label={t('ptsCfg.title')}
        />
        <button className="org-btn org-btn-primary" disabled={busy || value === String(perScan) || value === ''}>
          {busy ? t('form.saving') : t('form.save')}
        </button>
      </div>
      {status && <div className={`org-alert ${status.ok ? 'is-ok' : ''}`} style={{ marginTop: '0.6rem' }}>{status.msg}</div>}
    </form>
  );
}
