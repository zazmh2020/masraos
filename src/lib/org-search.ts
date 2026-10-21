import { prisma } from '@/lib/prisma';
import { canSeeDonors, canViewDonations, canViewEducation, canViewTasks, type Actor } from '@/lib/permissions';
import { getStudentScope, halaqaScopeWhere, studentScopeWhere, type ScopeActor } from '@/lib/access-scope';

/* ============================================================
   البحث الموحد داخل المؤسسة — كل نوع نتائج مقيَّد بقدرة الفاعل (خادميًا):
   الطلاب والحلقات: education.view (والمعلم بنطاق حلقاته)،
   المهام: tasks.view، التبرعات: donations.view.
   مَن لا يملك القدرة لا يرى النوع ولا مبالغه ولا عدد نتائجه.
   (إغلاق H4: كان البحث بلا فحص صلاحيات.)
   ============================================================ */

export type OrgSearchResult = {
  students: { id: string; name: string; serial: number | null; section: string | null; halaqa: { name: string } | null }[];
  halaqat: { id: string; name: string }[];
  tasks: { id: string; title: string }[];
  donations: { id: string; donorName: string; amount: number }[];
};

export const EMPTY_SEARCH: OrgSearchResult = { students: [], halaqat: [], tasks: [], donations: [] };

export function searchTerm(raw: string | undefined): { term: string; serialTerm: number | null; canSearch: boolean } {
  const term = (raw ?? '').trim();
  const serialTerm = /^\d+$/.test(term) ? Number(term) : null;
  return { term, serialTerm, canSearch: term.length >= 2 || serialTerm != null };
}

export async function searchOrg(
  actor: Actor & ScopeActor,
  organizationId: string,
  rawTerm: string | undefined,
): Promise<OrgSearchResult> {
  const { term, serialTerm, canSearch } = searchTerm(rawTerm);
  if (!canSearch) return EMPTY_SEARCH;

  const where = { organizationId };
  const eduView = canViewEducation(actor);
  const scope = eduView ? await getStudentScope(actor, organizationId) : null;

  const studentWhere = serialTerm != null
    ? { ...where, OR: [{ name: { contains: term, mode: 'insensitive' as const } }, { serial: serialTerm }] }
    : { ...where, name: { contains: term, mode: 'insensitive' as const } };

  const [students, halaqat, tasks, donations] = await Promise.all([
    eduView && scope
      ? prisma.student.findMany({
          where: { ...studentWhere, ...studentScopeWhere(scope) }, take: 8,
          select: { id: true, name: true, serial: true, section: true, halaqa: { select: { name: true } } },
        })
      : [],
    eduView && scope
      ? prisma.halaqa.findMany({
          where: { ...where, ...halaqaScopeWhere(scope), name: { contains: term, mode: 'insensitive' } }, take: 8,
          select: { id: true, name: true },
        })
      : [],
    canViewTasks(actor)
      ? prisma.task.findMany({ where: { ...where, title: { contains: term, mode: 'insensitive' } }, take: 8, select: { id: true, title: true } })
      : [],
    // البحث باسم المتبرع يكشف وجوده؛ فلا يُبحث فيه أصلًا إلا لمن يرى هويات المتبرعين (NP1)
    canViewDonations(actor) && canSeeDonors(actor)
      ? prisma.donation.findMany({ where: { ...where, donorName: { contains: term, mode: 'insensitive' } }, take: 8, select: { id: true, donorName: true, amount: true } })
      : [],
  ]);
  return { students, halaqat, tasks, donations };
}
