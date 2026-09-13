'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Latest {
  id: string; name: string; serial: number | null; halaqa: string | null;
  kind: string; amount: number; balance: number;
}

/** شاشة عرض كبيرة تعكس آخر عملية نقاط في المؤسسة لاسلكيًّا (استفتاء كل ~1.5ث). */
export default function DisplayScreen({ orgName }: { orgName: string }) {
  const { t } = useLocale();
  const [view, setView] = useState<Latest | null>(null);
  const [flash, setFlash] = useState(false);
  const lastId = useRef<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    let active = true;
    let flashTimer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await fetch('/api/org/points/latest', { cache: 'no-store' });
        const d = await r.json().catch(() => null);
        if (!active || !d?.ok) return;
        const l: Latest | null = d.latest;
        if (l && l.id !== lastId.current) {
          lastId.current = l.id;
          setView(l);
          if (!first.current) {
            setFlash(true);
            flashTimer = setTimeout(() => { if (active) setFlash(false); }, 700);
          }
        }
        first.current = false;
      } catch { /* تجاهل */ }
    }
    poll();
    const iv = setInterval(poll, 1500);
    return () => { active = false; clearInterval(iv); clearTimeout(flashTimer); };
  }, []);

  const isDeduct = view?.kind === 'DEDUCT';
  const sign = isDeduct ? '−' : '+';

  return (
    <div className={`pts-display ${flash ? 'is-flash' : ''}`}>
      <span className="pts-display-livebadge"><i />{t('pts.display.live')}</span>
      {view ? (
        <div className="pts-display-card" key={view.id}>
          <div className="pts-display-name">{view.name}</div>
          {view.halaqa && <div className="pts-display-halaqa">{view.halaqa}</div>}
          <div className="pts-display-balance"><span>{t('pts.balance')}</span><strong>{view.balance}</strong></div>
          <div className={`pts-display-delta ${isDeduct ? 'redeem' : 'earn'}`}>{sign}{view.amount}</div>
          <div className="pts-display-serial">#{view.serial}</div>
        </div>
      ) : (
        <div className="pts-display-idle">{orgName}<span>{t('pts.display.waiting')}</span></div>
      )}
    </div>
  );
}
