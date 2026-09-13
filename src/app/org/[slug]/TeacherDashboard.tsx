import Link from 'next/link';
import Icon from '@/components/Icon';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';

/** لوحة المعلّم — حلقاته وطلابه (تُقصر على سجلّ المعلّم المرتبط بحسابه). */
export default async function TeacherDashboard({
  orgId, slug, userId, userName,
}: {
  orgId: string;
  slug: string;
  userId: string;
  userName: string;
}) {
  const { t } = await getT();
  const base = `/org/${slug}`;

  const teacher = await prisma.teacher.findFirst({
    where: { organizationId: orgId, userId },
    include: { halaqat: { include: { _count: { select: { students: true } } } } },
  });

  if (!teacher) {
    return (
      <div className="org-page">
        <div className="org-page-head">
          <div>
            <span className="org-eyebrow">{t('td.eyebrow')}</span>
            <h1>{userName}</h1>
            <p>{t('td.notLinked')}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = teacher.halaqat.reduce((s, h) => s + h._count.students, 0);

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('td.eyebrow')}</span>
          <h1>{t('td.welcome')}</h1>
          <p>{teacher.name} · {t('td.totalStudents')}: {totalStudents}</p>
        </div>
      </div>

      <h2 className="org-settings-h2">{t('td.myHalaqat')}</h2>
      {teacher.halaqat.length === 0 ? (
        <div className="org-empty">{t('td.noHalaqat')}</div>
      ) : (
        <div className="mod-grid">
          {teacher.halaqat.map((h) => (
            <div key={h.id} className="mod-card is-active">
              <div className="mod-card-body">
                <div className="mod-card-hd">
                  <strong>{h.name}</strong>
                  <span className="mod-badge is-active">{h._count.students} {t('td.students')}</span>
                </div>
                <div className="dash-quick" style={{ marginTop: '0.7rem' }}>
                  <Link href={`${base}/education/attendance`} className="dash-quick-tile"><Icon name="education/education-attendance" size={18} />{t('td.attendance')}</Link>
                  <Link href={`${base}/education/memorization`} className="dash-quick-tile"><Icon name="education/education-quran-memorization" size={18} />{t('td.memorization')}</Link>
                  <Link href={`${base}/education/halaqat/${h.id}`} className="dash-quick-tile"><Icon name="actions/actions-view" size={18} />{t('td.viewHalaqa')}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
