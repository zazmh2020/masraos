'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Mode = 'earn' | 'redeem';
interface ScanResult {
  student: { name: string; serial: number | null };
  action: 'earn' | 'redeem';
  amount: number;
  balance: number;
  duplicate: boolean;
}

export default function ScannerConsole({ slug, perScan, canRedeem }: { slug: string; perScan: number; canRedeem: boolean }) {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>('earn');
  const [serial, setSerial] = useState('');
  const [amount, setAmount] = useState(String(perScan));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<ScanResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const s = serial.trim();
    if (!s || busy) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/org/points/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial: s,
          action: mode,
          amount: mode === 'redeem' ? Number(amount) : undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        const r: ScanResult = data;
        setResult(r);
        setRecent((prev) => [r, ...prev].slice(0, 8));
        setSerial('');
      } else {
        setResult(null);
        setError(t(`pts.err.${data?.error?.code ?? 'NET'}`));
      }
    } catch {
      setError(t('pts.err.NET'));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="pts-console">
      <div className="pts-modes">
        <button type="button" className={`pts-mode ${mode === 'earn' ? 'is-on' : ''}`} onClick={() => setMode('earn')}>{t('pts.scan')}</button>
        {canRedeem && (
          <button type="button" className={`pts-mode ${mode === 'redeem' ? 'is-on redeem' : ''}`} onClick={() => setMode('redeem')}>{t('pts.redeem')}</button>
        )}
        <span className="pts-modes-spacer" />
        <Link href={`/org/${slug}/points/cards`} className="org-btn org-btn-outline">{t('pts.cards')}</Link>
        <Link href={`/org/${slug}/points/display`} className="org-btn org-btn-outline" target="_blank">{t('pts.display')} ↗</Link>
      </div>

      <form className="pts-scanbar" onSubmit={submit}>
        <input
          ref={inputRef}
          className="pts-input"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder={t('pts.serialPh')}
          inputMode="numeric"
          autoComplete="off"
          aria-label={t('pts.serial')}
        />
        {mode === 'redeem' && (
          <input
            className="pts-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            aria-label={t('pts.amount')}
          />
        )}
        <button className={`org-btn ${mode === 'redeem' ? 'org-btn-danger' : 'org-btn-primary'}`} disabled={busy}>{t('pts.go')}</button>
      </form>

      {error && <div className="org-alert" style={{ marginTop: '0.9rem' }}>{error}</div>}

      {result && (
        <div className={`pts-result ${result.action === 'redeem' ? 'is-redeem' : 'is-earn'}`}>
          <div className="pts-result-name">{result.student.name}<span className="pts-result-serial">#{result.student.serial}</span></div>
          <div className="pts-result-delta">
            {result.action === 'redeem' ? '−' : '+'}{result.amount}
            <span>{result.action === 'redeem' ? t('pts.deducted') : t('pts.earned')}</span>
          </div>
          <div className="pts-result-balance">{t('pts.balance')}: <strong>{result.balance}</strong></div>
          {result.duplicate && <div className="pts-dup">{t('pts.duplicate')}</div>}
        </div>
      )}

      <h2 className="org-settings-h2">{t('pts.recent')}</h2>
      {recent.length === 0 ? (
        <div className="org-empty">{t('pts.none')}</div>
      ) : (
        <div className="pts-recent">
          {recent.map((r, i) => (
            <div key={i} className="pts-recent-row">
              <span className="pts-recent-name">{r.student.name} <span className="pts-recent-serial">#{r.student.serial}</span></span>
              <span className={`pts-recent-delta ${r.action === 'redeem' ? 'redeem' : 'earn'}`}>{r.action === 'redeem' ? '−' : '+'}{r.amount}</span>
              <span className="pts-recent-bal">{r.balance}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
