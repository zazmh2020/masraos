'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { ATTENDANCE_STATUSES } from '@/lib/permissions';
import { SURAHS, MAJOR_SEGMENTS, MINOR_SEGMENTS } from '@/lib/quran';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import {
  SUMMARY_LABELS, computeMonthSummary, mergeLabels, scoreLabel, type BiLabel,
} from '@/lib/quran-summary';

type Row = {
  day: number; dateStr: string; weekday: number;
  attendance: string;
  newFrom: number | null; newTo: number | null; newNote: string | null;
  reviewFrom: number | null; reviewTo: number | null;
  last5From: number | null; last5To: number | null;
  listener: string | null; pages: number | null;
  errors: number | null; alerts: number | null;
  lessonScore: number | null; reviewScore: number | null; minorScore: number | null;
  conductScore: number | null; otherScore: number | null;
  notes: string | null; exists: boolean;
};
type Student = { id: string; name: string; halaqa: string | null };

const NUM_FIELDS = [
  'newFrom', 'newTo', 'reviewFrom', 'reviewTo', 'last5From', 'last5To', 'pages', 'errors', 'alerts',
  'lessonScore', 'reviewScore', 'minorScore', 'conductScore', 'otherScore',
] as const;

const SCORE_FIELDS = ['lessonScore', 'reviewScore', 'minorScore', 'conductScore', 'otherScore'] as const;

// عبارات ملاحظات جاهزة مصنّفة (تُترجَم بالمفاتيح)
const NOTE_PRESETS: { group: string; keys: string[] }[] = [
  { group: 'qm.note.grp.detailed', keys: ['qm.note.d1', 'qm.note.d2', 'qm.note.d3', 'qm.note.d4'] },
  { group: 'qm.note.grp.discipline', keys: ['qm.note.p1', 'qm.note.p2', 'qm.note.p3'] },
  { group: 'qm.note.grp.guardian', keys: ['qm.note.g1', 'qm.note.g2', 'qm.note.g3'] },
];

