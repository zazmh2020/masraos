'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface View { name: string; serial: number | null; balance: number; halaqa: string | null }

/** شاشة عرض كبيرة: امسح بطاقة الطالب (أو أدخل الرقم) فيظهر اسمه ورصيده. للعرض فقط. */
export default function DisplayScreen({ orgName }: { orgName: string }) {
  const { t } = useLocale();
  const [serial, setSerial] = useState('');
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const s = serial.trim();
    if (!s) return;
    try {
      const res = await fetch(`/api/org/points?serial=${encodeURIComponent(s)}`);
      const d = await res.json().catch(() => null);
      if (d?.ok) { setView({ name: d.student.name, serial: d.student.serial, balance: d.balance, halaqa: d.student.halaqa }); setError(''); }
      else { setView(null); setError(t(`pts.err.${d?.error?.code ?? 'NET'}`)); }
    } catch {
      setError(t('pts.err.NET'));
    } finally {
      setSerial('');
      inputRef.current?.focus();
    }
  }

  return (
    <div className="pts-display" onClick={() => inputRef.current?.focus()}>
      <form onSubmit={submit} className="pts-display-form">
        <input
          ref={inputRef}
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          className="pts-display-input"
          inputMode="numeric"
          autoComplete="off"
          aria-label={t('pts.serial')}
        />
      </form>
      {error && <div className="pts-display-error">{error}</div>}
      {view ? (
        <div className="pts-display-card">
          <div className="pts-display-name">{view.name}</div>
          {view.halaqa && <div className="pts-display-halaqa">{view.halaqa}</div>}
          <div className="pts-display-balance"><span>{t('pts.balance')}</span><strong>{view.balance}</strong></div>
          <div className="pts-display-serial">#{view.serial}</div>
        </div>
      ) : (
        <div className="pts-display-idle">{orgName}<span>{t('pts.ready')}</span></div>
      )}
    </div>
  );
}
