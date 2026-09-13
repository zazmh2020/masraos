import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canScanPoints } from '@/lib/permissions';
import { applyPoints } from '@/lib/points';
import { logAudit } from '@/lib/audit';

/* مسح باركود الطالب: منح نقاط (SCAN) أو خصم (REDEEM). كل القواعد خادمية وذرّية. */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canScanPoints(actor)) {
    return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'غير مصرّح.' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const serial = Math.trunc(Number(String(body?.serial ?? '').trim()));
  if (!Number.isFinite(serial) || serial <= 0) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_BARCODE', message: 'باركود غير صالح.' } }, { status: 400 });
  }
  const action = body?.action === 'redeem' ? 'redeem' : 'earn';
  const idempotencyKey = body?.idempotencyKey ? String(body.idempotencyKey).slice(0, 100) : null;

  // عزل: الطالب ضمن مؤسسة الفاعل، بالبحث برقمه (الباركود)
  const student = await prisma.student.findFirst({
    where: { organizationId: actor.organization.id, serial },
    select: { id: true, name: true, serial: true, status: true },
  });
  if (!student) {
    return NextResponse.json({ ok: false, error: { code: 'STUDENT_NOT_FOUND', message: 'لا يوجد طالب بهذا الرقم.' } }, { status: 404 });
  }
  if (student.status !== 'ACTIVE') {
    return NextResponse.json({ ok: false, error: { code: 'STUDENT_INACTIVE', message: 'الطالب غير نشط.' } }, { status: 409 });
  }

  let amount: number;
  let kind: 'EARN' | 'DEDUCT';
  let source: 'SCAN' | 'REDEEM';
  if (action === 'redeem') {
    amount = Math.trunc(Number(body?.amount));
    kind = 'DEDUCT';
    source = 'REDEEM';
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_AMOUNT', message: 'مبلغ الخصم غير صالح.' } }, { status: 400 });
    }
  } else {
    amount = actor.organization.pointsPerScan;
    kind = 'EARN';
    source = 'SCAN';
  }

  const result = await applyPoints({
    organizationId: actor.organization.id,
    studentId: student.id,
    kind,
    source,
    amount,
    reason: action === 'redeem' ? 'استبدال نقاط' : 'مسح',
    createdById: actor.id,
    idempotencyKey,
  });

  if (!result.ok) {
    const messages: Record<string, string> = {
      INSUFFICIENT_POINTS: 'الرصيد غير كافٍ.',
      INVALID_AMOUNT: 'مبلغ غير صالح.',
      STUDENT_NOT_FOUND: 'لا يوجد طالب.',
    };
    return NextResponse.json({ ok: false, error: { code: result.code, message: messages[result.code] } }, { status: 409 });
  }

  // لا نُسجّل التكرار (idempotent) مرتين
  if (!result.duplicate) {
    await logAudit(actor.organization.id, actor.name, action === 'redeem' ? 'redeemed' : 'scanned', 'points', `${student.name} (${amount})`);
  }

  return NextResponse.json({
    ok: true,
    duplicate: result.duplicate,
    student: { name: student.name, serial: student.serial },
    action,
    amount,
    balance: result.balance,
  });
}
