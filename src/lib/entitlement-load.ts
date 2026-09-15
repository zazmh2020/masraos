import { prisma } from '@/lib/prisma';
import { computeEntitlement, effectiveAccruedDays, type EntitlementView } from '@/lib/entitlement';
import type { PermanentEntitlement } from '@/generated/prisma/client';

/** يحمّل سجل الاستحقاق لمؤسسة مع العرض المحسوب خادميًّا (أو null إن لم تكن منضمّة). */
export async function getOrgEntitlement(
  organizationId: string,
): Promise<{ row: PermanentEntitlement; view: EntitlementView } | null> {
  const row = await prisma.permanentEntitlement.findUnique({ where: { organizationId } });
  if (!row) return null;

  const view = computeEntitlement({
    requiredDurationYears: row.requiredDurationYears,
    accruedDays: effectiveAccruedDays(row),
    status: row.status,
    startDate: row.startDate,
    targetDate: row.targetDate,
    completedAt: row.completedAt,
  });
  return { row, view };
}
