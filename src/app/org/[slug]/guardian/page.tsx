import { IconShape } from '@/components/Icon';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { memoKindLabel, memoRatingLabel, attendanceStatusLabel } from '@/lib/permissions';
import { surahName } from '@/lib/quran';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

/** بوّابة وليّ الأمر — عرض للقراءة فقط، معزول تمامًا: يرى المستخدم أبناءه فقط. */
export default async function GuardianPortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short', day: 'numeric' });

  // عزل: نحمّل سجلّ وليّ الأمر المربوط بهذا الحساب فقط
  const guardian = await prisma.guardian.findFirst({
    where: { userId: user.id, organizationId: org.id },
    select: {
      fullName: true,
      students: {
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true,
          halaqa: { select: { name: true } },
          memorization: { orderBy: { date: 'desc' }, take: 5, select: { id: true, date: true, kind: true, content: true, rating: true } },
          attendance: { orderBy: { date: 'desc' }, take: 60, select: { status: true } },
        },
      },
    },
  });

  const children = guardian?.students ?? [];

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('gp.eyebrow')}</span>
          <h1>{t('gp.title')}</h1>
          <p>{guardian ? t('gp.sub', { n: children.length }) : t('gp.noLink')}</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="org-empty"><IconShape name="users" variant="soft" size="xl" /><p>{guardian ? t('gp.noChildren') : t('gp.noLinkHint')}</p></div>
      ) : (
        <div className="gp-grid">
          {children.map((s) => {
            const present = s.attendance.filter((a) => a.status === 'PRESENT').length;
            const rate = s.attendance.length ? Math.round((present / s.attendance.length) * 100) : null;
            return (
              <section key={s.id} className="gp-card">
                <header className="gp-card-head">
                  <h3>{s.name}</h3>
                  {s.halaqa?.name && <span className="gp-halaqa">{s.halaqa.name}</span>}
                </header>

                <div className="gp-stats">
                  <div className="gp-stat">
                    <span className="gp-stat-val">{rate === null ? '—' : `${rate}%`}</span>
                    <span className="gp-stat-lbl">{t('gp.attendanceRate')}</span>
                  </div>
                  <div className="gp-stat">
                    <span className="gp-stat-val">{s.attendance.length}</span>
                    <span className="gp-stat-lbl">{t('gp.sessions')}</span>
                  </div>
                </div>

                <div className="gp-memo">
                  <h4>{t('gp.recentMemo')}</h4>
                  {s.memorization.length === 0 ? (
                    <p className="org-hint">{t('gp.noMemo')}</p>
                  ) : (
                    <ul className="gp-memo-list">
                      {s.memorization.map((m) => (
                        <li key={m.id}>
                          <span className="gp-memo-date">{dateFmt.format(new Date(m.date))}</span>
                          <span className={`gp-badge gp-kind-${m.kind.toLowerCase()}`}>{memoKindLabel(m.kind)}</span>
                          <span className="gp-memo-content">{surahLabel(m.content)}</span>
                          <span className="gp-memo-rating">{memoRatingLabel(m.rating)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {s.attendance.length > 0 && (
                  <div className="gp-att-legend">
                    {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => {
                      const c = s.attendance.filter((a) => a.status === st).length;
                      return c > 0 ? <span key={st} className={`gp-att gp-att-${st.toLowerCase()}`}>{attendanceStatusLabel(st)}: {c}</span> : null;
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** يعرض اسم السورة إن كان المحتوى رقمًا، وإلا يعرض النصّ كما هو. */
function surahLabel(content: string): string {
  const n = Number(content);
  return Number.isInteger(n) && n >= 1 && n <= 114 ? surahName(n) : content;
}
