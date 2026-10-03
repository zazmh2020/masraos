import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageRegistration, registrationFields } from '@/lib/student-registration';
import { isS3Configured } from '@/lib/s3';
import StudentRegistrationForm from '@/components/education/StudentRegistrationForm';

export const dynamic = 'force-dynamic';

export default async function RegistrationPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canManageRegistration(user)) redirect(`/org/${slug}`);
  const student = await prisma.student.findFirst({ where: { id, organizationId: org.id },
    include: { registration: true, halaqa: { select: { name: true, teacher: { select: { name: true } } } } } });
  if (!student) notFound();
  const r = student.registration;
  const initial: Record<string, string> = Object.fromEntries(registrationFields.map(([key]) => [key, r?.[key] ?? '']));
  Object.assign(initial, { name: student.name, phone: student.phone ?? '', guardianName: student.guardianName ?? '',
    guardianPhone: student.guardianPhone ?? '', guardianEmail: student.guardianEmail ?? '',
    birthDate: student.birthDate?.toISOString().slice(0, 10) ?? '', enrolledAt: r?.enrolledAt?.toISOString().slice(0, 10) ?? '' });
  return <div className="org-page" dir="rtl">
    <Link className="org-back-link" href={`/org/${slug}/education/students/${id}`}>العودة إلى ملف الطالب</Link>
    <h1>استمارة الطالب</h1>
    <p>بيانات إدارية خاصة. اجمع فقط ما يحتاجه المركز، وراجع أرقام الاتصال دوريًا.</p>
    <StudentRegistrationForm key={r?.updatedAt.toISOString() ?? student.updatedAt.toISOString()} id={id} initial={initial}
      consent={r?.consentConfirmed ?? false} hasPhoto={Boolean(r?.photoKey)} storageReady={isS3Configured()}
      org={{ name: org.name, logoUrl: org.logoUrl }} serial={student.serial}
      halaqa={student.halaqa?.name ?? 'غير مسند'} teacher={student.halaqa?.teacher?.name ?? 'غير مسند'}
      status={student.status} updatedAt={(r?.updatedAt ?? student.updatedAt).toISOString()}
      updatedBy={r?.updatedByName ?? 'لم تستكمل الاستمارة بعد'} />
  </div>;
}
