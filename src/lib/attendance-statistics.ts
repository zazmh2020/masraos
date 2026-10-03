export const attendanceLabels = { PRESENT: 'حاضر', LATE: 'متأخر', ABSENT: 'غائب', EXCUSED: 'بعذر', UNRECORDED: 'لم يُسجّل' } as const;
export type Mark = Exclude<keyof typeof attendanceLabels, 'UNRECORDED'>;
export type AttendanceInput = { studentId: string; halaqaId: string | null; date: string; status: Mark; source: 'roster' | 'monthly' };
export type RosterStudent = { id: string; name: string; halaqaId: string | null; createdDate: string };
export function buildAttendanceStatistics(records: AttendanceInput[], students: RosterStudent[], singleDate?: string) {
  const map = new Map<string, AttendanceInput>();
  const conflicts = new Set<string>();
  for (const record of records) {
    const key = `${record.studentId}:${record.date}`;
    const prior = map.get(key);
    if (prior && prior.status !== record.status) conflicts.add(key);
    // The attendance roster is authoritative; monthly records fill missing days only.
    if (!prior || (record.source === 'roster' && prior.source !== 'roster')) map.set(key, record);
  }
  const resolved = [...map.values()];
  const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
  const daily = new Map<string, typeof counts>();
  for (const r of resolved) {
    counts[r.status]++;
    const day = daily.get(r.date) ?? { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
    day[r.status]++; daily.set(r.date, day);
  }
  const eligible = singleDate ? students.filter(s => s.createdDate <= singleDate) : [];
  const missing = eligible.filter(s => !map.has(`${s.id}:${singleDate}`));
  const denominator = counts.PRESENT + counts.LATE + counts.ABSENT;
  return { counts, total: resolved.length, conflicts: conflicts.size, activeStudents: students.length,
    eligible: singleDate ? eligible.length : null, unrecorded: singleDate ? missing.length : null,
    attendanceRate: denominator ? Math.round((counts.PRESENT + counts.LATE) / denominator * 1000) / 10 : null,
    daily: [...daily].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values })),
    resolved, missing };
}
