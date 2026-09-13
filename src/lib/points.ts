import { prisma } from '@/lib/prisma';
import type { PointsKind, PointsSource } from '@/generated/prisma/client';

/* ============================================================
   نقاط مسابقة الباركود — دفتر أستاذ (Ledger)
   الرصيد يُشتقّ من آخر حركة (balanceAfter)، لا من حقل مفرد.
   كل عملية ذرّية (transaction) ومحميّة من التكرار (idempotencyKey).
   ============================================================ */

export class PointsError extends Error {
  constructor(public code: 'INVALID_AMOUNT' | 'INSUFFICIENT_POINTS' | 'STUDENT_NOT_FOUND') {
    super(code);
  }
}

/** إشارة الحركة على الرصيد. ADJUST يحدّدها increase. (دالة نقيّة — قابلة للاختبار.) */
export function pointsDelta(kind: PointsKind, amount: number, increase = true): number {
  if (kind === 'EARN') return amount;
  if (kind === 'DEDUCT') return -amount;
  return increase ? amount : -amount; // ADJUST
}

/** رصيد الطالب الحالي (آخر balanceAfter، أو 0). */
export async function getPointsBalance(studentId: string): Promise<number> {
  const last = await prisma.pointsTransaction.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfter: true },
  });
  return last?.balanceAfter ?? 0;
}

export interface ApplyPointsInput {
  organizationId: string;
  studentId: string;
  kind: PointsKind;
  source: PointsSource;
  amount: number; // موجب دائمًا
  increase?: boolean; // لـ ADJUST فقط
  reason?: string | null;
  createdById?: string | null;
  idempotencyKey?: string | null;
}

export type ApplyPointsResult =
  | { ok: true; duplicate: boolean; balance: number; transactionId: string }
  | { ok: false; code: PointsError['code'] };

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';
}

/**
 * يطبّق حركة نقاط ذرّيًّا: يتحقّق من العزل والرصيد، ويكتب balanceAfter موثوقًا.
 * - idempotencyKey مكرّر ⇒ يعيد الحركة القائمة (منع تكرار/replay) بدل تطبيقها ثانيةً.
 * - الرصيد لا ينزل تحت الصفر (INSUFFICIENT_POINTS).
 */
export async function applyPoints(input: ApplyPointsInput): Promise<ApplyPointsResult> {
  const amount = Math.trunc(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, code: 'INVALID_AMOUNT' };

  // منع التكرار: نفس المفتاح = نفس العملية
  if (input.idempotencyKey) {
    const existing = await prisma.pointsTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, balanceAfter: true, organizationId: true },
    });
    if (existing && existing.organizationId === input.organizationId) {
      return { ok: true, duplicate: true, balance: existing.balanceAfter, transactionId: existing.id };
    }
  }

  const delta = pointsDelta(input.kind, amount, input.increase ?? true);

  try {
    const created = await prisma.$transaction(async (tx) => {
      // عزل: الطالب يجب أن يكون في مؤسسة الفاعل
      const student = await tx.student.findFirst({
        where: { id: input.studentId, organizationId: input.organizationId },
        select: { id: true },
      });
      if (!student) throw new PointsError('STUDENT_NOT_FOUND');

      const last = await tx.pointsTransaction.findFirst({
        where: { studentId: input.studentId },
        orderBy: { createdAt: 'desc' },
        select: { balanceAfter: true },
      });
      const next = (last?.balanceAfter ?? 0) + delta;
      if (next < 0) throw new PointsError('INSUFFICIENT_POINTS');

      return tx.pointsTransaction.create({
        data: {
          kind: input.kind,
          source: input.source,
          amount,
          balanceAfter: next,
          reason: input.reason ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          organizationId: input.organizationId,
          studentId: input.studentId,
          createdById: input.createdById ?? null,
        },
        select: { id: true, balanceAfter: true },
      });
    });
    return { ok: true, duplicate: false, balance: created.balanceAfter, transactionId: created.id };
  } catch (e) {
    if (e instanceof PointsError) return { ok: false, code: e.code };
    // سباق على المفتاح الفريد = تكرار متزامن
    if (isUniqueViolation(e) && input.idempotencyKey) {
      const existing = await prisma.pointsTransaction.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true, balanceAfter: true },
      });
      if (existing) return { ok: true, duplicate: true, balance: existing.balanceAfter, transactionId: existing.id };
    }
    throw e;
  }
}
