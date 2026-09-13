import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';

/* آخر عملية نقاط في المؤسسة — تستفتيها شاشة العرض لتعكس مسح المشغّل لاسلكيًّا. */
export async function GET() {
  const actor = await getOrgActor();
  if (!actor || !canViewPoints(actor)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const tx = await prisma.pointsTransaction.findFirst({
    where: { organizationId: actor.organization.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, kind: true, amount: true, balanceAfter: true, createdAt: true,
      student: { select: { name: true, serial: true, halaqa: { select: { name: true } } } },
    },
  });
  return NextResponse.json({
    ok: true,
    latest: tx
      ? {
          id: tx.id,
          name: tx.student.name,
          serial: tx.student.serial,
          halaqa: tx.student.halaqa?.name ?? null,
          kind: tx.kind,
          amount: tx.amount,
          balance: tx.balanceAfter,
          at: tx.createdAt.toISOString(),
        }
      : null,
  });
}
