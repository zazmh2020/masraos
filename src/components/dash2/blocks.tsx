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
export function DashboardMetric({ label, value, hint, primary, href }: {
  label: string; value: ReactNode; hint?: ReactNode; primary?: boolean; href?: string;
}) {
  const body = (
    <>
      <span className="d2-metric-label">{label}</span>
      <span className="d2-metric-value">{value}</span>
      {hint && <span className="d2-metric-hint">{hint}</span>}
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
