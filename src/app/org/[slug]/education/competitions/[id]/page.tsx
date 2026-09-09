import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation, canManageEducation } from '@/lib/permissions';
import { getT } from '@/lib/i18n/server';
import ParticipantsView from '@/components/education/ParticipantsView';

export const dynamic = 'force-dynamic';

export default async function CompetitionDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  if (!canViewEducation(user)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}`;

  const comp = await prisma.competition.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true, name: true, level: true, status: true, entrants: { select: { id: true, name: true, score: true } } },
  });
  if (!comp) notFound();

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <Link href={`${base}/education/competitions`} className="org-back-link">← {t('pg.competitions.title')}</Link>
          <h1>{comp.name}</h1>
          <p>{comp.level ? `${comp.level} · ` : ''}{t(`status.competition.${comp.status}`)}</p>
        </div>
      </div>
      <ParticipantsView competitionId={comp.id} canManage={canManageEducation(user)} participants={comp.entrants} />
    </div>
  );
}
