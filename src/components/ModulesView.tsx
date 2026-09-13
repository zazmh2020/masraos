'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import {
  MODULE_REGISTRY, MODULE_DEFS, moduleAppliesToType, planMeets,
  type OrgModule, type ModuleCategory,
} from '@/lib/modules';
import { PLAN_BY_ID } from '@/lib/plans';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { OrgType, OrgPlan } from '@/generated/prisma/client';

const CATEGORY_ORDER: ModuleCategory[] = ['OPERATIONS', 'EDUCATION', 'KNOWLEDGE', 'SYSTEM'];

export default function ModulesView({
  disabled, canManage, type, plan,
}: {
  disabled: string[];
  canManage: boolean;
  type: OrgType;
  plan: OrgPlan;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [off, setOff] = useState<Set<string>>(new Set(disabled));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle(m: OrgModule) {
    if (!canManage || busy) return;
    const next = new Set(off);
    if (next.has(m)) next.delete(m); else next.add(m);
    setOff(next);
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/org/modules', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabledModules: [...next] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? t('form.saveErr')); setOff(new Set(off)); }
      else router.refresh();
    } catch { setError(t('form.netErr')); setOff(new Set(off)); }
    finally { setBusy(false); }
  }

  function planName(id: OrgPlan): string {
    const p = PLAN_BY_ID[id];
    return p ? (locale === 'en' ? p.en : p.name) : id;
  }

  const byCategory = CATEGORY_ORDER
    .map((cat) => ({ cat, defs: MODULE_DEFS.filter((d) => d.category === cat) }))
    .filter((g) => g.defs.length > 0);

  return (
    <>
      {error && <div className="org-alert">{error}</div>}

      {byCategory.map(({ cat, defs }) => (
        <section key={cat} className="mod-cat">
          <h2 className="mod-cat-title">{t(`mod.cat.${cat}`)}</h2>
          <div className="mod-grid">
            {defs.map((d) => {
              const on = !off.has(d.id);
              // إرشادات غير مانعة: مطابقة النوع، وكفاية الباقة
              const notForType = !moduleAppliesToType(d.id, type);
              const planLocked = !planMeets(plan, d.requiredPlan);
              return (
                <div key={d.id} className={`mod-card ${on ? 'is-active' : 'is-off'}`}>
                  <div className="mod-card-ic"><Icon name={d.icon} size={22} /></div>
                  <div className="mod-card-body">
                    <div className="mod-card-hd">
                      <strong>{t(MODULE_REGISTRY[d.id].labelKey)}</strong>
                      <span className={`mod-badge ${on ? 'is-active' : 'is-disabled'}`}>
                        {t(on ? 'mod.status.ACTIVE' : 'mod.status.DISABLED')}
                      </span>
                    </div>
                    <p className="mod-card-desc">{t(MODULE_REGISTRY[d.id].descKey)}</p>
                    {planLocked && (
                      <p className="mod-card-hint">{t('mod.planHint', { plan: planName(d.requiredPlan) })}</p>
                    )}
                    {notForType && <p className="mod-card-hint">{t('mod.typeHint')}</p>}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={t(MODULE_REGISTRY[d.id].labelKey)}
                    className={`org-switch ${on ? 'is-on' : ''}`}
                    disabled={!canManage || busy}
                    onClick={() => toggle(d.id)}
                  >
                    <span className="org-switch-knob" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
