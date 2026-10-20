import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import { getStudentScope, halaqaScopeWhere, studentRelationWhere, studentScopeWhere } from '@/lib/access-scope';
import StatisticsView from '@/components/StatisticsView';
import '@/styles/statistics.css';
import { getT, getLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  // كانت الصفحة بلا فحص صلاحية: أي عضو (طالب…) كان يرى أسماء الطلاب وإحصاءاتهم
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const scope = await getStudentScope(user, org.id); // المعلم: حلقاته فقط
  const { t } = await getT();
  const locale = await getLocale();
  const base = `/org/${org.slug}`;
  const w = { organizationId: org.id };

  // آخر 6 أشهر
  const monthFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short' });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: monthFmt.format(d) };
  });
  const since = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const mkey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  const [halaqat, students, memos, attendance, topRaw] = await Promise.all([
    prisma.halaqa.findMany({ where: { ...w, ...halaqaScopeWhere(scope) }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.student.findMany({ where: { ...w, ...studentScopeWhere(scope) }, select: { id: true, name: true, halaqaId: true }, orderBy: { name: 'asc' } }),
    prisma.memorizationEntry.findMany({ where: { ...w, ...studentRelationWhere(scope), date: { gte: since } }, select: { date: true, kind: true } }),
    prisma.attendanceRecord.findMany({ where: { ...w, ...studentRelationWhere(scope), date: { gte: since } }, select: { date: true, status: true } }),
    prisma.memorizationEntry.groupBy({ by: ['studentId'], where: { ...w, ...studentRelationWhere(scope) }, _count: { _all: true }, orderBy: { _count: { studentId: 'desc' } }, take: 5 }),
  ]);

  const nameOf = new Map(students.map((s) => [s.id, s.name]));

  // سلاسل شهرية
  const memoNew = months.map((m) => memos.filter((x) => mkey(x.date) === m.key && x.kind === 'NEW').length);
  const memoReview = months.map((m) => memos.filter((x) => mkey(x.date) === m.key && x.kind === 'REVIEW').length);
  const memoMax = Math.max(1, ...memoNew.map((v, i) => v + memoReview[i]));

  const attRate = months.map((m) => {
    const rows = attendance.filter((x) => mkey(x.date) === m.key);
    if (rows.length === 0) return null;
    return Math.round((rows.filter((x) => x.status === 'PRESENT').length / rows.length) * 100);
  });

  const top = topRaw.map((r) => ({ name: nameOf.get(r.studentId) ?? '—', count: r._count._all })).filter((r) => r.count > 0);

  // مسار الخطّ لنسبة المواظبة
  const W = 520, H = 150, padX = 24, top0 = 14, bottom = 26;
  const usableH = H - top0 - bottom;
  const stepX = (W - padX * 2) / Math.max(1, months.length - 1);
  const pts = attRate.map((v, i) => [padX + i * stepX, top0 + usableH * (1 - (v ?? 0) / 100)] as const);
  const line = attRate.some((v) => v !== null)
    ? pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
    : '';

  return (
    <div className="org-page">
      <nav className="org-crumb" aria-label="مسار">
        <Link href={base}>{t('onav.dashboard')}</Link><span>/</span>
        <Link href={`${base}/education`}>{t('onav.education')}</Link><span>/</span>
        <span className="is-current">{t('pg.statistics.title')}</span>
      </nav>

      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('pg.eyeReports')}</span>
          <h1>{t('pg.statistics.title')}</h1>
          <p>{t('pg.statistics.sub')}</p>
        </div>
      </div>

      <StatisticsView halaqat={halaqat} students={students} />

      {/* ===== إحصاءات متقدّمة ===== */}
      <h2 className="org-section-title">{t('astat.title')}</h2>
      <div className="astat-grid">
        {/* منحنى الحفظ والمراجعة */}
        <section className="org-panel">
          <div className="astat-head"><h3>{t('astat.memoTrend')}</h3>
            <span className="fin-legend"><span className="fin-dot" style={{ background: '#61428C' }} />{t('status.memoKind.NEW')}<span className="fin-dot" style={{ background: '#2f9e7e', marginInlineStart: '0.5rem' }} />{t('status.memoKind.REVIEW')}</span>
          </div>
          {memos.length === 0 ? <p className="org-panel-sub">{t('rep.noData')}</p> : (
            <div className="astat-bars">
              {months.map((m, i) => (
                <div key={m.key} className="astat-bar-col">
                  <div className="astat-stack" title={`${memoNew[i]} + ${memoReview[i]}`}>
                    <span className="astat-seg" style={{ height: `${(memoReview[i] / memoMax) * 100}%`, background: '#2f9e7e' }} />
                    <span className="astat-seg" style={{ height: `${(memoNew[i] / memoMax) * 100}%`, background: '#61428C' }} />
                  </div>
                  <span className="astat-lbl">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* نسبة المواظبة */}
        <section className="org-panel">
          <div className="astat-head"><h3>{t('astat.consistency')}</h3></div>
          {!line ? <p className="org-panel-sub">{t('rep.noData')}</p> : (
            <svg className="astat-line" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={t('astat.consistency')}>
              {[0, 50, 100].map((g) => { const y = top0 + usableH * (1 - g / 100); return <line key={g} x1="0" y1={y} x2={W} y2={y} stroke="rgba(43,26,78,0.08)" strokeDasharray="3 5" />; })}
              <path d={line} fill="none" stroke="#1f7a5a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => attRate[i] !== null ? <g key={i}><circle cx={p[0]} cy={p[1]} r="3.5" fill="#1f7a5a" /><text x={p[0]} y={p[1] - 8} textAnchor="middle" fontSize="11" fill="#1f7a5a">{attRate[i]}%</text></g> : null)}
              {months.map((m, i) => <text key={m.key} x={pts[i][0]} y={H - 8} textAnchor="middle" fontSize="12" fill="#8a83a0">{m.label}</text>)}
            </svg>
          )}
        </section>

        {/* المتفوّقون */}
        <section className="org-panel">
          <div className="astat-head"><h3>{t('astat.topStudents')}</h3></div>
          {top.length === 0 ? <p className="org-panel-sub">{t('rep.noData')}</p> : (
            <ol className="astat-top">
              {top.map((s, i) => (
                <li key={i}><span className={`astat-rank astat-rank-${i + 1}`}>{i + 1}</span><span className="astat-top-name">{s.name}</span><span className="astat-top-count">{s.count} {t('astat.records')}</span></li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
