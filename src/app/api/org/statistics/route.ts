import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewEducation } from '@/lib/permissions';

/** إحصاءات تطوّر الإنجاز — جلسات الحفظ/المراجعة عبر الزمن مع فلاتر. */
export async function GET(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canViewEducation(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const url = new URL(request.url);
  const halaqaId = url.searchParams.get('halaqaId') || undefined;
  const studentId = url.searchParams.get('studentId') || undefined;
  const fromRaw = url.searchParams.get('from');
  const toRaw = url.searchParams.get('to');

  const to = toRaw ? new Date(toRaw) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = fromRaw ? new Date(fromRaw) : new Date(to.getTime() - 1000 * 60 * 60 * 24 * 180);
  from.setHours(0, 0, 0, 0);

  const where = {
    organizationId: actor.organizationId!,
    date: { gte: from, lte: to },
    ...(studentId ? { studentId } : {}),
    ...(halaqaId && !studentId ? { student: { halaqaId } } : {}),
  };

  const entries = await prisma.memorizationEntry.findMany({
    where,
    select: { date: true, kind: true, rating: true, studentId: true },
    orderBy: { date: 'asc' },
  });

  // تقسيم المدى إلى ~10 فترات متساوية
  const N = 10;
  const span = Math.max(1, to.getTime() - from.getTime());
  const step = span / N;
  const labelFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'short' });
  const labels: string[] = [];
  const newSeries = new Array(N).fill(0);
  const reviewSeries = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    labels.push(labelFmt.format(new Date(from.getTime() + step * i)));
  }
  for (const e of entries) {
    let idx = Math.floor((e.date.getTime() - from.getTime()) / step);
    if (idx < 0) idx = 0;
    if (idx >= N) idx = N - 1;
    if (e.kind === 'NEW') newSeries[idx] += 1;
    else reviewSeries[idx] += 1;
  }

  const ratings = { EXCELLENT: 0, GOOD: 0, NEEDS_REPEAT: 0 };
  const students = new Set<string>();
  let newCount = 0;
  let reviewCount = 0;
  for (const e of entries) {
    ratings[e.rating] += 1;
    students.add(e.studentId);
    if (e.kind === 'NEW') newCount += 1;
    else reviewCount += 1;
  }
  const total = entries.length;
  const excellentPct = total ? Math.round((ratings.EXCELLENT / total) * 100) : 0;

  return NextResponse.json({
    kpis: { sessions: total, students: students.size, newCount, reviewCount, excellentPct },
    labels,
    series: { new: newSeries, review: reviewSeries },
    ratings,
  });
}
