import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation, canManageEducation } from '@/lib/permissions';
import AttendanceView from '@/components/education/AttendanceView';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);

  const halaqat = await prisma.halaqa.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true,
      students: { orderBy: { name: 'asc' }, select: { id: true, name: true } },
    },
  });

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeEdu')}</span>
          <h1>{t('pg.attendance.title')}</h1>
          <p>{t('pg.attendance.sub')}</p>
        </div>
      </div>
      {canManageEducation(user) && <Link className="org-btn org-btn-outline" href={`/org/${slug}/education/attendance/statistics`}>إحصاءات الحضور والغياب وشاشة العرض</Link>}
      <AttendanceView halaqat={halaqat} />
    </div>
  );
}
