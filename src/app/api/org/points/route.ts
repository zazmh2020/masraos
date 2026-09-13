import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';
import { getPointsBalance } from '@/lib/points';

/* اطّلاع على النقاط: بحث بطالب (serial) → رصيد + سجل، أو أحدث الحركات (تقرير). */
export async function GET(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canViewPoints(actor)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'غير مصرّح.' } }, { status: 403 });
  }
  const url = new URL(request.url);
  const orgId = actor.organization.id;
  const serialRaw = url.searchParams.get('serial');

  if (serialRaw) {
    const serial = Math.trunc(Number(serialRaw));
    if (!Number.isFinite(serial)) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_BARCODE', message: 'رقم غير صالح.' } }, { status: 400 });
    }
    const student = await prisma.student.findFirst({
      where: { organizationId: orgId, serial },
      select: { id: true, name: true, serial: true, status: true, halaqa: { select: { name: true } } },
    });
    if (!student) {
      return NextResponse.json({ ok: false, error: { code: 'STUDENT_NOT_FOUND', message: 'لا يوجد طالب.' } }, { status: 404 });
    }
    const [balance, history] = await Promise.all([
      getPointsBalance(student.id),
      prisma.pointsTransaction.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, kind: true, source: true, amount: true, balanceAfter: true, reason: true, createdAt: true },
      }),
    ]);
    return NextResponse.json({
      ok: true,
      student: { name: student.name, serial: student.serial, status: student.status, halaqa: student.halaqa?.name ?? null },
      balance,
      history,
    });
  }

  // أحدث الحركات عبر المؤسسة (للتقرير) — بترقيم بسيط
  const take = Math.min(100, Math.max(1, parseInt(url.searchParams.get('take') || '50', 10)));
  const rows = await prisma.pointsTransaction.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true, kind: true, source: true, amount: true, balanceAfter: true, createdAt: true,
      student: { select: { name: true, serial: true } },
    },
  });
  return NextResponse.json({ ok: true, rows });
}
