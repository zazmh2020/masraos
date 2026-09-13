import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canAdjustPoints } from '@/lib/permissions';
import { applyPoints } from '@/lib/points';
import { logAudit } from '@/lib/audit';

/* تعديل يدوي على نقاط طالب (ADJUST) — للإدارة/المشرف فقط، بسبب مسجَّل. */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canAdjustPoints(actor)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'غير مصرّح.' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const serial = Math.trunc(Number(String(body?.serial ?? '').trim()));
  const amount = Math.trunc(Number(body?.amount));
  const increase = body?.increase !== false; // افتراضي: زيادة
  const reason = body?.reason ? String(body.reason).trim().slice(0, 200) : null;

  if (!Number.isFinite(serial) || serial <= 0) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_BARCODE', message: 'رقم طالب غير صالح.' } }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_AMOUNT', message: 'قيمة غير صالحة.' } }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ ok: false, error: { code: 'REASON_REQUIRED', message: 'السبب مطلوب.' } }, { status: 400 });
  }

  const student = await prisma.student.findFirst({
    where: { organizationId: actor.organization.id, serial },
    select: { id: true, name: true },
  });
  if (!student) {
    return NextResponse.json({ ok: false, error: { code: 'STUDENT_NOT_FOUND', message: 'لا يوجد طالب.' } }, { status: 404 });
  }

  const result = await applyPoints({
    organizationId: actor.organization.id,
    studentId: student.id,
    kind: 'ADJUST',
    source: 'MANUAL',
    amount,
    increase,
    reason,
    createdById: actor.id,
  });

  if (!result.ok) {
    const messages: Record<string, string> = { INSUFFICIENT_POINTS: 'الرصيد غير كافٍ.', INVALID_AMOUNT: 'قيمة غير صالحة.', STUDENT_NOT_FOUND: 'لا يوجد طالب.' };
    return NextResponse.json({ ok: false, error: { code: result.code, message: messages[result.code] } }, { status: 409 });
  }

  await logAudit(actor.organization.id, actor.name, 'adjusted', 'points', `${student.name} (${increase ? '+' : '-'}${amount})`);
  return NextResponse.json({ ok: true, balance: result.balance });
}
