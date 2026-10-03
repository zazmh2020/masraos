import type { ReactNode } from 'react';
import Icon from '@/components/Icon';
import { CalmIcon, type CalmIconName } from './icons';

export type Tone = 'lav' | 'sand' | 'rose' | 'mint' | 'sky';
export type StatusKind = 'done' | 'late' | 'wait' | 'new';

/* ---------------- رأس الصفحة ---------------- */
export function PageHead({ title, sub, lead, actions }: { title: ReactNode; sub?: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="calm-head">
      <div>
        {lead ? <div className="calm-person">{lead}<h1>{title}</h1></div> : <h1>{title}</h1>}
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="calm-head-actions">{actions}</div>}
    </div>
  );
}

export function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="calm-section-head"><h2>{title}</h2>{children}</div>;
}

/* ---------------- أزرار وشرائح ---------------- */
export function FilterButton({ count }: { count?: number }) {
  return (
    <button type="button" className="calm-filter">
      <CalmIcon name="filter" size={16} />
      <span>تصفية</span>
      {count ? <span className="n">{count}</span> : null}
    </button>
  );
}

export function Pills({ items, active, label, withCheck }: { items: string[]; active: string; label: string; withCheck?: boolean }) {
  return (
    <div className="calm-pills" role="tablist" aria-label={label}>
      {items.map((it) => (
        <button key={it} type="button" role="tab" aria-selected={it === active} className={`calm-pill ${it === active ? 'is-active' : ''}`}>
          {withCheck && it === active && <CalmIcon name="check" size={15} />}
          {it}
        </button>
      ))}
    </div>
  );
}

export function Status({ kind, children }: { kind: StatusKind; children: ReactNode }) {
  const icon: Record<StatusKind, CalmIconName> = { done: 'check', late: 'clock', wait: 'x', new: 'pending' };
  return <span className={`calm-status is-${kind}`}><CalmIcon name={icon[kind]} size={13} />{children}</span>;
}

/* ---------------- بطاقات الإحصاء ---------------- */
export function StatCard({ title, icon, link, children }: { title: string; icon: string; link?: string; children: ReactNode }) {
  return (
    <section className="calm-card calm-stat">
      <div className="calm-stat-top">
        <span className="calm-stat-title"><span className="ico"><Icon name={icon} size={16} /></span>{title}</span>
        {link && <a href="#" className="calm-section-head link" style={{ fontSize: 13, color: 'var(--c-muted)' }}>{link}</a>}
      </div>
      {children}
    </section>
  );
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="calm-num">{value}</div>
      <div className="calm-num-label">{label}<CalmIcon name="info" size={14} /></div>
    </div>
  );
}

/** خطّ اتجاه صغير — نقاط من 0 إلى 100 */
export function Sparkline({ points }: { points: number[] }) {
  const w = 96, h = 44, step = w / (points.length - 1);
  const xy = points.map((p, i) => [w - i * step, h - (p / 100) * (h - 4) - 2]); // يُرسم من اليمين لليسار (RTL)
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${xy[xy.length - 1][0]},${h} L${w},${h} Z`;
  return (
    <svg className="calm-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id="calmSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-brand)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--c-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#calmSpark)" />
      <path d={line} fill="none" stroke="var(--c-brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Bars({ values, highlight = [] }: { values: number[]; highlight?: number[] }) {
  return (
    <div className="calm-bars" aria-hidden>
      {values.map((v, i) => <i key={i} className={highlight.includes(i) ? '' : 'is-dim'} style={{ height: `${v}%` }} />)}
    </div>
  );
}

/* ---------------- بلاطات الحالة ---------------- */
export function Tile({ tone = 'lav', icon, value, label, meter, meterOn }: { tone?: Tone; icon: CalmIconName; value: string; label: string; meter?: number; meterOn?: number }) {
  return (
    <a href="#" className={`calm-tile ${tone === 'lav' ? '' : `is-${tone}`}`}>
      <span className="orb"><CalmIcon name={icon} size={18} /></span>
      <span><b>{value}</b><small>{label}</small></span>
      {meter ? (
        <span className="meter" style={{ color: `var(--t-${tone}-ink)` }} aria-hidden>
          {Array.from({ length: meter }, (_, i) => <i key={i} className={i >= meter - (meterOn ?? 0) ? 'on' : ''} />)}
        </span>
      ) : (
        <span className="go"><CalmIcon name="chevronEnd" size={18} /></span>
      )}
    </a>
  );
}

/* ---------------- التقويم الشهري ---------------- */
const DOW = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function MonthCalendar({
  month, startOffset, days, today, has = [], marks = {}, note,
}: {
  month: string; startOffset: number; days: number; today: number;
  has?: number[]; marks?: Record<number, 'lav' | 'rose' | 'sky'>; note?: string;
}) {
  return (
    <div>
      <div className="calm-cal-head">
        <span className="calm-cal-month">
          <button type="button" className="calm-icon-btn" aria-label="الشهر السابق"><CalmIcon name="chevronStart" size={16} /></button>
          {month}
          <button type="button" className="calm-icon-btn" aria-label="الشهر التالي"><CalmIcon name="chevronEnd" size={16} /></button>
        </span>
        <FilterButton count={1} />
      </div>
      <div className="calm-cal" role="grid" aria-label={month}>
        {DOW.map((d) => <span key={d} className="dow">{d}</span>)}
        {Array.from({ length: startOffset }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const cls = d === today ? 'is-today' : has.includes(d) ? 'has' : '';
          return (
            <span key={d} className={`calm-day ${cls}`} aria-current={d === today ? 'date' : undefined}>
              {d}
              {marks[d] && d !== today && <span className={`mark ${marks[d]}`} />}
            </span>
          );
        })}
      </div>
      {note && <div className="calm-cal-note"><span className="calm-ava is-sm" style={{ background: 'var(--c-ink)', color: '#fff' }}>9</span>{note}</div>}
    </div>
  );
}
