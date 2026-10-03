import { NextResponse } from 'next/server';
import { getOrgActor } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageEducation } from '@/lib/permissions';
import { parseDateOnly } from '@/lib/student-registration';
import { buildAttendanceStatistics } from '@/lib/attendance-statistics';

export async function GET(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const query = new URL(request.url).searchParams;
  const start = query.get('start') ?? ''; const end = query.get('end') ?? '';
  let from: Date; let until: Date;
  try {
    const a = parseDateOnly(start); const b = parseDateOnly(end);
    if (!a || !b || b < a || b.getTime() - a.getTime() > 92 * 86400000) throw new Error();
    from = a; until = new Date(b.getTime() + 86400000);
  } catch { return NextResponse.json({ error: 'اختر فترة صحيحة لا تتجاوز 93 يومًا.' }, { status: 400 }); }
  const orgId = actor.organization.id;
  const halaqaId = query.get('halaqa') || undefined;
  const teacherId = query.get('teacher') || undefined;
  const halaqat = await prisma.halaqa.findMany({ where: { organizationId: orgId, ...(halaqaId ? { id: halaqaId } : {}), ...(teacherId ? { teacherId } : {}) }, select: { id: true, name: true } });
  if (halaqaId && !halaqat.length) return NextResponse.json({ error: 'الحلقة غير موجودة ضمن الاختيار.' }, { status: 404 });
  const ids = halaqat.map(h => h.id);
  const where = { organizationId: orgId, halaqaId: { in: ids }, date: { gte: from, lt: until } };
  const [roster, monthly, students] = await Promise.all([
    prisma.attendanceRecord.findMany({ where, orderBy: { createdAt: 'desc' }, select: { studentId: true, halaqaId: true, date: true, status: true, student: { select: { name: true } } } }),
    prisma.quranDailyRecord.findMany({ where, select: { studentId: true, halaqaId: true, date: true, attendance: true, student: { select: { name: true } } } }),
    prisma.student.findMany({ where: { organizationId: orgId, halaqaId: { in: ids }, status: 'ACTIVE' }, select: { id: true, name: true, halaqaId: true, createdAt: true } }),
  ]);
  const records = [
    ...roster.map(r => ({ studentId: r.studentId, halaqaId: r.halaqaId, date: r.date.toISOString().slice(0, 10), status: r.status, source: 'roster' as const })),
    ...monthly.map(r => ({ studentId: r.studentId, halaqaId: r.halaqaId, date: r.date.toISOString().slice(0, 10), status: r.attendance, source: 'monthly' as const })),
  ];
  const studentsForStats = students.map(s => ({ ...s, createdDate: s.createdAt.toISOString().slice(0, 10) }));
  const result = buildAttendanceStatistics(records, studentsForStats, start === end ? start : undefined);
  const names = new Map([...roster, ...monthly].map(r => [r.studentId, r.student.name]));
  const hallNames = new Map(halaqat.map(h => [h.id, h.name]));
  const display = query.get('display') === '1';
  const { resolved, missing, ...summary } = result;
  const absentCounts = new Map<string, number>();
  for (const r of resolved) if (r.status === 'ABSENT') absentCounts.set(r.studentId, (absentCounts.get(r.studentId) ?? 0) + 1);
  const groups = halaqat.map(h => {
    const stats = buildAttendanceStatistics(resolved.filter(r => r.halaqaId === h.id), [], undefined);
    return { id: h.id, name: h.name, ...stats.counts, total: stats.total, attendanceRate: stats.attendanceRate,
      unrecorded: start === end ? missing.filter(s => s.halaqaId === h.id).length : null };
  });
  return NextResponse.json({ ...summary, groups, generatedAt: new Date().toISOString(),
    // Screen mode never sends personal names or student identifiers to the browser.
    ...(display ? {} : { repeatedAbsence: [...absentCounts].filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ name: names.get(id) ?? 'طالب', count })), details: [
      ...resolved.map(r => ({ date: r.date, name: names.get(r.studentId) ?? 'طالب', halaqa: hallNames.get(r.halaqaId ?? '') ?? '—', status: r.status })),
      ...missing.map(s => ({ date: start, name: s.name, halaqa: hallNames.get(s.halaqaId ?? '') ?? '—', status: 'UNRECORDED' })),
    ] }),
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
