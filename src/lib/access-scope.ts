import { prisma } from '@/lib/prisma';

/* ============================================================
   نطاق رؤية المعلم (قرار المالك 20 أكتوبر 2026، H2):
   المعلم يرى طلاب حلقاته فقط — صفحات الطلاب والحلقات والبحث والتصدير.
   بقية الأدوار بنطاقها الحالي (القدرات في permissions.ts).
   الربط: Teacher.userId ← User، وHalaqa.teacherId ← Teacher.
   ============================================================ */

export type ScopeActor = { id: string; role: string };
export type StudentScope = { restricted: false } | { restricted: true; halaqaIds: string[] };

/** هل يخضع هذا الفاعل لنطاق الحلقات؟ (الدور الأساسي TEACHER فقط). */
export const isTeacherScoped = (actor: ScopeActor): boolean => actor.role === 'TEACHER';

/** يحمّل نطاق الفاعل: غير مقيَّد، أو قائمة حلقاته (فارغة إن لم يُربط بسجل معلم). */
export async function getStudentScope(actor: ScopeActor, organizationId: string): Promise<StudentScope> {
  if (!isTeacherScoped(actor)) return { restricted: false };
  const halaqat = await prisma.halaqa.findMany({
    where: { organizationId, teacher: { userId: actor.id } },
    select: { id: true },
  });
  return { restricted: true, halaqaIds: halaqat.map((h) => h.id) };
}

/** شرط where إضافي على الطلاب (يُنشر داخل where الحالي). */
export function studentScopeWhere(scope: StudentScope): { halaqaId?: { in: string[] } } {
  return scope.restricted ? { halaqaId: { in: scope.halaqaIds } } : {};
}

/** شرط where إضافي على الحلقات. */
export function halaqaScopeWhere(scope: StudentScope): { id?: { in: string[] } } {
  return scope.restricted ? { id: { in: scope.halaqaIds } } : {};
}

/** شرط على علاقة «student» في سجلات تابعة للطالب (حفظ، تقييم، رسوم…). */
export function studentRelationWhere(scope: StudentScope): { student?: { halaqaId: { in: string[] } } } {
  return scope.restricted ? { student: { halaqaId: { in: scope.halaqaIds } } } : {};
}
