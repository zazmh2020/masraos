import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/* ============================================================
   طبقة بيانات لوحة التعليم — مصدر واحد لكل أدوار الصفحة الرئيسية.
   الواجهات (سطح المكتب والجوال) تعرض هذه البيانات نفسها بتركيب مختلف؛
   لا استعلامات مكرّرة. الصلاحيات والعزل بين المؤسسات يبقيان عند المستدعي
   (requireOrgAccess) وفي كل استعلام عبر organizationId.
   ============================================================ */

/** «اليوم» بنفس تعريف شاشة الحضور (تاريخ UTC بصيغة YYYY-MM-DD). */
export function todayUtc(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}
const DAY = 86400000;

export type HalaqaRow = {
  id: string; name: string; schedule: string | null; teacherName: string | null;
  students: number; recorded: number;
};
export type AttentionRow = { id: string; name: string; absences: number; halaqaName: string | null };
export type ActivityRow = { name: string; text: string | null; pages: number | null; at: Date };

export type AttendanceToday = { recorded: number; present: number };

/** تجميع حضور اليوم حسب الحلقة (حاضر + متأخر = حاضر). */
function summarizeToday(groups: { halaqaId: string; status: string; _count: { _all: number } }[]) {
  const byHalaqa = new Map<string, number>();
  let recorded = 0, present = 0;
  for (const g of groups) {
    recorded += g._count._all;
    if (g.status === 'PRESENT' || g.status === 'LATE') present += g._count._all;
    byHalaqa.set(g.halaqaId, (byHalaqa.get(g.halaqaId) ?? 0) + g._count._all);
  }
  return { total: { recorded, present } as AttendanceToday, byHalaqa };
}

async function absentees(orgId: string, halaqaIds: string[] | null, take: number): Promise<AttentionRow[]> {
  const weekAgo = new Date(todayUtc().getTime() - 6 * DAY);
  const groups = await prisma.attendanceRecord.groupBy({
    by: ['studentId'],
    where: { organizationId: orgId, status: 'ABSENT', date: { gte: weekAgo }, ...(halaqaIds ? { halaqaId: { in: halaqaIds } } : {}) },
    _count: { _all: true },
    having: { studentId: { _count: { gte: 2 } } },
    orderBy: { _count: { studentId: 'desc' } },
    take,
  });
  if (!groups.length) return [];
  const students = await prisma.student.findMany({
    where: { organizationId: orgId, id: { in: groups.map((g) => g.studentId) } },
    select: { id: true, name: true, halaqa: { select: { name: true } } },
  });
  const byId = new Map(students.map((s) => [s.id, s]));
  return groups.flatMap((g) => {
    const s = byId.get(g.studentId);
    return s ? [{ id: s.id, name: s.name, absences: g._count._all, halaqaName: s.halaqa?.name ?? null }] : [];
  });
}

