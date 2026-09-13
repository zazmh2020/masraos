import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';

/** لوحة الطالب — ملفّه وحلقته ومعلّمه وحضوره وتسميعه وتقييماته (بياناته وحده). */
export default async function StudentDashboard({
  orgId, userId, userName,
}: {
  orgId: string;
  slug: string;
  userId: string;
  userName: string;
}) {
  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { day: 'numeric', month: 'short' });

  const student = await prisma.student.findFirst({
    where: { organizationId: orgId, userId },
    include: {
      halaqa: { include: { teacher: { select: { name: true } } } },
      memorization: { orderBy: { date: 'desc' }, take: 5 },
      assessments: { orderBy: { date: 'desc' }, take: 5 },
    },
  });

  if (!student) {
    return (
      <div className="org-page">
        <div className="org-page-head">
          <div>
            <span className="org-eyebrow">{t('sd.eyebrow')}</span>
            <h1>{userName}</h1>
            <p>{t('sd.notLinked')}</p>
          </div>
        </div>
      </div>
    );
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const att = await prisma.attendanceRecord.findMany({
    where: { organizationId: orgId, studentId: student.id, date: { gte: since } },
    select: { status: true },
  });
  const present = att.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const rate = att.length ? Math.round((present / att.length) * 100) : 0;

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('sd.eyebrow')}</span>
          <h1>{student.name}</h1>
          <p>{t('sd.welcome')}</p>
        </div>
      </div>

      <div className="dash-stats">
        <div className="org-panel">
          <div className="org-kv"><span>{t('sd.myHalaqa')}</span><strong>{student.halaqa?.name ?? t('sd.noHalaqa')}</strong></div>
          <div className="org-kv"><span>{t('sd.myTeacher')}</span><strong>{student.halaqa?.teacher?.name ?? '—'}</strong></div>
          <div className="org-kv"><span>{t('sd.status')}</span><strong>{t(`status.student.${student.status}`)}</strong></div>
        </div>
        <div className="org-panel">
          <div className="org-kv"><span>{t('sd.attendanceRate')}</span><strong>{rate}%</strong></div>
        </div>
      </div>

      <h2 className="org-settings-h2">{t('sd.memorization')}</h2>
      <div className="org-panel">
        {student.memorization.length === 0 ? (
          <div className="org-empty">{t('sd.noMemo')}</div>
        ) : student.memorization.map((m) => (
          <div key={m.id} className="org-kv"><span>{dateFmt.format(m.date)} · {m.content}</span></div>
        ))}
      </div>

      <h2 className="org-settings-h2">{t('sd.assessments')}</h2>
      <div className="org-panel">
        {student.assessments.length === 0 ? (
          <div className="org-empty">{t('sd.noAssess')}</div>
        ) : student.assessments.map((a) => (
          <div key={a.id} className="org-kv">
            <span>{dateFmt.format(a.date)} · {a.title}</span>
            <strong>{a.score != null ? `${a.score}/${a.maxScore}` : '—'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
