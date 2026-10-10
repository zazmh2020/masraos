import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon from '@/components/Icon';
import '@/styles/dash2.css';

/* ============================================================
   لبنات اللوحة المشتركة — تُستخدم في سطح المكتب والجوال معًا.
   لا نسختين لكل مكوّن: التركيب يختلف بـ CSS (dash2.css) لا بإعادة العرض.
   ============================================================ */

export const numFmt = new Intl.NumberFormat('en-US');

/** مقياس: قيمة كبيرة + تسمية قصيرة + سياق. primary = المقياس المحوري الواحد في الشاشة. */
export function DashboardMetric({ label, value, hint, primary, href, trend, chart, bar }: {
  label: string; value: ReactNode; hint?: ReactNode; primary?: boolean; href?: string;
  /** شارة اتجاه (مثل «▲ 4%») بجانب القيمة. */
  trend?: { text: string; dir: 'up' | 'down' };
  /** رسم صغير (Sparkline) أسفل المقياس المحوري. */
  chart?: ReactNode;
  /** شريط ملوّن أسفل المقياس الداعم (درجة من سلّم الهوية). */
  bar?: 1 | 2 | 3;
}) {
  const body = (
    <>
      <span className="d2-metric-label">{label}</span>
      <span className="d2-metric-row">
        <span className="d2-metric-value">{value}</span>
        {trend && <span className={`d2-trend is-${trend.dir}`}>{trend.dir === 'up' ? '▲' : '▼'} {trend.text}</span>}
      </span>
      {hint && <span className="d2-metric-hint">{hint}</span>}
      {chart}
      {bar && <span className={`d2-metric-bar b${bar}`} aria-hidden="true" />}
    </>
  );
  const cls = `d2-metric ${primary ? 'is-primary' : ''}`;
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** شارة حالة — من ألوان الحالة المعتمدة. */
export function StatusBadge({ tone = 'muted', children }: { tone?: 'green' | 'amber' | 'muted'; children: ReactNode }) {
  return <span className={`d2-badge is-${tone}`}>{children}</span>;
}

/** شريط تقدّم مع نص (الحاضر/المسجَّل…). */
export function ProgressSummary({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="d2-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span className="d2-progress-bar"><span style={{ inlineSize: `${pct}%` }} /></span>
      <span className="d2-progress-txt">{label}</span>
    </div>
  );
}

/** صف حلقة: الاسم والموعد والمعلّم وعدد الطلاب وحالة حضور اليوم. */
export function HalaqaSummary({ href, name, schedule, teacher, students, unit, status }: {
  href: string; name: string; schedule?: string | null; teacher?: string | null; students: number; unit: string; status: ReactNode;
}) {
  return (
    <li className="d2-halaqa">
      <div className="d2-halaqa-main">
        <Link href={href} className="d2-halaqa-name">{name}</Link>
        {schedule && <span className="d2-muted">{schedule}</span>}
      </div>
      {teacher !== undefined && <span className="d2-halaqa-teacher d2-muted">{teacher ?? '—'}</span>}
      <span className="d2-halaqa-count"><span className="d2-count-n">{numFmt.format(students)}</span> <span className="d2-count-unit">{unit}</span></span>
      <span className="d2-halaqa-status">{status}</span>
    </li>
  );
}

/** طالب يحتاج متابعة. */
export function StudentAttentionItem({ href, name, detail }: { href?: string; name: string; detail: string }) {
  return (
    <li className="d2-row">
      <span className="d2-row-main">{href ? <Link href={href} className="d2-link">{name}</Link> : <strong>{name}</strong>}</span>
      <span className="d2-muted">{detail}</span>
    </li>
  );
}

/** عنصر نشاط حديث. */
export function ActivityItem({ name, text, when }: { name: string; text: string; when: string }) {
  return (
    <li className="d2-row">
      <span className="d2-row-main"><strong>{name}</strong></span>
      <span className="d2-muted">{text} · {when}</span>
    </li>
  );
}

/** إجراء سريع: بلاط بأيقونة (primary = الإجراء الأساسي الواحد). */
export function QuickAction({ href, icon, label, primary }: { href: string; icon: string; label: string; primary?: boolean }) {
  return (
    <Link href={href} className={`d2-action ${primary ? 'is-primary' : ''}`}>
      <Icon name={icon} size={20} tone={primary ? 'line' : 'duo'} />
      <span>{label}</span>
    </Link>
  );
}

/** قسم بطاقة بعنوان ورابط «عرض الكل». */
export function Panel({ title, more, children, secondary, className = '' }: {
  title: string; more?: { href: string; label: string }; children: ReactNode; secondary?: boolean; className?: string;
}) {
  return (
    <section className={`d2-panel ${secondary ? 'is-secondary' : ''} ${className}`}>
      <header className="d2-panel-hd">
        <h2>{title}</h2>
        {more && <Link href={more.href} className="d2-link">{more.label} <span className="d2-arrow" aria-hidden="true">←</span></Link>}
      </header>
      {children}
    </section>
  );
}

/** حالة فارغة قصيرة. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="d2-empty">{children}</p>;
}

/** شريط إجراء ثابت أسفل الشاشة على الجوال فقط — يحترم المناطق الآمنة. */
export function MobileActionBar({ children }: { children: ReactNode }) {
  return <div className="d2-actionbar">{children}</div>;
}

/** خط بياني صغير بلا محاور (اتجاه الأيام) — يتخطّى الأيام بلا بيانات. */
export function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const pts = values.map((v, i) => (v === null ? null : { x: (i / Math.max(1, values.length - 1)) * 100, y: 100 - v })).filter((p): p is { x: number; y: number } => !!p);
  if (pts.length < 2) return null;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} 100 L${pts[0].x.toFixed(1)} 100 Z`;
  return (
    <svg className="d2-spark" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={area} className="d2-spark-area" />
      <path d={line} className="d2-spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
