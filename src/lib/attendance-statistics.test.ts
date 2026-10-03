import { describe, it, expect } from 'vitest';
import { buildAttendanceStatistics, type AttendanceInput } from './attendance-statistics';
const student = { id: 's1', name: 'طالب', halaqaId: 'h1', createdDate: '2026-09-01' };
const record: AttendanceInput = { studentId: 's1', halaqaId: 'h1', date: '2026-09-25', status: 'PRESENT', source: 'roster' };
describe('attendance statistics', () => {
  it('never classifies an unrecorded student as absent', () => {
    const stats = buildAttendanceStatistics([], [student], '2026-09-25');
    expect(stats.unrecorded).toBe(1); expect(stats.counts.ABSENT).toBe(0); expect(stats.attendanceRate).toBeNull();
  });
  it('deduplicates sources and flags conflicts, roster wins regardless of order', () => {
    for (const records of [[record, { ...record, source: 'monthly' as const, status: 'ABSENT' as const }], [{ ...record, source: 'monthly' as const, status: 'ABSENT' as const }, record]]) {
      const stats = buildAttendanceStatistics(records, [student], '2026-09-25');
      expect(stats.total).toBe(1); expect(stats.conflicts).toBe(1); expect(stats.counts.PRESENT).toBe(1); expect(stats.unrecorded).toBe(0);
    }
  });
  it('includes late, excludes excused from the attendance rate', () => {
    const records = [record, { ...record, studentId: 's2', status: 'LATE' as const },
      { ...record, studentId: 's3', status: 'ABSENT' as const }, { ...record, studentId: 's4', status: 'EXCUSED' as const }];
    expect(buildAttendanceStatistics(records, []).attendanceRate).toBe(66.7);
  });
  it('does not invent missing attendance for unknown historical schedules', () => {
    expect(buildAttendanceStatistics([record], [student]).unrecorded).toBeNull();
    expect(buildAttendanceStatistics([], [{ ...student, createdDate: '2026-09-26' }], '2026-09-25').unrecorded).toBe(0);
  });
});