async function recentActivity(orgId: string, studentIds: string[] | null, take: number): Promise<ActivityRow[]> {
  const scope = studentIds ? { studentId: { in: studentIds } } : {};
  const [quran, memo] = await Promise.all([
    prisma.quranDailyRecord.findMany({
      where: { organizationId: orgId, ...scope }, orderBy: { date: 'desc' }, take,
      select: { date: true, newNote: true, pages: true, student: { select: { name: true } } },
    }),
    prisma.memorizationEntry.findMany({
      where: { organizationId: orgId, ...scope }, orderBy: { date: 'desc' }, take,
      select: { date: true, content: true, student: { select: { name: true } } },
    }),
  ]);
  return [
    ...quran.map((r) => ({ name: r.student.name, text: r.newNote || null, pages: r.pages ?? null, at: r.date })),
    ...memo.map((m) => ({ name: m.student.name, text: m.content, pages: null, at: m.date })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}

/* ---------------- المدير / المشرف / الموظف ---------------- */

export const getEducationOverview = cache(async (orgId: string) => {
  const today = todayUtc();
  const w = { organizationId: orgId };
  const [students, teachers, halaqaCount, halaqat, todayGroups, anyAttendance, absent, recent] = await Promise.all([
    prisma.student.count({ where: { ...w, status: 'ACTIVE' } }),
    prisma.teacher.count({ where: { ...w, isActive: true } }),
    prisma.halaqa.count({ where: w }),
    prisma.halaqa.findMany({
      where: w, orderBy: { name: 'asc' }, take: 8,
      select: { id: true, name: true, schedule: true, teacher: { select: { name: true } }, _count: { select: { students: { where: { status: 'ACTIVE' } } } } },
    }),
    prisma.attendanceRecord.groupBy({ by: ['halaqaId', 'status'], where: { ...w, date: today }, _count: { _all: true } }),
    prisma.attendanceRecord.findFirst({ where: w, select: { id: true } }),
    absentees(orgId, null, 5),
    recentActivity(orgId, null, 5),
  ]);
  const { total, byHalaqa } = summarizeToday(todayGroups);
  const rows: HalaqaRow[] = halaqat.map((h) => ({
    id: h.id, name: h.name, schedule: h.schedule, teacherName: h.teacher?.name ?? null,
    students: h._count.students, recorded: byHalaqa.get(h.id) ?? 0,
  }));
  return { students, teachers, halaqaCount, halaqat: rows, today: total, hasAttendance: !!anyAttendance, attention: absent, recent };
});

/* ---------------- المعلّم ---------------- */

export const getTeacherOverview = cache(async (orgId: string, userId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { organizationId: orgId, userId },
    select: {
      id: true, name: true,
      halaqat: { orderBy: { name: 'asc' }, select: { id: true, name: true, schedule: true, _count: { select: { students: { where: { status: 'ACTIVE' } } } } } },
    },
  });
  if (!teacher) return null;
  const ids = teacher.halaqat.map((h) => h.id);
  const today = todayUtc();
  const [todayGroups, studentRows] = await Promise.all([
    ids.length ? prisma.attendanceRecord.groupBy({ by: ['halaqaId', 'status'], where: { organizationId: orgId, halaqaId: { in: ids }, date: today }, _count: { _all: true } }) : Promise.resolve([]),
    ids.length ? prisma.student.findMany({ where: { organizationId: orgId, halaqaId: { in: ids } }, select: { id: true } }) : Promise.resolve([]),
  ]);
  const studentIds = studentRows.map((s) => s.id);
  const [attention, recent] = await Promise.all([
    ids.length ? absentees(orgId, ids, 5) : Promise.resolve([]),
    studentIds.length ? recentActivity(orgId, studentIds, 5) : Promise.resolve([]),
  ]);
  const { total, byHalaqa } = summarizeToday(todayGroups);
  const rows: HalaqaRow[] = teacher.halaqat.map((h) => ({
    id: h.id, name: h.name, schedule: h.schedule, teacherName: teacher.name,
    students: h._count.students, recorded: byHalaqa.get(h.id) ?? 0,
  }));
  return { name: teacher.name, halaqat: rows, students: rows.reduce((s, h) => s + h.students, 0), today: total, attention, recent };
});

/* ---------------- وليّ الأمر ---------------- */

export type ChildRow = {
  id: string; name: string; halaqaName: string | null;
  attendanceRate: number | null; todayStatus: string | null;
  lastMemo: { content: string; at: Date; rating: string } | null;
};

export const getGuardianOverview = cache(async (orgId: string, userId: string) => {
  const guardian = await prisma.guardian.findFirst({
    where: { userId, organizationId: orgId },
    select: { fullName: true, students: { orderBy: { name: 'asc' }, select: { id: true, name: true, halaqa: { select: { name: true } } } } },
  });
  if (!guardian) return null;
  const ids = guardian.students.map((s) => s.id);
  const today = todayUtc();
  const since = new Date(today.getTime() - 29 * DAY);
  const [att, memo] = await Promise.all([
    ids.length ? prisma.attendanceRecord.findMany({ where: { organizationId: orgId, studentId: { in: ids }, date: { gte: since } }, select: { studentId: true, status: true, date: true } }) : Promise.resolve([]),
    ids.length ? prisma.memorizationEntry.findMany({ where: { organizationId: orgId, studentId: { in: ids } }, orderBy: { date: 'desc' }, take: ids.length * 3, select: { studentId: true, content: true, date: true, rating: true } }) : Promise.resolve([]),
  ]);
  const children: ChildRow[] = guardian.students.map((s) => {
    const mine = att.filter((a) => a.studentId === s.id);
    const present = mine.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const todays = mine.find((a) => a.date.getTime() === today.getTime());
    const last = memo.find((m) => m.studentId === s.id);
    return {
      id: s.id, name: s.name, halaqaName: s.halaqa?.name ?? null,
      attendanceRate: mine.length ? Math.round((present / mine.length) * 100) : null,
      todayStatus: todays?.status ?? null,
      lastMemo: last ? { content: last.content, at: last.date, rating: last.rating } : null,
    };
  });
  return { name: guardian.fullName, children };
});

/** هل لهذا الحساب سجل وليّ أمر في المؤسسة؟ (مخزَّن لكل طلب — التخطيط والصفحة يتشاركانه) */
export const isGuardianUser = cache(async (orgId: string, userId: string) =>
  (await prisma.guardian.count({ where: { userId, organizationId: orgId } })) > 0);
