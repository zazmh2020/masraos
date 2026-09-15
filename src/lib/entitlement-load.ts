import { prisma } from '@/lib/prisma';
import { computeEntitlement, type EntitlementView } from '@/lib/entitlement';
import type { PermanentEntitlement } from '@/generated/prisma/client';

/** يحمّل سجل الاستحقاق لمؤسسة مع العرض المحسوب خادميًّا (أو null إن لم تكن منضمّة). */
export async function getOrgEntitlement(
  organizationId: string,
): Promise<{ row: PermanentEntitlement; view: EntitlementView } | null> {
  const row = await prisma.permanentEntitlement.findUnique({ where: { organizationId } });
  if (!row) return null;

  // عرض حيّ (خادميّ): إن كانت الحالة ACTIVE نضيف المنقضي منذ آخر تراكم حتى تتحرّك النسبة يوميًّا
  // دون انتظار حدث Stripe التالي — القيمة المخزّنة (accruedDays) تبقى نقطة الحفظ الرسمية.
  let displayDays = row.accruedDays;
  if (row.status === 'ACTIVE' && row.lastAccrualAt) {
    const elapsed = Math.floor((Date.now() - row.lastAccrualAt.getTime()) / 86_400_000);
    if (elapsed > 0) displayDays += elapsed;
  }

  const view = computeEntitlement({
    requiredDurationYears: row.requiredDurationYears,
    accruedDays: displayDays,
    status: row.status,
    startDate: row.startDate,
    targetDate: row.targetDate,
    completedAt: row.completedAt,
  });
  return { row, view };
}
