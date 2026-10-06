'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  departmentId: string | null;
};
type Member = { id: string; name: string };
type Department = { id: string; name: string };

export default function TasksView({
  tasks, members, departments, canManage,
}: { tasks: Task[]; members: Member[]; departments: Department[]; canManage: boolean }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric' });
  const fmtDate = (d: string | null) => (d ? dateFmt.format(new Date(d)) : null);
  const statusLabel = (v: string) => t(`status.task.${v}`);
  const prioLabel = (v: string) => t(`priority.${v}`);
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of TASK_STATUSES) map[s] = [];
    for (const tk of tasks) (map[tk.status] ??= []).push(tk);
    return map;
  }, [tasks]);

  function resetForm() {
    setTitle(''); setDescription(''); setStatus('TODO'); setPriority('MEDIUM');
    setAssigneeId(''); setDepartmentId(''); setDueDate('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, priority, assigneeId: assigneeId || null, departmentId: departmentId || null, dueDate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.createErr'));
      else { resetForm(); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/tasks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.saveErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('task.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.deleteErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        {canManage && (
          <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
            {creating ? t('shell.cancel') : t('task.new')}
          </button>
        )}
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={handleCreate}>
          <div className="org-field">
            <label htmlFor="tk-title">{t('task.title')}</label>
            <input id="tk-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="org-field">
            <label htmlFor="tk-desc">{t('task.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <textarea id="tk-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="tk-status">{t('view.status')}</label>
              <select id="tk-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="tk-prio">{t('task.priority')}</label>
              <select id="tk-prio" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{prioLabel(p)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="tk-due">{t('task.due')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="tk-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="tk-assignee">{t('task.assignee')}</label>
              <select id="tk-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">{t('task.noAssignee')}</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="tk-dept">{t('view.unitShort')}</label>
              <select id="tk-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('task.creating') : t('task.create')}
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="org-empty"><IconShape name="assessment" variant="soft" size="xl" /><p>{t('task.none')}</p></div>
      ) : (
        <div className="org-board">
          {TASK_STATUSES.map((s) => (
            <section key={s} className={`org-board-col tk-col-${s.toLowerCase()}`}>
              <header className="org-board-head">
                <span>{statusLabel(s)}</span>
                <span className="org-board-count">{byStatus[s]?.length ?? 0}</span>
              </header>
              <div className="org-board-body">
                {(byStatus[s] ?? []).map((tk) => (
                  <article key={tk.id} className="org-task">
                    <div className="org-task-top">
                      <span className={`org-prio org-prio-${tk.priority.toLowerCase()}`}>{prioLabel(tk.priority)}</span>
                      {fmtDate(tk.dueDate) && <span className="org-task-due">{fmtDate(tk.dueDate)}</span>}
                    </div>
                    <h4>{tk.title}</h4>
                    {tk.description && <p className="org-task-desc">{tk.description}</p>}
                    <div className="org-task-foot">
                      <span className="org-task-assignee">{tk.assigneeName ?? t('task.unassigned')}</span>
                    </div>
                    {canManage && (
                      <div className="org-task-actions">
                        <select
                          className="org-inline-select"
                          value={tk.status}
                          disabled={busyId === tk.id}
                          onChange={(e) => patch(tk.id, { status: e.target.value })}
                          aria-label={t('view.status')}
                        >
                          {TASK_STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st)}</option>)}
                        </select>
                        <button className="org-btn org-btn-danger" disabled={busyId === tk.id} onClick={() => remove(tk.id)}>{t('view.delete')}</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
