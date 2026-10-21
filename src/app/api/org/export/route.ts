import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewEducation, canViewDonations, canSeeDonors, canSeeStudentContacts } from '@/lib/permissions';
import { csvRow as row, csvBody } from '@/lib/csv';
import { getStudentScope, studentScopeWhere } from '@/lib/access-scope';
import { logAudit } from '@/lib/audit';
import { DONOR_MASK, withStudentContacts } from '@/lib/sensitive-fields';

function csvResponse(name: string, rows: string[]): Response {
  return new Response(csvBody(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    },
  });
}

/** تصدير بيانات المؤسسة كـ CSV — ?type=students|donations */
export async function GET(request: Request) {
  const actor = await getOrgActor();
  if (!actor) return new Response('غير مصرّح.', { status: 403 });
  const orgId = actor.organization.id;
  const type = new URL(request.url).searchParams.get('type') ?? '';

  if (type === 'students') {
    if (!canViewEducation(actor)) return new Response('غير مصرّح.', { status: 403 });
    const scope = await getStudentScope(actor, orgId); // المعلم: طلاب حلقاته فقط
    const students = await prisma.student.findMany({
      where: { organizationId: orgId, ...studentScopeWhere(scope) }, orderBy: [{ serial: 'asc' }, { name: 'asc' }],
      select: { serial: true, section: true, name: true, phone: true, guardianName: true, guardianPhone: true, guardianEmail: true, status: true, halaqa: { select: { name: true } } },
    });
    const sectionAr: Record<string, string> = { BOYS: 'بنين', GIRLS: 'بنات' };
    const rows = [row(['#', 'القسم', 'الاسم', 'الهاتف', 'ولي الأمر', 'هاتف ولي الأمر', 'بريد ولي الأمر', 'الحالة', 'الحلقة'])];
    const contacts = canSeeStudentContacts(actor);
    for (const raw of students) {
      const s = withStudentContacts(raw, contacts);
      rows.push(row([s.serial, s.section ? sectionAr[s.section] : '', s.name, s.phone, s.guardianName, s.guardianPhone, s.guardianEmail, s.status, s.halaqa?.name]));
    }
    await logAudit(orgId, actor.name, 'exported', 'students', `${students.length}`);
    return csvResponse('students', rows);
  }

  if (type === 'donations') {
    if (!canViewDonations(actor)) return new Response('غير مصرّح.', { status: 403 });
    const donations = await prisma.donation.findMany({
      where: { organizationId: orgId }, orderBy: { donatedAt: 'desc' },
      select: { donorName: true, amount: true, method: true, status: true, donatedAt: true, campaign: { select: { name: true } } },
    });
    const rows = [row(['المتبرع', 'المبلغ', 'الطريقة', 'الحالة', 'التاريخ', 'الحملة'])];
    const donors = canSeeDonors(actor);
    for (const d of donations) rows.push(row([donors ? d.donorName : DONOR_MASK, d.amount, d.method, d.status, d.donatedAt.toISOString().slice(0, 10), d.campaign?.name]));
    await logAudit(orgId, actor.name, 'exported', 'donations', `${donations.length}`);
    return csvResponse('donations', rows);
  }

  return new Response('نوع غير معروف.', { status: 400 });
}
