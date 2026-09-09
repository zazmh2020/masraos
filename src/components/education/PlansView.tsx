'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

export type Stage = { t: string; d: string; meta: string };
export type ReadyPlan = {
  id: string; icon: string; title: string; subtitle: string; tag: string;
  desc: string; kpis: [string, string][]; stages: Stage[];
};
export type CustomPlan = {
  id: string; title: string; subtitle: string | null; description: string | null;
  tag: string | null; stages: Stage[];
};

const DEFAULT_ICON = 'education/education-courses';

export default function PlansView({
  ready, custom, canManage, orgName, orgLogo = null,
}: { ready: ReadyPlan[]; custom: CustomPlan[]; canManage: boolean; orgName: string; orgLogo?: string | null }) {
  const t = useT();
  const router = useRouter();

  type Sel = { kind: 'ready' | 'custom' | 'new'; id: string };
  const [sel, setSel] = useState<Sel>({ kind: ready[0] ? 'ready' : 'new', id: ready[0]?.id ?? '' });
  const [preview, setPreview] = useState<{ title: string; subtitle: string; stages: Stage[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // نموذج الخطة المخصّصة
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<Stage[]>([{ t: '', d: '', meta: '' }, { t: '', d: '', meta: '' }]);

  const printedAt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  function setStage(i: number, key: keyof Stage, v: string) {
    setStages((arr) => arr.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));
  }
  function addStage() { setStages((arr) => [...arr, { t: '', d: '', meta: '' }]); }
  function removeStage(i: number) { setStages((arr) => arr.filter((_, idx) => idx !== i)); }

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (title.trim().length < 2) { setErr(t('plans.nameErr')); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/org/education/plans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, tag, description, stages: stages.filter((s) => s.t.trim()) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setErr(d.error ?? t('form.createErr'));
      else {
        setTitle(''); setSubtitle(''); setTag(''); setDescription(''); setStages([{ t: '', d: '', meta: '' }, { t: '', d: '', meta: '' }]);
        setSel({ kind: 'custom', id: d.id });
        router.refresh();
      }
    } catch { setErr(t('form.netErr')); } finally { setBusy(false); }
  }

  async function removePlan(id: string) {
    if (!confirm(t('plans.deleteConfirm'))) return;
    setBusy(true);
    await fetch(`/api/org/education/plans?id=${id}`, { method: 'DELETE' });
    setBusy(false);
    setSel({ kind: ready[0] ? 'ready' : 'new', id: ready[0]?.id ?? '' });
    router.refresh();
  }

  const curReady = sel.kind === 'ready' ? ready.find((p) => p.id === sel.id) : null;
  const curCustom = sel.kind === 'custom' ? custom.find((p) => p.id === sel.id) : null;

  function openPreview(title: string, subtitle: string, stages: Stage[]) {
    setPreview({ title, subtitle, stages });
  }

  return (
    <div className="hub">
      <div className="hub-list">
        {canManage && (
          <button className={`hub-item ${sel.kind === 'new' ? 'is-active' : ''}`} onClick={() => setSel({ kind: 'new', id: '' })}>
            <span className="hub-item-ic"><Icon name="actions/actions-add" size={18} /></span>
            <span className="hub-item-tx"><span className="t">{t('plans.newCustom')}</span><span className="s">{t('plans.newCustomSub')}</span></span>
          </button>
        )}
        {custom.length > 0 && <div className="hub-cat">{t('plans.customGroup')}</div>}
        {custom.map((p) => (
          <button key={p.id} className={`hub-item ${sel.kind === 'custom' && sel.id === p.id ? 'is-active' : ''}`} onClick={() => setSel({ kind: 'custom', id: p.id })}>
            <span className="hub-item-ic"><Icon name={DEFAULT_ICON} size={18} /></span>
            <span className="hub-item-tx"><span className="t">{p.title}</span><span className="s">{p.subtitle ?? t('plans.custom')}</span></span>
            {p.tag && <span className="hub-tag muted">{p.tag}</span>}
          </button>
        ))}
        <div className="hub-cat">{t('plans.readyGroup')}</div>
        {ready.map((p) => (
          <button key={p.id} className={`hub-item ${sel.kind === 'ready' && sel.id === p.id ? 'is-active' : ''}`} onClick={() => setSel({ kind: 'ready', id: p.id })}>
            <span className="hub-item-ic"><Icon name={p.icon} size={18} /></span>
            <span className="hub-item-tx"><span className="t">{p.title}</span><span className="s">{p.subtitle}</span></span>
            <span className="hub-tag muted">{p.tag}</span>
          </button>
        ))}
      </div>

      <div className="hub-panel">
        {sel.kind === 'new' ? (
          <form className="mod-detail" onSubmit={createPlan}>
            <div className="mod-detail-hd">
              <span className="mod-detail-ic"><Icon name="actions/actions-add" size={22} /></span>
              <div><h3>{t('plans.newCustom')}</h3><p>{t('plans.newCustomFormSub')}</p></div>
            </div>
            {err && <div className="org-alert" style={{ marginBottom: '0.8rem' }}>{err}</div>}
            <div className="org-field-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
              <div className="org-field"><label>{t('plans.title')}</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('plans.titlePh')} /></div>
              <div className="org-field"><label>{t('plans.tag')}</label><input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={t('plans.tagPh')} /></div>
            </div>
            <div className="org-field"><label>{t('plans.subtitle')}</label><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder={t('plans.subtitlePh')} /></div>
            <div className="org-field"><label>{t('plans.description')}</label><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('plans.descriptionPh')} /></div>

            <div className="plans-stages-hd">
              <label>{t('plans.stages')}</label>
              <button type="button" className="org-btn org-btn-outline plans-add-stage" onClick={addStage}>+ {t('plans.addStage')}</button>
            </div>
            {stages.map((s, i) => (
              <div key={i} className="plans-stage-row">
                <input value={s.t} onChange={(e) => setStage(i, 't', e.target.value)} placeholder={t('plans.stageTitle')} />
                <input value={s.d} onChange={(e) => setStage(i, 'd', e.target.value)} placeholder={t('plans.stageDesc')} />
                <input value={s.meta} onChange={(e) => setStage(i, 'meta', e.target.value)} placeholder={t('plans.stageMeta')} className="plans-stage-meta" />
                {stages.length > 1 && <button type="button" className="plans-stage-x" onClick={() => removeStage(i)} aria-label={t('view.delete')}>×</button>}
              </div>
            ))}

            <div className="org-form-actions"><button className="org-btn org-btn-primary" disabled={busy}>{busy ? t('form.saving') : t('plans.create')}</button></div>
          </form>
        ) : curReady ? (
          <div className="mod-detail">
            <div className="mod-detail-hd">
              <span className="mod-detail-ic"><Icon name={curReady.icon} size={22} /></span>
              <div><h3>{curReady.title}</h3><p>{curReady.desc}</p></div>
            </div>
            <div className="mod-kpis">
              {curReady.kpis.map(([k, v]) => <div key={k} className="mod-kpi"><div className="k">{k}</div><div className="v">{v}</div></div>)}
            </div>
            <div className="mod-stages">
              {curReady.stages.map((s, i) => (
                <div key={i} className="mod-stage">
                  <span className="mod-stage-n">{i + 1}</span>
                  <span className="mod-stage-tx"><strong>{s.t}</strong><span>{s.d}</span></span>
                  <span className="mod-stage-meta">{s.meta}</span>
                </div>
              ))}
            </div>
            <div className="org-form-actions">
              <button className="org-btn org-btn-primary" onClick={() => openPreview(curReady.title, curReady.subtitle, curReady.stages)}>{t('plans.exportPdf')}</button>
            </div>
          </div>
        ) : curCustom ? (
          <div className="mod-detail">
            <div className="mod-detail-hd">
              <span className="mod-detail-ic"><Icon name={DEFAULT_ICON} size={22} /></span>
              <div><h3>{curCustom.title}</h3><p>{curCustom.description ?? curCustom.subtitle ?? t('plans.custom')}</p></div>
            </div>
            <div className="mod-stages">
              {curCustom.stages.length === 0 ? <p className="mod-empty">{t('plans.noStages')}</p> : curCustom.stages.map((s, i) => (
                <div key={i} className="mod-stage">
                  <span className="mod-stage-n">{i + 1}</span>
                  <span className="mod-stage-tx"><strong>{s.t}</strong><span>{s.d}</span></span>
                  <span className="mod-stage-meta">{s.meta}</span>
                </div>
              ))}
            </div>
            <div className="org-form-actions">
              <button className="org-btn org-btn-primary" onClick={() => openPreview(curCustom.title, curCustom.subtitle ?? '', curCustom.stages)}>{t('plans.exportPdf')}</button>
              {canManage && <button className="org-btn org-btn-danger" onClick={() => removePlan(curCustom.id)} disabled={busy}>{t('view.delete')}</button>}
            </div>
          </div>
        ) : (
          <div className="mod-detail"><p style={{ color: 'var(--gray-500)' }}>{t('plans.pick')}</p></div>
        )}
      </div>

      {/* ===== معاينة قبل تصدير PDF ===== */}
      {preview && (
        <div className="qm-preview" role="dialog" aria-modal="true">
          <div className="qm-preview-bar">
            <span className="qm-preview-name">{preview.title}</span>
            <div className="qm-preview-actions">
              <button className="org-btn org-btn-primary" onClick={() => window.print()}>{t('plans.exportPdf')}</button>
              <button className="org-btn org-btn-outline" onClick={() => setPreview(null)}>{t('qm.close')}</button>
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
                <h1 className="qm-doc-title">{preview.title}</h1>
                {preview.subtitle && <div className="qm-doc-sub">{preview.subtitle}</div>}
              </header>
              <table className="qm-doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    <th>{t('plans.stageTitle')}</th>
                    <th>{t('plans.stageDesc')}</th>
                    <th>{t('plans.stageMeta')}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.stages.map((s, i) => (
                    <tr key={i}>
                      <td dir="ltr">{i + 1}</td>
                      <td>{s.t}</td>
                      <td className="qm-doc-notes">{s.d}</td>
                      <td>{s.meta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="qm-doc-foot">{t('qm.generatedAt', { date: printedAt })}</div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
