'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  departmentId: string | null;
};

type Department = { id: string; name: string };

export default function ProjectsView({
  projects,
  departments,
  canManage,
}: {
  projects: Project[];
  departments: Department[];
  canManage: boolean;
}) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmt = (d: string | null) => (d ? dateFmt.format(new Date(d)) : '—');
  const statusLabel = (s: string) => t(`status.project.${s}`);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL'); // ALL | NONE | <deptId>

  // نموذج الإنشاء
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? null : null;

  const shown = useMemo(() => {
    if (filter === 'ALL') return projects;
    if (filter === 'NONE') return projects.filter((p) => !p.departmentId);
    return projects.filter((p) => p.departmentId === filter);
  }, [projects, filter]);

  function resetForm() {
    setName(''); setDescription(''); setStatus('PLANNED');
    setStartDate(''); setEndDate(''); setDepartmentId('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusyId('__new');
    try {
      const res = await fetch('/api/org/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status, startDate, endDate, departmentId: departmentId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t('form.createErr'));
      } else {
        resetForm();
        setCreating(false);
        router.refresh();
      }
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
      const res = await fetch(`/api/org/projects/${id}`, {
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
    if (!confirm(t('proj.deleteConfirm'))) return;
    setError('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/org/projects/${id}`, { method: 'DELETE' });
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
        {departments.length > 0 && (
          <select
            className="org-inline-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label={t('view.filterByUnit')}
          >
            <option value="ALL">{t('view.allUnits')}</option>
            <option value="NONE">{t('view.noUnitFilter')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button
            className="org-btn org-btn-primary"
            onClick={() => { setCreating((v) => !v); setError(''); }}
          >
            {creating ? t('shell.cancel') : t('proj.new')}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field">
            <label htmlFor="p-name">{t('proj.name')}</label>
            <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="org-field">
            <label htmlFor="p-desc">{t('proj.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="p-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="p-status">{t('view.status')}</label>
              <select id="p-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="p-dept">{t('view.unit')}</label>
              <select id="p-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="p-start">{t('view.startDate')}</label>
              <input id="p-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="org-field">
              <label htmlFor="p-end">{t('view.endDate')}</label>
              <input id="p-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('proj.creating') : t('proj.create')}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="org-empty">
          <IconShape name="projects" variant="soft" size="xl" />
          {projects.length === 0 ? t('proj.none') : t('proj.noneInUnit')}
        </div>
      ) : (
        <div className="org-cards">
          {shown.map((p) => (
            <article key={p.id} className="org-card">
              <div className="org-card-head">
                <h3>{p.name}</h3>
                <span className={`org-status org-status-${p.status.toLowerCase()}`}>
                  {statusLabel(p.status)}
                </span>
              </div>
              {deptName(p.departmentId) && (
                <span className="org-card-tag">{deptName(p.departmentId)}</span>
              )}
              {p.description && <p className="org-card-desc">{p.description}</p>}
              <div className="org-card-meta">
                <span>{t('view.from', { d: fmt(p.startDate) })}</span>
                <span>{t('view.to', { d: fmt(p.endDate) })}</span>
              </div>
              {canManage && (
                <div className="org-card-actions">
                  <select
                    className="org-inline-select"
                    value={p.status}
                    disabled={busyId === p.id}
                    onChange={(e) => patch(p.id, { status: e.target.value })}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
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
