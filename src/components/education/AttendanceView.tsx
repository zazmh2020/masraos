'use client';

import { IconShape } from '@/components/Icon';

import { useEffect, useState } from 'react';
import { ATTENDANCE_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Halaqa = { id: string; name: string; students: { id: string; name: string }[] };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceView({ halaqat }: { halaqat: Halaqa[] }) {
  const { t } = useLocale();
  const [halaqaId, setHalaqaId] = useState(halaqat[0]?.id ?? '');
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const halaqa = halaqat.find((h) => h.id === halaqaId);
  const students = halaqa?.students ?? [];

  // حمّل الحضور المسجّل مسبقًا للحلقة والتاريخ
  useEffect(() => {
    if (!halaqaId || !date) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setMsg(null);
      try {
        const r = await fetch(`/api/org/education/attendance?halaqaId=${halaqaId}&date=${date}`);
        const d = await r.json().catch(() => ({}));
        if (!active) return;
        const next: Record<string, string> = {};
        for (const s of halaqat.find((h) => h.id === halaqaId)?.students ?? []) next[s.id] = 'PRESENT';
        for (const rec of d.records ?? []) next[rec.studentId] = rec.status;
        setMarks(next);
      } catch {
        /* تجاهل — يبقى الافتراضي "حاضر" */
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [halaqaId, date, halaqat]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const records = students.map((s) => ({ studentId: s.id, status: marks[s.id] ?? 'PRESENT' }));
      const res = await fetch('/api/org/education/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ halaqaId, date, records }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ kind: 'error', text: d.error ?? t('form.saveErr') });
      else setMsg({ kind: 'ok', text: t('edu.at.saved') });
    } catch { setMsg({ kind: 'error', text: t('form.netErr') }); }
    finally { setSaving(false); }
  }

  if (halaqat.length === 0) {
    return <div className="org-empty"><IconShape name="attendance" variant="soft" size="xl" /><p>{t('edu.at.empty')}</p></div>;
  }

  return (
    <>
      <div className="org-panel">
        <div className="org-field-row">
          <div className="org-field">
            <label htmlFor="a-halaqa">{t('edu.at.halaqa')}</label>
            <select id="a-halaqa" value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)}>
              {halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="org-field">
            <label htmlFor="a-date">{t('edu.at.date')}</label>
            <input id="a-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {msg && <div className={`org-alert ${msg.kind === 'ok' ? 'is-ok' : ''}`}>{msg.text}</div>}

      {students.length === 0 ? (
        <div className="org-empty"><IconShape name="attendance" variant="soft" size="xl" /><p>{t('edu.at.noStudents')}</p></div>
      ) : (
        <>
          <div className="org-table-wrap" style={{ opacity: loading ? 0.5 : 1 }}>
            <table className="org-table">
              <thead><tr><th>{t('edu.at.student')}</th><th>{t('view.status')}</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>
                      <div className="org-att-choices">
                        {ATTENDANCE_STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={`org-att-btn org-att-${st.toLowerCase()} ${(marks[s.id] ?? 'PRESENT') === st ? 'is-on' : ''}`}
                            onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                          >
                            {t('status.attendance.' + st)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="org-form-actions" style={{ marginTop: '1rem' }}>
            <button className="org-btn org-btn-primary" onClick={save} disabled={saving || loading}>
              {saving ? t('form.saving') : t('edu.at.save')}
            </button>
          </div>
        </>
      )}
    </>
  );
}
