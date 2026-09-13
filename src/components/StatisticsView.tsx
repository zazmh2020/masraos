'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Halaqa { id: string; name: string; }
interface Student { id: string; name: string; halaqaId: string | null; }

interface Stats {
  kpis: { sessions: number; students: number; newCount: number; reviewCount: number; excellentPct: number };
  labels: string[];
  series: { new: number[]; review: number[] };
  ratings: { EXCELLENT: number; GOOD: number; NEEDS_REPEAT: number };
}

const numFmt = new Intl.NumberFormat('en-US');
const NEW_C = 'var(--purple-500)';
const REV_C = 'var(--purple-300)';

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
const todayIso = new Date().toISOString().slice(0, 10);

/* ---- SVG line/area chart (سلسلتان) ---- */
function Chart({ labels, a, b }: { labels: string[]; a: number[]; b: number[] }) {
  const { t } = useLocale();
  const W = 720, H = 240, padX = 34, top = 18, bottom = 40;
  const max = Math.max(1, ...a, ...b);
  const n = labels.length;
  const stepX = (W - padX * 2) / Math.max(1, n - 1);
  const usableH = H - top - bottom;
  const pt = (v: number, i: number) => [padX + i * stepX, top + usableH * (1 - v / max)] as const;
  const line = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'} ${pt(v, i)[0].toFixed(1)} ${pt(v, i)[1].toFixed(1)}`).join(' ');
  const area = (vals: number[]) => `${line(vals)} L ${pt(vals[n - 1], n - 1)[0].toFixed(1)} ${H - bottom} L ${padX} ${H - bottom} Z`;
  const grid = [top + 4, top + usableH / 2, H - bottom];

  return (
    <svg className="stat-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={t('stat.chartAria')}>
      <defs>
        <linearGradient id="statArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEW_C} stopOpacity="0.22" />
          <stop offset="100%" stopColor={NEW_C} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((y, i) => <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(43,26,78,0.08)" strokeDasharray="3 5" />)}
      <path d={area(a)} fill="url(#statArea)" />
      <path d={line(a)} fill="none" stroke={NEW_C} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(b)} fill="none" stroke={REV_C} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />
      {a.map((v, i) => <circle key={i} cx={pt(v, i)[0]} cy={pt(v, i)[1]} r="3.2" fill={NEW_C} />)}
      <g fontFamily="Qomra, Segoe UI, sans-serif" fontSize="11" fill="var(--gray-500)" textAnchor="middle">
        {labels.map((l, i) => <text key={i} x={padX + i * stepX} y={H - 14}>{l}</text>)}
      </g>
    </svg>
  );
}

export default function StatisticsView({ halaqat, students }: { halaqat: Halaqa[]; students: Student[] }) {
  const { t } = useLocale();
  const [halaqaId, setHalaqaId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [from, setFrom] = useState(isoDaysAgo(180));
  const [to, setTo] = useState(todayIso);
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const shownStudents = useMemo(
    () => (halaqaId ? students.filter((s) => s.halaqaId === halaqaId) : students),
    [halaqaId, students],
  );

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const q = new URLSearchParams();
    if (halaqaId) q.set('halaqaId', halaqaId);
    if (studentId) q.set('studentId', studentId);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    fetch(`/api/org/statistics?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [halaqaId, studentId, from, to]);

  const kpis = data?.kpis;
  const ratings = data?.ratings;
  const ratingTotal = ratings ? ratings.EXCELLENT + ratings.GOOD + ratings.NEEDS_REPEAT : 0;

  return (
    <div className={`stat ${loading ? 'is-loading' : ''}`}>
      {/* الفلاتر */}
      <div className="stat-filters">
        <div className="stat-field">
          <label>{t('stat.halaqa')}</label>
          <select value={halaqaId} onChange={(e) => { setHalaqaId(e.target.value); setStudentId(''); }}>
            <option value="">{t('stat.allHalaqat')}</option>
            {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div className="stat-field">
          <label>{t('stat.student')}</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">{t('stat.allStudents')}</option>
            {shownStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="stat-field">
          <label>{t('stat.from')}</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="stat-field">
          <label>{t('stat.to')}</label>
          <input type="date" value={to} min={from} max={todayIso} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {/* KPIs */}
      <div className="stat-kpis">
        {[
          { k: t('stat.kpiSessions'), v: kpis?.sessions, accent: true },
          { k: t('status.memoKind.NEW'), v: kpis?.newCount },
          { k: t('status.memoKind.REVIEW'), v: kpis?.reviewCount },
          { k: t('stat.kpiActiveStudents'), v: kpis?.students },
          { k: t('stat.kpiExcellentPct'), v: kpis ? `${kpis.excellentPct}%` : undefined },
        ].map((it) => (
          <div key={it.k} className={`stat-kpi ${it.accent ? 'is-accent' : ''}`}>
            <div className="stat-kpi-k">{it.k}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={String(it.v)}
                className="stat-kpi-v"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {it.v === undefined ? '—' : typeof it.v === 'number' ? numFmt.format(it.v) : it.v}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* الرسم */}
      <div className="stat-chart-card">
        <div className="stat-card-hd">
          <h3>{t('stat.progressTitle')}</h3>
          <div className="stat-legend">
            <span><i style={{ background: NEW_C }} />{t('status.memoKind.NEW')}</span>
            <span><i style={{ background: REV_C }} />{t('status.memoKind.REVIEW')}</span>
          </div>
        </div>
        {data && (kpis?.sessions ?? 0) > 0 ? (
          <motion.div key={`${halaqaId}-${studentId}-${from}-${to}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <Chart labels={data.labels} a={data.series.new} b={data.series.review} />
          </motion.div>
        ) : (
          <p className="stat-empty">{loading ? t('stat.loading') : t('stat.noSessions')}</p>
        )}
      </div>

      {/* توزيع التقييم */}
      <div className="stat-chart-card">
        <div className="stat-card-hd"><h3>{t('stat.ratingDist')}</h3></div>
        {ratingTotal > 0 ? (
          <div className="stat-ratings">
            {([['EXCELLENT', 'var(--success)'], ['GOOD', 'var(--purple-500)'], ['NEEDS_REPEAT', 'var(--gold-600)']] as const).map(([k, c]) => (
              <div key={k} className="stat-rating">
                <div className="stat-rating-hd"><span>{t('status.memoRating.' + k)}</span><strong>{numFmt.format(ratings![k])}</strong></div>
                <div className="stat-rating-track"><i style={{ width: `${(ratings![k] / ratingTotal) * 100}%`, background: c }} /></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="stat-empty">{t('stat.noData')}</p>
        )}
      </div>
    </div>
  );
}
