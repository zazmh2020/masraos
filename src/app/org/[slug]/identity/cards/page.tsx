import { IconShape } from '@/components/Icon';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewHR } from '@/lib/permissions';
import { roleLabel } from '@/lib/permissions';
import { ensureCardTokens, qrSvg } from '@/lib/cards';
import { getT } from '@/lib/i18n/server';
import CardsToolbar from '@/components/CardsToolbar';
import '@/styles/cards.css';

export const dynamic = 'force-dynamic';

export default async function CardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  // البطاقات تكشف بيانات الأعضاء — تُقصر على الإدارة والموظفين
  if (!canViewHR(user)) redirect(`/org/${org.slug}`);

  const members = await prisma.user.findMany({
    where: { organizationId: org.id, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, role: true, jobTitle: true, cardToken: true },
  });

  const tokens = await ensureCardTokens(members);

  // الرابط المطلق للتحقّق يُبنى من مضيف الطلب
  const h = await headers();
  const host = h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const color = org.brandColor && /^#[0-9a-fA-F]{6}$/.test(org.brandColor) ? org.brandColor : '#61428C';

  const cards = await Promise.all(
    members.map(async (m) => {
      const token = tokens[m.id];
      const url = `${proto}://${host}/verify/${token}`;
      return { id: m.id, name: m.name, role: roleLabel(m.role), jobTitle: m.jobTitle, qr: await qrSvg(url, color) };
    }),
  );

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('onav.identity')}</span>
          <h1>{t('card.pageTitle')}</h1>
          <p>{t('card.pageSub', { n: cards.length, org: org.name })}</p>
        </div>
      </div>

      <CardsToolbar />

      {cards.length === 0 ? (
        <div className="org-empty"><IconShape name="identity" variant="soft" size="xl" /><p>{t('card.none')}</p></div>
      ) : (
        <div className="dc-grid" id="dc-print-area">
          {cards.map((c) => (
            <article key={c.id} className="dc-card" style={{ ['--dc-brand' as string]: color }}>
              <div className="dc-head">
                <span className="dc-org">{org.name}</span>
                <span className="dc-badge">{t('card.badge')}</span>
              </div>
              <div className="dc-body">
                <div className="dc-info">
                  <h3 className="dc-name">{c.name}</h3>
                  <p className="dc-role">{c.jobTitle || c.role}</p>
                </div>
                {/* رمز QR مولّد على الخادم (SVG آمن) */}
                <div className="dc-qr" dangerouslySetInnerHTML={{ __html: c.qr }} />
              </div>
              <div className="dc-foot">
                <span>{t('card.verifyHint')}</span>
                <span className="dc-brand-dot" />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
