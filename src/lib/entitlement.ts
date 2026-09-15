import type { OrgPlan } from '@/generated/prisma/client';
import { planEntitlementYears } from '@/lib/plans';

/* ============================================================
   برنامج الاستحقاق الدائم — المنطق المركزي (خادميّ فقط).
   كل الحسابات هنا؛ الواجهة لا تحسب المدد ولا التواريخ.
   ============================================================ */

/** إصدار الاتفاقية والشروط المعروضة حاليًا — يُحدَّث عند تغيّر النصّ. */
export const ENTITLEMENT_AGREEMENT_VERSION = '1.0';
export const ENTITLEMENT_TERMS_VERSION = '1.0';

const DAYS_PER_YEAR = 365;
const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

export type EntitlementStatusName = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

/** شروط الانضمام المشتقّة من الباقة (خادميًّا) — أو null إن كانت الباقة غير مؤهّلة. */
export function deriveEnrollmentTerms(
  planId: OrgPlan,
  startDate: Date = new Date(),
): { requiredDurationYears: number; startDate: Date; targetDate: Date } | null {
  const years = planEntitlementYears(planId);
  if (years == null) return null;
  const targetDate = new Date(startDate);
  targetDate.setFullYear(targetDate.getFullYear() + years);
  return { requiredDurationYears: years, startDate, targetDate };
}

export interface EntitlementCore {
  requiredDurationYears: number;
  accruedDays: number;
  status: EntitlementStatusName;
  startDate: Date;
  targetDate: Date;
  completedAt?: Date | null;
}

export interface EntitlementView {
  requiredDays: number;
  accruedDays: number;
  remainingDays: number;
  /** نسبة الإنجاز 0–1 */
  progress: number;
  isComplete: boolean;
  /** المتبقّي مقسّمًا لسنوات/أشهر (تقريبي للعرض) */
  remaining: { years: number; months: number };
  /** المكتمل مقسّمًا لسنوات/أشهر */
  completed: { years: number; months: number };
  status: EntitlementStatusName;
}

/** يشتقّ العرض من الوقت المدفوع المتراكم (accruedDays هو المصدر الوحيد للتقدّم). */
export function computeEntitlement(e: EntitlementCore): EntitlementView {
  const requiredDays = Math.max(0, e.requiredDurationYears * DAYS_PER_YEAR);
  const accruedDays = Math.min(requiredDays, Math.max(0, Math.floor(e.accruedDays)));
  const remainingDays = Math.max(0, requiredDays - accruedDays);
  const progress = requiredDays > 0 ? accruedDays / requiredDays : 0;
  const isComplete = e.status === 'COMPLETED' || accruedDays >= requiredDays;

  const split = (days: number) => {
    const totalMonths = Math.round(days / DAYS_PER_MONTH);
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
  };

  return {
    requiredDays,
    accruedDays,
    remainingDays,
    progress: Math.min(1, Math.max(0, progress)),
    isComplete,
    remaining: split(remainingDays),
    completed: split(accruedDays),
    status: e.status,
  };
}
