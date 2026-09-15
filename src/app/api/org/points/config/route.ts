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

  const data: { pointsPerScan?: number; pointsBoardRotateSec?: number } = {};

  if (body.pointsPerScan !== undefined) {
    const n = Math.round(Number(body.pointsPerScan));
    if (!Number.isFinite(n) || n < 1 || n > 1000) {
      return NextResponse.json({ error: 'قيمة غير صالحة — أدخل رقمًا بين 1 و1000.' }, { status: 400 });
    }
    data.pointsPerScan = n;
  }

  if (body.boardRotateSec !== undefined) {
    const s = Math.round(Number(body.boardRotateSec));
    if (!Number.isFinite(s) || s < 3 || s > 120) {
      return NextResponse.json({ error: 'مدة التدوير غير صالحة — أدخل رقمًا بين 3 و120 ثانية.' }, { status: 400 });
    }
    data.pointsBoardRotateSec = s;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  await prisma.organization.update({
    where: { id: actor.organizationId! },
    data,
  });

  return NextResponse.json({ ok: true, ...data });
}
