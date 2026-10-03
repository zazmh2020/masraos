import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageEducation } from '@/lib/permissions';
import AttendanceStatistics from '@/components/education/AttendanceStatistics';

export const dynamic = 'force-dynamic';
export default async function StatisticsPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ display?: string }>;
}) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canManageEducation(user)) redirect(`/org/${slug}`);
  const display = (await searchParams).display === '1';
  const [halaqat, teachers] = await Promise.all([
    prisma.halaqa.findMany({ where: { organizationId: org.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.teacher.findMany({ where: { organizationId: org.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return <div className="org-page" dir="rtl">
    <Link href={`/org/${slug}/education/attendance`} className="org-back-link">كشف الحضور</Link>
    <AttendanceStatistics orgName={org.name} halaqat={halaqat} teachers={display ? [] : teachers} display={display} />
  </div>;
}
