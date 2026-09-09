import Link from 'next/link';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const { q } = await searchParams;
  const { org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const base = `/org/${org.slug}`;
  const term = (q ?? '').trim();
  const where = { organizationId: org.id };

  const serialTerm = /^\d+$/.test(term) ? Number(term) : null;
  const studentWhere = serialTerm != null
    ? { ...where, OR: [{ name: { contains: term, mode: 'insensitive' as const } }, { serial: serialTerm }] }
    : { ...where, name: { contains: term, mode: 'insensitive' as const } };

  const canSearch = term.length >= 2 || serialTerm != null;
  const [students, halaqat, tasks, donations] = canSearch
    ? await Promise.all([
        prisma.student.findMany({ where: studentWhere, take: 8, select: { id: true, name: true, serial: true, section: true, halaqa: { select: { name: true } } } }),
        prisma.halaqa.findMany({ where: { ...where, name: { contains: term, mode: 'insensitive' } }, take: 8, select: { id: true, name: true } }),
        prisma.task.findMany({ where: { ...where, title: { contains: term, mode: 'insensitive' } }, take: 8, select: { id: true, title: true } }),
        prisma.donation.findMany({ where: { ...where, donorName: { contains: term, mode: 'insensitive' } }, take: 8, select: { id: true, donorName: true, amount: true } }),
      ])
    : [[], [], [], []] as [never[], never[], never[], never[]];

  const total = students.length + halaqat.length + tasks.length + donations.length;

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.div.knowledge')}</span>
          <h1>{t('search.title')}</h1>
          <p>{t('search.sub')}</p>
        </div>
      </div>

      <form className="srch-bar" action={`${base}/search`}>
        <input name="q" defaultValue={term} placeholder={t('search.placeholder')} autoFocus />
        <button type="submit" className="org-btn org-btn-primary">{t('search.go')}</button>
      </form>

      {!canSearch ? (
        <div className="org-empty">{t('search.hint')}</div>
      ) : total === 0 ? (
        <div className="org-empty">{t('search.noResults', { q: term })}</div>
      ) : (
        <div className="srch-results">
          {students.length > 0 && (
            <section className="org-panel"><h2>{t('pg.students.title')}</h2>
              {students.map((s) => (
                <Link key={s.id} href={`${base}/education/students/${s.id}`} className="srch-item">
                  <strong>{s.serial != null ? `#${String(s.serial).padStart(4, '0')} · ` : ''}{s.name}</strong>
                  <span>{[s.section ? t(`section.${s.section}`) : null, s.halaqa?.name].filter(Boolean).join(' · ')}</span>
                </Link>
              ))}
            </section>
          )}
          {halaqat.length > 0 && (
            <section className="org-panel"><h2>{t('hub.edu.halaqat')}</h2>
              {halaqat.map((h) => <Link key={h.id} href={`${base}/education/halaqat/${h.id}`} className="srch-item"><strong>{h.name}</strong></Link>)}
            </section>
          )}
          {tasks.length > 0 && (
            <section className="org-panel"><h2>{t('hub.ops.tasks')}</h2>
              {tasks.map((tk) => <Link key={tk.id} href={`${base}/tasks`} className="srch-item"><strong>{tk.title}</strong></Link>)}
            </section>
          )}
          {donations.length > 0 && (
            <section className="org-panel"><h2>{t('hub.ops.donations')}</h2>
              {donations.map((d) => <Link key={d.id} href={`${base}/donations`} className="srch-item"><strong>{d.donorName}</strong><span>{d.amount}</span></Link>)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
