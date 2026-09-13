import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { canViewPoints } from '@/lib/permissions';
import DisplayScreen from '@/components/points/DisplayScreen';

export const dynamic = 'force-dynamic';

export default async function PointsDisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  if (!canViewPoints(user)) redirect(`/org/${org.slug}`);
  return <DisplayScreen orgName={org.name} />;
}
