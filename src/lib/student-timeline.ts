export type StudentTimelineEvent = {
  id: string;
  date: Date;
  kind: 'attendance' | 'memorization' | 'assessment';
  detail: string;
};

/** A recent activity feed, never a mastery score or a count of unique Quran pages. */
export function recentStudentTimeline(events: StudentTimelineEvent[], limit = 20): StudentTimelineEvent[] {
  return events
    .filter(event => Number.isFinite(event.date.getTime()))
    .toSorted((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, limit));
}
