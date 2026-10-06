'use client';

import { IconShape } from '@/components/Icon';

import Link from 'next/link';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { HALAQA_TYPES, HALAQA_TRACKS, HALAQA_PERIODS } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Halaqa = {
  id: string; name: string; type: string; track: string | null; period: string | null; schedule: string | null;
  teacherId: string | null; teacherName: string | null; studentCount: number;
};
type Ref = { id: string; name: string };

export default function HalaqatView({ halaqat, teachers, basePath }: { halaqat: Halaqa[]; teachers: Ref[]; basePath: string }) {
  const { t } = useLocale();
  const typeLabel = (v: string) => t(`status.halaqa.${v}`);
  const trackLabel = (v: string) => t(`htrack.${v}`);
  const periodLabel = (v: string) => t(`hperiod.${v}`);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('MEMORIZATION');
  const [track, setTrack] = useState('');
  const [period, setPeriod] = useState('');
  const [schedule, setSchedule] = useState('');
  const [teacherId, setTeacherId] = useState('');

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusyId('__new');
    try {
      const res = await fetch('/api/org/education/halaqat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, track: track || null, period: period || null, schedule, teacherId: teacherId || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.createErr'));
      else { setName(''); setSchedule(''); setTeacherId(''); setType('MEMORIZATION'); setTrack(''); setPeriod(''); setCreating(false); router.refresh(); }
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/halaqat/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.saveErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    if (!confirm(t('edu.hq.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/education/halaqat/${id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? t('form.deleteErr')); else router.refresh();
    } catch { setError(t('form.netErr')); } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="org-toolbar">
        <span className="org-toolbar-spacer" />
        <button className="org-btn org-btn-primary" onClick={() => { setCreating((v) => !v); setError(''); }}>
          {creating ? t('shell.cancel') : t('edu.hq.new')}
        </button>
      </div>

      {error && <div className="org-alert">{error}</div>}

      {creating && (
        <form className="org-form" onSubmit={create}>
          <div className="org-field">
            <label htmlFor="h-name">{t('edu.hq.name')}</label>
            <input id="h-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="h-type">{t('edu.hq.type')}</label>
              <select id="h-type" value={type} onChange={(e) => setType(e.target.value)}>
                {HALAQA_TYPES.map((ht) => <option key={ht} value={ht}>{typeLabel(ht)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="h-track">{t('edu.hq.track')}</label>
              <select id="h-track" value={track} onChange={(e) => setTrack(e.target.value)}>
                <option value="">{t('edu.hq.noTrack')}</option>
                {HALAQA_TRACKS.map((tr) => <option key={tr} value={tr}>{trackLabel(tr)}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="h-period">{t('edu.hq.period')}</label>
              <select id="h-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="">{t('edu.hq.noPeriod')}</option>
                {HALAQA_PERIODS.map((pr) => <option key={pr} value={pr}>{periodLabel(pr)}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="h-teacher">{t('edu.hq.teacher')}</label>
              <select id="h-teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">{t('edu.hq.noTeacher')}</option>
                {teachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </select>
            </div>
            <div className="org-field">
              <label htmlFor="h-sched">{t('edu.hq.schedule')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="h-sched" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder={t('edu.hq.scheduleHint')} />
            </div>
          </div>
          <div className="org-form-actions">
            <button type="submit" className="org-btn org-btn-primary" disabled={busyId === '__new'}>
              {busyId === '__new' ? t('form.saving') : t('edu.hq.create')}
            </button>
          </div>
        </form>
      )}

      {halaqat.length === 0 ? (
        <div className="org-empty"><IconShape name="halaqat" variant="soft" size="xl" /><p>{t('edu.hq.none')}</p></div>
      ) : (
        <div className="org-cards">
          {halaqat.map((h) => (
            <article key={h.id} className="org-card">
              <div className="org-card-head">
                <h3><Link href={`${basePath}/${h.id}`} className="org-link">{h.name}</Link></h3>
                <span className="org-chip">{typeLabel(h.type)}</span>
              </div>
              {(h.track || h.period) && (
                <div className="org-card-tags">
                  {h.track && <span className="org-chip org-chip-track">{trackLabel(h.track)}</span>}
                  {h.period && <span className="org-chip org-chip-period">{periodLabel(h.period)}</span>}
                </div>
              )}
              <div className="org-card-meta">
                <span>{t('edu.hq.teacherLabel', { v: h.teacherName ?? '—' })}</span>
                <span>{t('edu.hq.studentsLabel', { n: h.studentCount })}</span>
              </div>
              {h.schedule && <p className="org-card-desc">{h.schedule}</p>}
              <div className="org-card-actions">
                <select className="org-inline-select" value={h.teacherId ?? ''} disabled={busyId === h.id}
                  onChange={(e) => patch(h.id, { teacherId: e.target.value || null })} aria-label={t('edu.hq.teacher')}>
                  <option value="">{t('edu.hq.noTeacher')}</option>
                  {teachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                </select>
                <button className="org-btn org-btn-danger" disabled={busyId === h.id} onClick={() => remove(h.id)}>{t('view.delete')}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
