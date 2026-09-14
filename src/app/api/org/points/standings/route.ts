import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';

/* ترتيب الطلاب حسب رصيد النقاط — تستفتيها لوحة الترتيب (شاشة النتائج) وتتحدّث تلقائيًّا. */
export async function GET() {
  const actor = await getOrgActor();
  if (!actor || !canViewPoints(actor)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const students = await prisma.student.findMany({
    where: { organizationId: actor.organization.id, status: 'ACTIVE' },
    select: {
      name: true,
      serial: true,
      pointsTransactions: { orderBy: { createdAt: 'desc' }, take: 1, select: { balanceAfter: true } },
    },
  });
  const rows = students
    .map((s) => ({ name: s.name, serial: s.serial, balance: s.pointsTransactions[0]?.balanceAfter ?? 0 }))
    .sort((a, b) => b.balance - a.balance || (a.serial ?? 0) - (b.serial ?? 0));
  return NextResponse.json({ ok: true, rows });
}
