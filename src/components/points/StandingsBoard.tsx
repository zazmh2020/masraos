'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Row { name: string; serial: number | null; balance: number }

export default function StandingsBoard() {
  const { t } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  const top = rows.slice(0, 5);
  const rest = rows.slice(5);
  const labels = [t('pts.rank.1'), t('pts.rank.2'), t('pts.rank.3'), t('pts.rank.4'), t('pts.rank.5')];

  if (loaded && rows.length === 0) return <div className="org-empty">{t('pts.none')}</div>;

  return (
    <div className="pts-board">
      <div className="pts-podium">
        {top.map((r, i) => (
          <div key={i} className={`pts-podium-item rank-${i + 1}`}>
            <span className="pts-podium-rank">{labels[i]}</span>
            <span className="pts-podium-name">{r.name || '—'}</span>
            <span className="pts-podium-pts">{r.balance}</span>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="pts-roster">
          {rest.map((r, i) => (
            <div key={i} className="pts-roster-row">
              <span className="pts-roster-num">{i + 6}</span>
              <span className="pts-roster-name">{r.name}</span>
              <span className="pts-roster-pts">{r.balance}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
