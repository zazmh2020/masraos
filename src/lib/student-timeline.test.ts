import { describe, expect, it } from 'vitest';
import { recentStudentTimeline, type StudentTimelineEvent } from './student-timeline';

describe('student recent timeline', () => {
  const event = (id: string, date: string): StudentTimelineEvent => ({ id, date: new Date(date), kind: 'attendance', detail: id });
  it('merges activities by their recorded date without mutating source records', () => {
    const records = [event('older', '2026-09-20'), event('newer', '2026-10-10')];
    expect(recentStudentTimeline(records).map(e => e.id)).toEqual(['newer', 'older']);
    expect(records[0].id).toBe('older');
  });
  it('excludes invalid dates rather than rendering a broken date', () => {
    expect(recentStudentTimeline([event('invalid', 'invalid'), event('valid', '2026-10-10')])).toHaveLength(1);
  });
  it('caps the visible recent feed and gives stable ordering for the same day', () => {
    expect(recentStudentTimeline([event('z', '2026-10-10'), event('a', '2026-10-10')], 1)[0].id).toBe('a');
    expect(recentStudentTimeline([event('a', '2026-10-10')], 0)).toEqual([]);
  });
});