export default function MonthlySheetView({
  students, selectedId, studentName, halaqaName, ym, rows, canManage,
  orgName, orgLogo = null, monthLabel, year, summaryLabels, canCustomize = false,
}: {
  students: Student[]; selectedId: string; studentName: string; halaqaName: string | null;
  ym: string; rows: Row[]; canManage: boolean;
  orgName: string; orgLogo?: string | null; monthLabel: string; year: string;
  summaryLabels: unknown; canCustomize?: boolean;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const wdFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { weekday: 'short' });

  const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  const [data, setData] = useState<Record<string, Record<string, string>>>(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      out[r.dateStr] = {
        attendance: r.attendance,
        newFrom: toStr(r.newFrom), newTo: toStr(r.newTo), newNote: toStr(r.newNote),
        reviewFrom: toStr(r.reviewFrom), reviewTo: toStr(r.reviewTo),
        last5From: toStr(r.last5From), last5To: toStr(r.last5To),
        listener: toStr(r.listener), pages: toStr(r.pages),
        errors: toStr(r.errors), alerts: toStr(r.alerts),
        lessonScore: toStr(r.lessonScore), reviewScore: toStr(r.reviewScore), minorScore: toStr(r.minorScore),
        conductScore: toStr(r.conductScore), otherScore: toStr(r.otherScore),
        notes: toStr(r.notes),
      };
    }
    return out;
  });
  const [saved, setSaved] = useState<Record<string, 'saving' | 'ok' | 'err'>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);
  const [sending, setSending] = useState<'month' | 'day' | null>(null);
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState(false);

  async function sendReport(scope: 'month' | 'day') {
    if (sending) return;
    setSending(scope); setSendMsg(null);
    try {
      const res = await fetch('/api/org/education/monthly/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedId, ym, scope }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) setSendMsg({ ok: true, text: t('qm.sentTo', { email: d.to }) });
      else if (d.reason === 'not_configured') setSendMsg({ ok: false, text: t('qm.emailNotConfigured') });
      else setSendMsg({ ok: false, text: t('qm.sendFailed') });
    } catch { setSendMsg({ ok: false, text: t('form.netErr') }); }
    finally { setSending(null); }
  }

  function navigate(next: { student?: string; ym?: string }) {
    const params = new URLSearchParams({ student: next.student ?? selectedId, ym: next.ym ?? ym });
    router.push(`${pathname}?${params.toString()}`);
  }

  async function save(dateStr: string) {
    if (!canManage) return;
    const row = dataRef.current[dateStr];
    setSaved((s) => ({ ...s, [dateStr]: 'saving' }));
    try {
      const res = await fetch('/api/org/education/monthly', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedId, date: dateStr, ...row }),
      });
      setSaved((s) => ({ ...s, [dateStr]: res.ok ? 'ok' : 'err' }));
    } catch { setSaved((s) => ({ ...s, [dateStr]: 'err' })); }
  }

  function set(dateStr: string, field: string, value: string) {
    setData((d) => ({ ...d, [dateStr]: { ...d[dateStr], [field]: value } }));
    clearTimeout(timers.current[dateStr]);
    timers.current[dateStr] = setTimeout(() => save(dateStr), 600);
  }

  function setRange(dateStr: string, fromField: string, toField: string, encoded: string) {
    const [from, to] = encoded ? encoded.split('-') : ['', ''];
    setData((d) => ({ ...d, [dateStr]: { ...d[dateStr], [fromField]: from, [toField]: to } }));
    clearTimeout(timers.current[dateStr]);
    timers.current[dateStr] = setTimeout(() => save(dateStr), 600);
  }
  const rangeVal = (dateStr: string, fromField: string, toField: string) => {
    const f = data[dateStr]?.[fromField], t2 = data[dateStr]?.[toField];
    return f && t2 ? `${f}-${t2}` : '';
  };

  const surahCell = (r: Row) => (
    <select className="qm-in qm-surah" disabled={!canManage}
      value={data[r.dateStr]?.newFrom ?? ''} onChange={(e) => set(r.dateStr, 'newFrom', e.target.value)}>
      <option value="">—</option>
      {SURAHS.map((name, i) => <option key={i} value={i + 1}>{i + 1}. {name}</option>)}
    </select>
  );
  const segCell = (r: Row, segs: typeof MAJOR_SEGMENTS, fromField: string, toField: string) => (
    <select className="qm-in qm-seg" disabled={!canManage}
      value={rangeVal(r.dateStr, fromField, toField)} onChange={(e) => setRange(r.dateStr, fromField, toField, e.target.value)}>
      <option value="">—</option>
      {segs.map((s) => <option key={s.from} value={`${s.from}-${s.to}`}>{s.label}</option>)}
    </select>
  );

  // خلية الملاحظات: قائمة واحدة تضم حالات الحضور ثم عبارات الملاحظات الجاهزة.
  // كل خلية تحمل اختيارًا واحدًا: إمّا حالة حضور وإمّا ملاحظة (مانعان لتفادي التعارض).
  const notesCell = (r: Row) => {
    const cur = data[r.dateStr]?.notes ?? '';
    const att = data[r.dateStr]?.attendance ?? 'PRESENT';
    const known = NOTE_PRESETS.some((g) => g.keys.some((k) => t(k) === cur));
    const value = cur ? `note:${cur}` : att !== 'PRESENT' ? `att:${att}` : '';
    return (
      <select className="qm-in qm-notes" disabled={!canManage} value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v.startsWith('att:')) { set(r.dateStr, 'attendance', v.slice(4)); set(r.dateStr, 'notes', ''); }
          else if (v.startsWith('note:')) { set(r.dateStr, 'notes', v.slice(5)); set(r.dateStr, 'attendance', 'PRESENT'); }
          else { set(r.dateStr, 'notes', ''); set(r.dateStr, 'attendance', 'PRESENT'); }
        }}>
        <option value="">—</option>
        <optgroup label={t('qm.col.attendance')}>
          {ATTENDANCE_STATUSES.map((s) => <option key={s} value={`att:${s}`}>{t(`status.attendance.${s}`)}</option>)}
        </optgroup>
        {cur && !known && <option value={`note:${cur}`}>{cur}</option>}
        {NOTE_PRESETS.map((g) => (
          <optgroup key={g.group} label={t(g.group)}>
            {g.keys.map((k) => <option key={k} value={`note:${t(k)}`}>{t(k)}</option>)}
          </optgroup>
        ))}
      </select>
    );
  };

  const total = (dateStr: string) =>
    SCORE_FIELDS.reduce((s, f) => s + (Number(data[dateStr]?.[f]) || 0), 0);

  // ===== دوال العرض النصّي لمعاينة/تصدير PDF =====
  const attLabel = (dateStr: string) => t(`status.attendance.${data[dateStr]?.attendance ?? 'PRESENT'}`);
  const surahLabel = (dateStr: string) => {
    const v = Number(data[dateStr]?.newFrom);
    return v && SURAHS[v - 1] ? `${v}. ${SURAHS[v - 1]}` : '';
  };
  const segLabelFor = (segs: typeof MAJOR_SEGMENTS, dateStr: string, fromField: string, toField: string) => {
    const f = data[dateStr]?.[fromField], tt = data[dateStr]?.[toField];
    if (!f || !tt) return '';
    return segs.find((s) => String(s.from) === f && String(s.to) === tt)?.label ?? `${f}-${tt}`;
  };
  const conductOtherLabel = (dateStr: string) => {
    const c = data[dateStr]?.conductScore, o = data[dateStr]?.otherScore;
    return [c, o].filter(Boolean).join(' / ');
  };
  const num = (dateStr: string, field: string) => data[dateStr]?.[field] || '';
  // الأيام التي فيها نشاط فعلي (لعرضها في التقرير)
  const docRows = rows.filter((r) => {
    const d = data[r.dateStr];
    if (!d) return false;
    return !!(d.newFrom || d.reviewFrom || d.last5From || d.pages || d.errors || d.alerts ||
      d.listener || d.notes || SCORE_FIELDS.some((f) => d[f]) || d.attendance !== 'PRESENT');
  });
  const printedAt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date());

  // عنوان من كلمتين يُعرض على سطرين (فوق بعض) لتضييق العمود
  const stackedLabel = (key: string) => {
    const label = t(key);
    const sp = label.indexOf(' ');
    if (sp < 0) return label;
    return (
      <>
        {label.slice(0, sp)}
        <br />
        {label.slice(sp + 1)}
      </>
    );
  };

  const presentDays = rows.filter((r) => (data[r.dateStr]?.attendance ?? 'PRESENT') !== 'ABSENT' && (data[r.dateStr]?.newFrom || data[r.dateStr]?.reviewFrom || data[r.dateStr]?.pages)).length;
  const activeDays = rows.filter((r) => data[r.dateStr]?.newFrom || data[r.dateStr]?.reviewFrom || data[r.dateStr]?.pages || data[r.dateStr]?.attendance === 'ABSENT').length;
  const totalPages = rows.reduce((s, r) => s + (Number(data[r.dateStr]?.pages) || 0), 0);
  const totalScore = rows.reduce((s, r) => s + total(r.dateStr), 0);
  const attendancePct = activeDays ? Math.round((presentDays / activeDays) * 100) : 0;

  // ===== جدول نهاية الشهر: الحساب + المسميات + رقم الصفحة =====
  const monthSummary = computeMonthSummary(rows.map((r) => r.dateStr), data);
  const generalScore = scoreLabel(monthSummary.percentage);
  const labels = mergeLabels(summaryLabels);
  const L = (key: string): string => (locale === 'en' ? labels[key]?.en : labels[key]?.ar) || SUMMARY_LABELS[key]?.ar || key;

  const pageKey = `midad_qm_page_${selectedId}_${ym}`;
  const [pageNum, setPageNum] = useState('');
  useEffect(() => {
    try { setPageNum(localStorage.getItem(pageKey) || ''); } catch { /* */ }
  }, [pageKey]);
  function setPage(v: string) {
    setPageNum(v);
    try { if (v) localStorage.setItem(pageKey, v); else localStorage.removeItem(pageKey); } catch { /* */ }
  }

  // تحرير المسميات (لمدير التعليم)
  const [editLabels, setEditLabels] = useState(false);
  const [draft, setDraft] = useState<Record<string, BiLabel>>(labels);
  const [savingLabels, setSavingLabels] = useState(false);
  async function saveLabels() {
    setSavingLabels(true);
    try {
      const res = await fetch('/api/org/education/quran-labels', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: draft }),
      });
      if (res.ok) { setEditLabels(false); router.refresh(); }
    } finally { setSavingLabels(false); }
  }

  const SUMMARY_ROWS: { key: string; value: number }[] = [
    { key: 'notReciteNew', value: monthSummary.notReciteNew },
    { key: 'notReciteLast5', value: monthSummary.notReciteLast5 },
    { key: 'notReciteReview', value: monthSummary.notReciteReview },
    { key: 'absenceExcused', value: monthSummary.absenceExcused },
    { key: 'absenceUnexcused', value: monthSummary.absenceUnexcused },
  ];

  const numCell = (r: Row, field: (typeof NUM_FIELDS)[number], cls = 'qm-num') => (
    <input type="number" className={`qm-in ${cls}`} disabled={!canManage}
      value={data[r.dateStr]?.[field] ?? ''} onChange={(e) => set(r.dateStr, field, e.target.value)} />
  );

  return (
    <>
      <div className="qm-toolbar">
        <label className="qm-tool">
          <span>{t('qm.student')}</span>
          <select value={selectedId} onChange={(e) => navigate({ student: e.target.value })}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.halaqa ? ` — ${s.halaqa}` : ''}</option>
            ))}
          </select>
        </label>
        <label className="qm-tool">
          <span>{t('qm.month')}</span>
          <input type="month" lang="en" value={ym} onChange={(e) => e.target.value && navigate({ ym: e.target.value })} />
        </label>
        <div className="qm-summary">
          <span>{t('qm.sumPages', { n: totalPages })}</span>
          <span>{t('qm.sumScore', { n: totalScore })}</span>
          <span>{t('qm.sumAttendance', { n: attendancePct })}</span>
        </div>
      </div>

      <div className="qm-meta">
        <div><strong>{studentName}</strong>{halaqaName && <span> — {halaqaName}</span>}</div>
        {selectedId && (
          <div className="qm-send">
            <button className="org-btn org-btn-outline" onClick={() => setPreview(true)}>
              {t('qm.exportPdf')}
            </button>
            {canManage && (
              <>
                <button className="org-btn org-btn-outline" disabled={!!sending} onClick={() => sendReport('day')}>
                  {sending === 'day' ? t('qm.sending') : t('qm.sendDaily')}
                </button>
                <button className="org-btn org-btn-primary" disabled={!!sending} onClick={() => sendReport('month')}>
                  {sending === 'month' ? t('qm.sending') : t('qm.sendMonthly')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {sendMsg && <div className={`qm-sendmsg ${sendMsg.ok ? 'is-ok' : 'is-err'}`}>{sendMsg.text}</div>}

      {/* ===== الجدولان جنبًا إلى جنب: المتابعة + الدرجات المستقلة ===== */}
      <div className="qm-sheets">
      <div className="qm-wrap qm-sheet-main" lang="en">
        <table className="qm-table qm-main">
          <thead>
            <tr>
              <th className="qm-c-date">{t('qm.col.date')}</th>
              <th className="qm-c-day">{t('qm.col.day')}</th>
              <th className="qm-g-new qm-c-lesson">{t('qm.col.lesson')}</th>
              <th className="qm-g-review qm-c-seg">{t('qm.col.major')}</th>
              <th className="qm-g-last5 qm-c-seg">{t('qm.col.minor')}</th>
              <th className="qm-c-sm">{t('qm.col.pages')}</th>
              <th className="qm-c-sm">{t('qm.col.errors')}</th>
              <th className="qm-c-sm">{t('qm.col.alerts')}</th>
              <th className="qm-c-listener">{t('qm.col.listener')}</th>
              <th className="qm-c-status" aria-label="status" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const wd = wdFmt.format(new Date(`${r.dateStr}T00:00:00Z`));
              const absent = data[r.dateStr]?.attendance === 'ABSENT';
              const weekend = r.weekday === 5 || r.weekday === 6; // الجمعة/السبت
              const st = saved[r.dateStr];
              return (
                <tr key={r.dateStr} className={`${absent ? 'qm-absent' : ''} ${weekend ? 'qm-weekend' : ''}`}>
                  <td className="qm-date">{r.day}</td>
                  <td className="qm-wd">{wd}</td>
                  <td>{surahCell(r)}</td>
                  <td>{segCell(r, MAJOR_SEGMENTS, 'reviewFrom', 'reviewTo')}</td>
                  <td>{segCell(r, MINOR_SEGMENTS, 'last5From', 'last5To')}</td>
                  <td>{numCell(r, 'pages')}</td>
                  <td>{numCell(r, 'errors')}</td>
                  <td>{numCell(r, 'alerts')}</td>
                  <td>
                    <input className="qm-in qm-txt" disabled={!canManage}
                      value={data[r.dateStr]?.listener ?? ''} onChange={(e) => set(r.dateStr, 'listener', e.target.value)} />
                  </td>
                  <td className="qm-status">
                    {st === 'saving' && <span className="qm-dot qm-dot-saving" title={t('qm.saving')} />}
                    {st === 'ok' && <span className="qm-dot qm-dot-ok" title={t('form.saved')} />}
                    {st === 'err' && <span className="qm-dot qm-dot-err" title={t('form.saveErr')} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== جدول الدرجات: مستقل، بجانب الجدول الأساسي ===== */}
      <div className="qm-grades-col">
      <div className="qm-wrap" lang="en">
        <table className="qm-table qm-grades">
          <thead>
            <tr>
              <th>{t('qm.col.lessonScore')}</th>
              <th className="qm-hd-wrap">{stackedLabel('qm.col.reviewScore')}</th>
              <th className="qm-hd-wrap">{stackedLabel('qm.col.minorScore')}</th>
              <th className="qm-hd-wrap">{stackedLabel('qm.col.conductOther')}</th>
              <th>{t('qm.col.total')}</th>
              <th className="qm-c-notes">{t('qm.col.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dateStr} className={`${data[r.dateStr]?.attendance === 'ABSENT' ? 'qm-absent' : ''} ${r.weekday === 5 || r.weekday === 6 ? 'qm-weekend' : ''}`}>
                <td>{numCell(r, 'lessonScore')}</td>
                <td>{numCell(r, 'reviewScore')}</td>
                <td>{numCell(r, 'minorScore')}</td>
                <td>
                  <div className="qm-dual">
                    {numCell(r, 'conductScore')}
                    {numCell(r, 'otherScore')}
                  </div>
                </td>
                <td className="qm-total">{total(r.dateStr) || ''}</td>
                <td>{notesCell(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>

      {/* ===== جدول نهاية الشهر ===== */}
      {selectedId && (
        <section className="qm-monthend">
          <div className="qm-monthend-head">
            <h3>{L('title')}</h3>
            {canCustomize && (
              <button className="org-btn org-btn-outline qm-me-editbtn"
                onClick={() => { setDraft(mergeLabels(summaryLabels)); setEditLabels((v) => !v); }}>
                {editLabels ? t('shell.cancel') : t('qm.editLabels')}
              </button>
            )}
          </div>
          <div className="qm-wrap" lang="en">
            <table className="qm-me-table">
              <tbody>
                {SUMMARY_ROWS.map((r) => (
                  <tr key={r.key}>
                    <td className="qm-me-label">
                      {editLabels ? (
                        <div className="qm-me-edit">
                          <input value={draft[r.key]?.ar ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [r.key]: { ...d[r.key], ar: e.target.value } }))} placeholder="بالعربية" />
                          <input dir="ltr" value={draft[r.key]?.en ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [r.key]: { ...d[r.key], en: e.target.value } }))} placeholder="English" />
                        </div>
                      ) : (
                        <><span className="qm-me-ar">{labels[r.key].ar}</span><span className="qm-me-en">{labels[r.key].en}</span></>
                      )}
                    </td>
                    <td className="qm-me-val">{r.value}</td>
                  </tr>
                ))}
                <tr>
                  <td className="qm-me-label"><span className="qm-me-ar">{labels.pageNumber.ar}</span><span className="qm-me-en">{labels.pageNumber.en}</span></td>
                  <td className="qm-me-val">
                    <select className="qm-in qm-me-page" lang="en" value={pageNum} disabled={!canManage} onChange={(e) => setPage(e.target.value)}>
                      <option value="">—</option>
                      {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="qm-me-footer">
              <div className="qm-me-stat">
                <span className="qm-me-ar">{labels.generalScore.ar}</span>
                <span className="qm-me-en">{labels.generalScore.en}</span>
                <strong>{locale === 'en' ? generalScore.en : generalScore.ar}</strong>
              </div>
              <div className="qm-me-stat">
                <span className="qm-me-ar">{labels.percentage.ar}</span>
                <span className="qm-me-en">{labels.percentage.en}</span>
                <strong className="qm-me-pctval">{monthSummary.percentage}%</strong>
              </div>
            </div>
          </div>
          {editLabels && (
            <div className="qm-me-editactions">
              <button className="org-btn org-btn-primary" disabled={savingLabels} onClick={saveLabels}>
                {savingLabels ? t('form.saving') : t('brand.save')}
              </button>
            </div>
          )}
        </section>
      )}

      {canManage && <p className="qm-hint">{t('qm.autosave')}</p>}

      {/* ===== معاينة قبل تصدير PDF (Portal إلى body لعزل الطباعة) ===== */}
      {preview && typeof document !== 'undefined' && createPortal(
        <div className="qm-preview" role="dialog" aria-modal="true">
          <div className="qm-preview-bar">
            <span className="qm-preview-name">{t('qm.title')} — {studentName}</span>
            <div className="qm-preview-actions">
              <button className="org-btn org-btn-primary" onClick={() => window.print()}>{t('qm.exportPdf')}</button>
              <button className="org-btn org-btn-outline" onClick={() => setPreview(false)}>{t('qm.close')}</button>
            </div>
          </div>
          <div className="qm-preview-scroll">
            <article className="qm-doc" lang="en">
              <header className="qm-doc-head">
                {orgLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="qm-doc-logo" src={orgLogo} alt="" />
                )}
                <div className="qm-doc-org">{orgName}</div>
                <h1 className="qm-doc-title">{t('qm.title')}</h1>
                <div className="qm-doc-sub">
                  {studentName}{halaqaName ? ` — ${halaqaName}` : ''} · {monthLabel} {year}
                </div>
              </header>
              <div className="qm-doc-summary">
                <span>{t('qm.sumPages', { n: totalPages })}</span>
                <span>{t('qm.sumScore', { n: totalScore })}</span>
                <span>{t('qm.sumAttendance', { n: attendancePct })}</span>
              </div>
              {docRows.length === 0 ? (
                <p className="qm-doc-empty">{t('qm.noData')}</p>
              ) : (
                /* جدول واحد مدمج: كل الأعمدة بجانب بعضها (بلا عمود الحضور) */
                <table className="qm-doc-table qm-doc-combined">
                  <thead>
                    <tr>
                      <th>{t('qm.col.date')}</th>
                      <th>{t('qm.col.day')}</th>
                      <th>{t('qm.col.lesson')}</th>
                      <th>{t('qm.col.major')}</th>
                      <th>{t('qm.col.minor')}</th>
                      <th>{t('qm.col.pages')}</th>
                      <th>{t('qm.col.errors')}</th>
                      <th>{t('qm.col.alerts')}</th>
                      <th>{t('qm.col.listener')}</th>
                      <th>{t('qm.col.lessonScore')}</th>
                      <th>{t('qm.col.reviewScore')}</th>
                      <th>{t('qm.col.minorScore')}</th>
                      <th>{t('qm.col.conductOther')}</th>
                      <th>{t('qm.col.total')}</th>
                      <th>{t('qm.col.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docRows.map((r) => (
                      <tr key={r.dateStr} className={data[r.dateStr]?.attendance === 'ABSENT' ? 'qm-absent' : ''}>
                        <td>{r.day}</td>
                        <td>{wdFmt.format(new Date(`${r.dateStr}T00:00:00Z`))}</td>
                        <td>{surahLabel(r.dateStr)}</td>
                        <td>{segLabelFor(MAJOR_SEGMENTS, r.dateStr, 'reviewFrom', 'reviewTo')}</td>
                        <td>{segLabelFor(MINOR_SEGMENTS, r.dateStr, 'last5From', 'last5To')}</td>
                        <td>{num(r.dateStr, 'pages')}</td>
                        <td>{num(r.dateStr, 'errors')}</td>
                        <td>{num(r.dateStr, 'alerts')}</td>
                        <td>{num(r.dateStr, 'listener')}</td>
                        <td>{num(r.dateStr, 'lessonScore')}</td>
                        <td>{num(r.dateStr, 'reviewScore')}</td>
                        <td>{num(r.dateStr, 'minorScore')}</td>
                        <td>{conductOtherLabel(r.dateStr)}</td>
                        <td className="qm-total">{total(r.dateStr) || ''}</td>
                        <td className="qm-doc-notes">{num(r.dateStr, 'notes')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* جدول نهاية الشهر في التصدير */}
              <h3 className="qm-doc-h3">{L('title')}</h3>
              <table className="qm-doc-table qm-doc-me">
                <tbody>
                  {SUMMARY_ROWS.map((r) => (
                    <tr key={r.key}>
                      <td className="qm-doc-me-label">{labels[r.key].ar} / {labels[r.key].en}</td>
                      <td>{r.value}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="qm-doc-me-label">{labels.pageNumber.ar} / {labels.pageNumber.en}</td>
                    <td>{pageNum || '—'}</td>
                  </tr>
                  <tr className="qm-doc-me-foot">
                    <td className="qm-doc-me-label">{labels.generalScore.ar} / {labels.generalScore.en}</td>
                    <td>{locale === 'en' ? generalScore.en : generalScore.ar}</td>
                  </tr>
                  <tr className="qm-doc-me-foot">
                    <td className="qm-doc-me-label">{labels.percentage.ar} / {labels.percentage.en}</td>
                    <td>{monthSummary.percentage}%</td>
                  </tr>
                </tbody>
              </table>

              <div className="qm-doc-foot">{t('qm.generatedAt', { date: printedAt })}</div>
            </article>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
