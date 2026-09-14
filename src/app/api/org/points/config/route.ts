import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';

/** ضبط إعدادات مسابقة النقاط (النقاط لكل مسح) — لمدير المؤسسة حصراً. */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const n = Math.round(Number(body.pointsPerScan));
  if (!Number.isFinite(n) || n < 1 || n > 1000) {
    return NextResponse.json({ error: 'قيمة غير صالحة — أدخل رقمًا بين 1 و1000.' }, { status: 400 });
  }

  await prisma.organization.update({
    where: { id: actor.organizationId! },
    data: { pointsPerScan: n },
  });

  return NextResponse.json({ ok: true, pointsPerScan: n });
}
