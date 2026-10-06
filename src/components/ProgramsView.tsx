'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PROGRAM_CATEGORIES, PROGRAM_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Program = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  capacity: number | null;
  departmentId: string | null;
};

type Department = { id: string; name: string };

export default function ProgramsView({
  programs,
  departments,
  canManage,
}: {
  programs: Program[];
  departments: Department[];
  canManage: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | <category>

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('EDUCATIONAL');
  const [status, setStatus] = useState('ACTIVE');
  const [capacity, setCapacity] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? null : null;

  const shown = useMemo(
    () => (filter === 'ALL' ? programs : programs.filter((p) => p.category === filter)),
    [programs, filter],
  );

  function resetForm() {
    setName(''); setDescription(''); setCategory('EDUCATIONAL');
    setStatus('ACTIVE'); setCapacity(''); setDepartmentId('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusyId('__new');
    try {
      const res = await fetch('/api/org/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, category, status,
          capacity: capacity || null,
          departmentId: departmentId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.createErr'));
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch {
      setError(t('form.netErr'));
    } finally {
      setBusyId(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/org/programs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.saveErr'));
      else router.refresh();
    } catch {
      setError(t('form.netErr'));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm(t('prog.deleteConfirm'))) return;
    setError('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/org/programs/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.deleteErr'));
      else router.refresh();
    } catch {
      setError(t('form.netErr'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="org-toolbar">
        <select
          className="org-inline-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label={t('prog.filterByCategory')}
        >
          <option value="ALL">{t('prog.allCategories')}</option>
          {PROGRAM_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`pcat.${c}`)}</option>
          ))}
        </select>
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button
            className="org-btn org-btn-primary"
            onClick={() => { setCreating((v) => !v); setError(''); }}
          >
            {creating ? t('shell.cancel') : t('prog.new')}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field">
            <label htmlFor="pr-name">{t('prog.name')}</label>
            <input id="pr-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="org-field">
            <label htmlFor="pr-desc">{t('prog.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="pr-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="pr-cat">{t('prog.category')}</label>
              <select id="pr-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {PROGRAM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`pcat.${c}`)}</option>
                ))}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="pr-status">{t('view.status')}</label>
              <select id="pr-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {PROGRAM_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.program.${s}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="pr-cap">{t('prog.capacityTarget')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="pr-cap" type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="pr-dept">{t('view.unit')}</label>
              <select id="pr-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('prog.creating') : t('prog.create')}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty">
          <IconShape name="programs" variant="soft" size="xl" />
          {programs.length === 0 ? t('prog.none') : t('prog.noneInCategory')}
        </div>
      ) : (
        <div className="org-cards">
          {shown.map((p) => (
            <article key={p.id} className="org-card">
              <div className="org-card-head">
                <h3>{p.name}</h3>
                <span className={`org-status org-pstatus-${p.status.toLowerCase()}`}>
                  {t(`status.program.${p.status}`)}
                </span>
              </div>
              <div className="org-card-tags">
                <span className="org-chip">{t(`pcat.${p.category}`)}</span>
                {deptName(p.departmentId) && (
                  <span className="org-card-tag">{deptName(p.departmentId)}</span>
                )}
              </div>
              {p.description && <p className="org-card-desc">{p.description}</p>}
              <div className="org-card-meta">
                <span>{t('prog.capacityLabel', { v: p.capacity ?? '—' })}</span>
              </div>
              {canManage && (
                <div className="org-card-actions">
                  <select
                    className="org-inline-select"
                    value={p.status}
                    disabled={busyId === p.id}
                    onChange={(e) => patch(p.id, { status: e.target.value })}
                  >
                    {PROGRAM_STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`status.program.${s}`)}</option>
                    ))}
                  </select>
                  {departments.length > 0 && (
                    <select
                      className="org-inline-select"
                      value={p.departmentId ?? ''}
                      disabled={busyId === p.id}
                      onChange={(e) => patch(p.id, { departmentId: e.target.value || null })}
                      aria-label={t('view.unitShort')}
                    >
                      <option value="">{t('view.noUnit')}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    className="org-btn org-btn-danger"
                    disabled={busyId === p.id}
                    onClick={() => remove(p.id)}
                  >
                    {t('view.delete')}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
