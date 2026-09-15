'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Row { name: string; serial: number | null; balance: number }

const PAGE_SIZE = 15; // عدد الأسماء في كل صفحة من القائمة الدوّارة (تحت المراكز الثلاثة)

export default function StandingsBoard({ orgName, logoUrl, rotateSec = 15 }: { orgName?: string; logoUrl?: string | null; rotateSec?: number }) {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [full, setFull] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  // التاريخ واليوم — بعد التركيب لتفادي عدم تطابق SSR
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetch('/api/org/points/standings', { cache: 'no-store' });
        const d = await r.json().catch(() => null);
        if (active && d?.ok) { setRows(d.rows as Row[]); setLoaded(true); }
      } catch { /* تجاهل */ }
    }
    load();
    const iv = setInterval(load, 5000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const top = rows.slice(0, 3);       // المراكز الثابتة: الأول/الثاني/الثالث
  const rest = rows.slice(3);         // البقية — تُعرَض في صفحات دوّارة
  const pageCount = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));

  // تدوير صفحات القائمة السفلية فقط (المراكز الثلاثة تبقى ثابتة)
  useEffect(() => {
    if (pageCount <= 1) return;
    const ms = Math.max(3, rotateSec) * 1000;
    const iv = setInterval(() => setPage((p) => p + 1), ms);
    return () => clearInterval(iv);
  }, [pageCount, rotateSec]);

  // الصفحة الظاهرة (نقصّها بالباقي حتى تبقى ضمن المدى مهما تغيّرت البيانات)
  const curPage = page % pageCount;

  async function toggleFull() {
    try {
      if (!document.fullscreenElement) await boardRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* المتصفّح قد يمنع — نتجاهل */ }
  }

  const labels = [t('pts.rank.1'), t('pts.rank.2'), t('pts.rank.3')];
  const lc = locale === 'en' ? 'en' : 'ar-u-nu-latn';
  const dayStr = now ? new Intl.DateTimeFormat(lc, { weekday: 'long' }).format(now) : '';
  const dateStr = now ? new Intl.DateTimeFormat(lc, { year: 'numeric', month: 'long', day: 'numeric' }).format(now) : '';

  const pageStart = curPage * PAGE_SIZE;
  const pageRows = rest.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className={`pts-board ${full ? 'is-full' : ''}`} ref={boardRef}>
      <div className="pts-board-head">
        <div className="pts-board-org">
          {logoUrl
            // eslint-disable-next-line @next/next/no-img-element -- شعار الجهة قد يكون رابطًا خارجيًّا؛ عرض مباشر بسيط
            ? <img src={logoUrl} alt="" className="pts-board-logo" />
            : <span className="pts-board-logo pts-board-logo-ph">{(orgName || '؟').slice(0, 1)}</span>}
          <span className="pts-board-orgname">{orgName}</span>
        </div>
        <div className="pts-board-when">
          <span className="pts-board-day">{dayStr}</span>
          <span className="pts-board-date">{dateStr}</span>
        </div>
        <button type="button" className="pts-board-full" onClick={toggleFull} aria-label={t(full ? 'ptsStand.exitFull' : 'ptsStand.full')} title={t(full ? 'ptsStand.exitFull' : 'ptsStand.full')}>
          {full ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
          )}
          <span>{t(full ? 'ptsStand.exitFull' : 'ptsStand.full')}</span>
        </button>
      </div>

      {loaded && rows.length === 0 ? (
        <div className="org-empty">{t('pts.none')}</div>
      ) : (
        <>
          <div className="pts-podium">
            {top.map((r, i) => (
              <div key={i} className={`pts-podium-item rank-${i + 1} pts-reveal`} style={{ animationDelay: `${i * 0.4}s` }}>
                <span className="pts-podium-rank">{labels[i]}</span>
                <span className="pts-podium-name">{r.name || '—'}</span>
                <span className="pts-podium-pts">{r.balance}</span>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="pts-roster" key={curPage}>
              {pageRows.map((r, i) => (
                <div key={i} className="pts-roster-row">
                  <span className="pts-roster-num">{pageStart + i + 4}</span>
                  <span className="pts-roster-name">{r.name}</span>
                  <span className="pts-roster-pts">{r.balance}</span>
                </div>
              ))}
              {pageCount > 1 && (
                <div className="pts-roster-pager" aria-hidden="true">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <span key={i} className={`pts-roster-dot ${i === curPage ? 'is-on' : ''}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
