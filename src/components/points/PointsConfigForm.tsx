'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

/** إعدادات مسابقة النقاط (النقاط لكل مسح + مدة تدوير لوحة الترتيب) — لمدير المؤسسة. */
export default function PointsConfigForm({ perScan, rotateSec }: { perScan: number; rotateSec: number }) {
  const { t } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(String(perScan));
  const [rotate, setRotate] = useState(String(rotateSec));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const unchanged = value === String(perScan) && rotate === String(rotateSec);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setStatus(null);
    try {
      const res = await fetch(`/api/org/points/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsPerScan: Number(value), boardRotateSec: Number(rotate) }),
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
      <div className="pts-config-grid">
        <div className="pts-config-field">
          <div className="pts-config-head">
            <span className="pts-config-title">{t('ptsCfg.title')}</span>
            <span className="pts-config-hint">{t('ptsCfg.hint')}</span>
          </div>
          <input
            className="pts-config-input"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            aria-label={t('ptsCfg.title')}
          />
        </div>
        <div className="pts-config-field">
          <div className="pts-config-head">
            <span className="pts-config-title">{t('ptsCfg.rotateTitle')}</span>
            <span className="pts-config-hint">{t('ptsCfg.rotateHint')}</span>
          </div>
          <input
            className="pts-config-input"
            value={rotate}
            onChange={(e) => setRotate(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            aria-label={t('ptsCfg.rotateTitle')}
          />
        </div>
      </div>
      <div className="pts-config-actions">
        <button className="org-btn org-btn-primary" disabled={busy || unchanged || value === '' || rotate === ''}>
          {busy ? t('form.saving') : t('form.save')}
        </button>
      </div>
      {status && <div className={`org-alert ${status.ok ? 'is-ok' : ''}`} style={{ marginTop: '0.6rem' }}>{status.msg}</div>}
    </form>
  );
}
