'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FINANCE_CATEGORIES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import RiyalSign from '@/components/RiyalSign';

type Tx = {
  id: string; kind: string; category: string; amount: number;
  date: string; description: string | null; by: string | null;
};
type MonthPoint = { label: string; income: number; expense: number };

export default function FinanceView({
  transactions, summary, monthly, canManage,
}: {
  transactions: Tx[];
  summary: { income: number; expense: number; net: number };
  monthly: MonthPoint[];
  canManage: boolean;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-u-nu-latn', { maximumFractionDigits: 0 });
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const moneyText = (n: number) => `${nf.format(n)} ${t('unit.sar')}`; // للسمات النصية (title)
  const money = (n: number) => <>{nf.format(n)} <RiyalSign title={t('unit.sar')} /></>;
  const catLabel = (v: string) => t(`fin.cat.${v}`);
  const kindLabel = (v: string) => t(`fin.kind.${v}`);

  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [kind, setKind] = useState('INCOME');
  const [category, setCategory] = useState('FEES');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const rows = useMemo(
    () => (filter === 'ALL' ? transactions : transactions.filter((x) => x.kind === filter)),
    [transactions, filter],
  );
  const chartMax = Math.max(1, ...monthly.map((m) => Math.max(m.income, m.expense)));

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, category, amount, date, description }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setAmount(''); setDescription(''); setDate(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('fin.deleteConfirm'))) return;
    setBusyId(id); setError('');
    try {
      const res = await fetch(`/api/org/finance/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      {/* بطاقات الملخّص */}
      <div className="fin-summary">
        <div className="fin-tile fin-in"><span className="fin-tile-lbl">{t('fin.income')}</span><span className="fin-tile-val">{money(summary.income)}</span></div>
        <div className="fin-tile fin-ex"><span className="fin-tile-lbl">{t('fin.expense')}</span><span className="fin-tile-val">{money(summary.expense)}</span></div>
        <div className={`fin-tile ${summary.net >= 0 ? 'fin-net-pos' : 'fin-net-neg'}`}>
          <span className="fin-tile-lbl">{t('fin.net')}</span>
          <span className="fin-tile-val">{summary.net >= 0 ? '' : '−'}{money(Math.abs(summary.net))}</span>
        </div>
      </div>

      {/* مخطّط شهري: دخل مقابل مصروف */}
      {monthly.some((m) => m.income || m.expense) && (
        <div className="fin-chart">
          <div className="fin-chart-head">
            <h3>{t('fin.monthly')}</h3>
            <div className="fin-legend"><span className="fin-dot fin-dot-in" />{t('fin.income')}<span className="fin-dot fin-dot-ex" />{t('fin.expense')}</div>
          </div>
          <div className="fin-bars">
            {monthly.map((m) => (
              <div key={m.label} className="fin-bar-col">
                <div className="fin-bar-pair">
                  <span className="fin-bar fin-bar-in" style={{ height: `${(m.income / chartMax) * 100}%` }} title={moneyText(m.income)} />
                  <span className="fin-bar fin-bar-ex" style={{ height: `${(m.expense / chartMax) * 100}%` }} title={moneyText(m.expense)} />
                </div>
                <span className="fin-bar-lbl">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* شريط الأدوات */}
      <div className="org-toolbar fin-toolbar">
        <div className="fin-filter">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
            <button key={f} className={`fin-filter-opt ${filter === f ? 'is-active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? t('fin.all') : kindLabel(f)}
            </button>
          ))}
        </div>
        <span className="org-toolbar-spacer" />
        {canManage && <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>{creating ? t('shell.cancel') : t('fin.new')}</button>}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="f-kind">{t('fin.type')}</label>
              <select id="f-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="INCOME">{t('fin.kind.INCOME')}</option>
                <option value="EXPENSE">{t('fin.kind.EXPENSE')}</option>
              </select></div>
            <div className="org-field"><label htmlFor="f-cat">{t('fin.category')}</label>
              <select id="f-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {FINANCE_CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select></div>
          </div>
          <div className="org-field-row">
            <div className="org-field"><label htmlFor="f-amount">{t('fin.amount')}</label>
              <input id="f-amount" type="number" min="0" step="0.01" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
            <div className="org-field"><label htmlFor="f-date">{t('fin.date')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="org-field"><label htmlFor="f-desc">{t('fin.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="f-desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>{busyId === '__new' ? t('form.saving') : t('fin.save')}</button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <div className="org-empty"><IconShape name="analytics" variant="soft" size="xl" /><p>{t('fin.none')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead><tr>
              <th>{t('fin.date')}</th><th>{t('fin.category')}</th><th>{t('fin.amount')}</th><th>{t('fin.desc')}</th>{canManage && <th></th>}
            </tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>{dateFmt.format(new Date(x.date))}{x.by && <small>{x.by}</small>}</td>
                  <td><span className={`org-pill ${x.kind === 'INCOME' ? 'org-pill-ok' : 'fin-pill-ex'}`}>{kindLabel(x.kind)}</span> {catLabel(x.category)}</td>
                  <td dir="ltr" className={x.kind === 'INCOME' ? 'fin-amt-in' : 'fin-amt-ex'}>{x.kind === 'INCOME' ? '+' : '−'}{money(x.amount)}</td>
                  <td>{x.description ?? '—'}</td>
                  {canManage && <td className="org-row-actions"><button className="org-btn org-btn-danger" disabled={busyId === x.id} onClick={() => remove(x.id)}>{t('view.delete')}</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
