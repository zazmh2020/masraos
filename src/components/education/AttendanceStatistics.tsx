'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { attendanceLabels } from '@/lib/attendance-statistics';
import styles from './statistics.module.css';

type Counts = { PRESENT: number; LATE: number; ABSENT: number; EXCUSED: number };
type Detail = { date: string; name: string; halaqa: string; status: keyof typeof attendanceLabels };
type Data = { counts: Counts; total: number; conflicts: number; activeStudents: number; eligible: number | null;
  unrecorded: number | null; attendanceRate: number | null; generatedAt: string; repeatedAbsence?: { name: string; count: number }[];
  daily: (Counts & { date: string })[]; groups: (Counts & { id: string; name: string; total: number; attendanceRate: number | null; unrecorded: number | null })[]; details?: Detail[] };
type Ref = { id: string; name: string };
function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }

export default function AttendanceStatistics({ orgName, halaqat, teachers, display }: { orgName: string; halaqat: Ref[]; teachers: Ref[]; display: boolean }) {
  const [start, setStart] = useState(today); const [end, setEnd] = useState(today);
  const [halaqa, setHalaqa] = useState(''); const [teacher, setTeacher] = useState('');
  const [status, setStatus] = useState('ALL'); const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [reload, setReload] = useState(0); const screen = useRef<HTMLDivElement>(null);
  const refresh = useCallback(() => setReload(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setBusy(true); setError(''); setData(null);
      try {
        const query = new URLSearchParams({ start, end, halaqa, teacher, display: display ? '1' : '0' });
        const response = await fetch(`/api/org/education/attendance/statistics?${query}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'تعذر تحميل الإحصاءات.');
        if (!controller.signal.aborted) setData(result);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'تعذر الاتصال.'); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }
    void load(); return () => controller.abort();
  }, [start, end, halaqa, teacher, display, reload]);
  useEffect(() => { if (!display) return; const timer = setInterval(refresh, 60000); return () => clearInterval(timer); }, [display, refresh]);
  const details = (data?.details ?? []).filter(r => status === 'ALL' || r.status === status);
  function exportCsv() {
    // Escape formula prefixes as well as CSV quotes; names are user-controlled.
    const cell = (v: string) => `"${(/^[\s]*[=+@-]|^[\t\r\n]/.test(v) ? "'" + v : v).replaceAll('"', '""')}"`;
    const rows = [['التاريخ', 'الطالب', 'الحلقة', 'الحالة'], ...details.map(r => [r.date, r.name, r.halaqa, attendanceLabels[r.status]])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `attendance-${start}-${end}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div ref={screen} className={`${styles.root} ${display ? styles.display : ''}`} dir="rtl">
    <style media="print">{'@page { size: A4 portrait; margin: 12mm; }'}</style>
    <h1>{orgName} — إحصاءات الحضور والغياب</h1>
    <div className={styles.filters}>
      <label>من <input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>إلى <input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label>الحلقة <select value={halaqa} onChange={e => setHalaqa(e.target.value)}><option value="">جميع الحلقات</option>{halaqat.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
      {!display && <label>المعلم <select value={teacher} onChange={e => setTeacher(e.target.value)}><option value="">جميع المعلمين</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
      <button className="org-btn org-btn-outline" disabled={busy} onClick={refresh}>تحديث</button>
      {!display && <a className="org-btn org-btn-outline" href="?display=1">شاشة عرض دون أسماء الطلاب</a>}
      {display && <button className="org-btn org-btn-primary" onClick={() => { void screen.current?.requestFullscreen().catch(() => setError('لم يسمح المتصفح بملء الشاشة. يمكنك استخدام F11.')); }}>ملء الشاشة</button>}
    </div>
    <p>{start} — {end}</p>
    {busy && <p role="status">جارٍ تحميل الإحصاءات…</p>}
    {error && <p role="alert" className="org-alert">{error}</p>}
    {data && <>
      <div className={styles.cards}>
        {(Object.keys(data.counts) as (keyof Counts)[]).map(k => <button key={k} className={`${styles.card} ${styles[k]}`} onClick={() => setStatus(status === k ? 'ALL' : k)} disabled={display}>
          <span>{attendanceLabels[k]}</span><strong>{data.counts[k]}</strong><small>{start === end ? 'طالب / يوم' : 'سجل طالب / يوم'}</small></button>)}
        <button className={styles.card} onClick={() => setStatus(status === 'UNRECORDED' ? 'ALL' : 'UNRECORDED')} disabled={display || data.unrecorded == null}><span>لم يُسجّل</span><strong>{data.unrecorded ?? '—'}</strong></button>
        <div className={styles.card}><span>نسبة الحضور</span><strong>{data.attendanceRate == null ? '—' : `${data.attendanceRate}%`}</strong></div>
      </div>
      <p>نسبة الحضور = (الحاضر + المتأخر) ÷ (الحاضر + المتأخر + الغائب). يُستثنى العذر وعدم التسجيل.</p>
      <p>الطلاب المنتظمون حاليًا ضمن الاختيار: {data.activeStudents}{data.eligible != null ? ` · المسجلون حتى اليوم المحدد: ${data.eligible}` : ''}.</p>
      <p>المصدر: كشف الحضور أولًا، والكشف الشهري عند غياب سجل الحضور. لم يُسجّل لا يعني غائبًا.</p>
      <p>عدم التسجيل ليوم واحد يُقارن بقائمة الطلاب المنتظمين الحالية المسندين للحلقات والمسجلين حتى ذلك اليوم، وليس بجدول حصص معتمد. لا يُحسب للفترة لأن مواعيد الحلقات وصفية ولأن عضوية الطلاب التاريخية غير محفوظة.</p>
      {data.conflicts > 0 && <p role="alert" className="org-alert">يوجد {data.conflicts} سجلًا مختلفًا بين المصادر أو الحلقات؛ استُخدم كشف الحضور دون مضاعفة الطالب. راجع الاختلاف قبل اعتماد التقرير.</p>}
      {data.total === 0 && <p className="org-empty">لا توجد سجلات حضور في الفترة المحددة. لا تُعدّ الأرقام الصفرية دليلًا على الغياب.</p>}
      <h2>المقارنة بين الحلقات</h2><div className="org-table-wrap"><table className="org-table"><thead><tr><th>الحلقة</th><th>حاضر</th><th>متأخر</th><th>غائب</th><th>بعذر</th><th>لم يُسجّل</th><th>نسبة الحضور</th></tr></thead><tbody>
        {data.groups.map(g => <tr key={g.id}><td>{g.name}</td><td>{g.PRESENT}</td><td>{g.LATE}</td><td>{g.ABSENT}</td><td>{g.EXCUSED}</td><td>{g.unrecorded ?? '—'}</td><td>{g.attendanceRate == null ? '—' : `${g.attendanceRate}%`}</td></tr>)}
      </tbody></table></div>
      <h2>الحضور خلال الفترة</h2><div className={styles.trend}>{data.daily.map(d => {
        const all = d.PRESENT + d.LATE + d.ABSENT + d.EXCUSED;
        return <div key={d.date}><span>{d.date}</span><meter min={0} max={all || 1} value={d.PRESENT + d.LATE} /> <span>{d.PRESENT + d.LATE} حاضر أو متأخر / {all} سجل</span></div>;
      })}</div>
      {!display && <>
        <h2>الغياب المتكرر</h2>
        <p>ثلاثة أيام غياب دون عذر أو أكثر خلال الفترة المختارة؛ مؤشر متابعة وليس قرارًا تأديبيًا.</p>
        {(data.repeatedAbsence?.length ?? 0) > 0 ? <ul>{data.repeatedAbsence!.map((s, i) => <li key={i}>{s.name}: {s.count} أيام</li>)}</ul> : <p>لا توجد حالات وفق هذا المعيار في الفترة.</p>}
        <h2>تفاصيل السجلات</h2><p>الحالة المعروضة: {status === 'ALL' ? 'الكل' : attendanceLabels[status as keyof typeof attendanceLabels]}</p><div className={styles.filters}>
          <label>الحالة <select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">الكل</option>{Object.entries(attendanceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <button className="org-btn org-btn-outline" onClick={exportCsv}>تصدير CSV للاختيار</button>
          <button className="org-btn org-btn-outline" onClick={() => window.print()}>طباعة / حفظ PDF</button>
        </div>
        <div className="org-table-wrap"><table className="org-table"><thead><tr><th>التاريخ</th><th>الطالب</th><th>الحلقة</th><th>الحالة</th></tr></thead><tbody>{details.map((r, i) => <tr key={i}><td>{r.date}</td><td>{r.name}</td><td>{r.halaqa}</td><td>{attendanceLabels[r.status]}</td></tr>)}</tbody></table></div>
      </>}
      <footer>آخر تحديث: {new Date(data.generatedAt).toLocaleString('ar-SA')}{display ? ' · تحديث تلقائي كل دقيقة · العرض يتطلب حسابًا مصرحًا' : ''}</footer>
    </>}
  </div>;
}
