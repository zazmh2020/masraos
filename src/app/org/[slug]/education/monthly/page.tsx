import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation, canManageEducation, canCustomize } from '@/lib/permissions';
import { getT, getLocale } from '@/lib/i18n/server';
import MonthlySheetView from '@/components/education/MonthlySheetView';

export const dynamic = 'force-dynamic';

function ymOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function MonthlySheetPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ student?: string; ym?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();

  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const canManage = canManageEducation(user);

  const students = await prisma.student.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, halaqa: { select: { name: true } } },
  });

  const ym = /^\d{4}-\d{2}$/.test(sp.ym ?? '') ? sp.ym! : ymOf(new Date());
  const [year, month] = ym.split('-').map(Number); // month: 1-12
  const selectedId = students.find((s) => s.id === sp.student)?.id ?? students[0]?.id ?? '';

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const records = selectedId
    ? await prisma.quranDailyRecord.findMany({
        where: { studentId: selectedId, date: { gte: monthStart, lt: monthEnd } },
      })
    : [];

  // صف لكل يوم من الشهر، مدموجًا مع السجل الموجود إن وُجد
  const byDay: Record<number, (typeof records)[number]> = {};
  for (const r of records) byDay[new Date(r.date).getUTCDate()] = r;

  const rows = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${ym}-${String(day).padStart(2, '0')}`;
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun
    const r = byDay[day];
    return {
      day, dateStr, weekday,
      attendance: r?.attendance ?? 'PRESENT',
      newFrom: r?.newFrom ?? null, newTo: r?.newTo ?? null, newNote: r?.newNote ?? null,
      reviewFrom: r?.reviewFrom ?? null, reviewTo: r?.reviewTo ?? null,
      last5From: r?.last5From ?? null, last5To: r?.last5To ?? null,
      listener: r?.listener ?? null, pages: r?.pages ?? null,
      errors: r?.errors ?? null, alerts: r?.alerts ?? null,
      lessonScore: r?.lessonScore ?? null, reviewScore: r?.reviewScore ?? null,
      minorScore: r?.minorScore ?? null, conductScore: r?.conductScore ?? null,
      otherScore: r?.otherScore ?? null,
      notes: r?.notes ?? null,
      exists: !!r,
    };
  });

  const selectedStudent = students.find((s) => s.id === selectedId) ?? null;
  const locale = await getLocale();
  const monthName = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar', { month: 'long' }).format(monthStart);

  return (
    <div className="org-page qm-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeQuran')}</span>
          <h1>{t('qm.title')}</h1>
          <p>{selectedStudent
            ? t('qm.subStudent', { student: selectedStudent.name, month: monthName, year: String(year) })
            : t('qm.sub', { org: org.name })}</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="org-empty">{t('qm.noStudents')}</div>
      ) : (
        <MonthlySheetView
          key={`${selectedId}-${ym}`}
          students={students.map((s) => ({ id: s.id, name: s.name, halaqa: s.halaqa?.name ?? null }))}
          selectedId={selectedId}
          studentName={selectedStudent?.name ?? ''}
          halaqaName={selectedStudent?.halaqa?.name ?? null}
          ym={ym}
          rows={rows}
          canManage={canManage}
          orgName={org.name}
          orgLogo={org.logoUrl}
          monthLabel={monthName}
          year={String(year)}
          summaryLabels={org.quranSummaryLabels ?? null}
          canCustomize={canCustomize(user)}
        />
      )}
    </div>
  );
}
