import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';
import { getStudentScope, halaqaScopeWhere, studentRelationWhere, studentScopeWhere } from '@/lib/access-scope';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function EducationHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}/education`;
  const w = { organizationId: org.id };
  const scope = await getStudentScope(user, org.id); // المعلم: أعداد حلقاته فقط
  const quran = org.type === 'MOSQUE';

  const [teachers, students, halaqat, memos, assessments, guardians] = await Promise.all([
    prisma.teacher.count({ where: w }),
    prisma.student.count({ where: { ...w, ...studentScopeWhere(scope) } }),
    prisma.halaqa.count({ where: { ...w, ...halaqaScopeWhere(scope) } }),
    prisma.memorizationEntry.count({ where: { ...w, ...studentRelationWhere(scope) } }),
    prisma.assessment.count({ where: { ...w, ...studentRelationWhere(scope) } }),
    prisma.guardian.count({ where: w }),
  ]);

  const items: HubItem[] = [
    ...(quran ? [{ title: t('qm.title'), desc: t('qm.hubDesc'), href: `${base}/monthly` }] : []),
    { title: t('hub.edu.students'), desc: t('hub.edu.students.d'), href: `${base}/students`, count: students },
    { title: t('hub.edu.teachers'), desc: t('hub.edu.teachers.d'), href: `${base}/teachers`, count: teachers },
    { title: quran ? t('hub.edu.halaqat') : t('hub.edu.classes'), desc: quran ? t('hub.edu.halaqat.d') : t('hub.edu.classes.d'), href: `${base}/halaqat`, count: halaqat },
    { title: t('hub.edu.attendance'), desc: t('hub.edu.attendance.d'), href: `${base}/attendance` },
    { title: quran ? t('hub.edu.memo') : t('hub.edu.homework'), desc: quran ? t('hub.edu.memo.d') : t('hub.edu.homework.d'), href: `${base}/memorization`, count: memos },
    { title: t('hub.edu.assessment'), desc: t('hub.edu.assessment.d'), href: `${base}/assessment`, count: assessments },
    { title: t('hub.edu.guardians'), desc: t('hub.edu.guardians.d'), href: `${base}/guardians`, count: guardians },
  ];

  return (
    <SectionHub
      eyebrow={t('hub.corp')}
      title={t('hub.edu.title')}
      intro={quran ? t('hub.edu.introQuran') : t('hub.edu.intro')}
      items={items}
    />
  );
}
