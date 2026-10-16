import type { Metadata } from 'next';
import { cache } from 'react';
import { BRAND } from '@/lib/brand';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';
import { brandPalette } from '@/lib/brand-palette';
import Icon from '@/components/Icon';
import LangToggle from '@/components/LangToggle';
import '@/styles/public-site.css';

export const dynamic = 'force-dynamic';

const TYPE_KEY: Record<string, string> = {
  ASSOCIATION: 'atype.ASSOCIATION', MOSQUE: 'atype.MOSQUE', SCHOOL: 'atype.SCHOOL', PROJECT: 'atype.PROJECT',
};

/** ألوان الموقع من هوية الجهة عبر brandPalette (نفس اشتقاق اللوحة): تباين مضمون للنص الأبيض مهما كان اللون المختار. */
function siteVars(hex: string | null): CSSProperties {
  const p = brandPalette(hex) ?? brandPalette('#61428C')!;
  return {
    ['--ps-primary' as string]: p.primary, ['--ps-deep' as string]: p.deep, ['--ps-soft' as string]: p.soft,
    ['--ps-support' as string]: p.support, ['--ps-subtle' as string]: p.subtle, ['--ps-on' as string]: p.onBrand,
  };
}

const publicOrganization = cache((slug: string) => prisma.organization.findUnique({
    where: { slug },
    select: {
      name: true, type: true, brandColor: true, logoUrl: true, sitePublished: true, isActive: true,
      aboutText: true, contactEmail: true, contactPhone: true, address: true,
    },
  }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale }, org] = await Promise.all([getT(), publicOrganization(slug)]);
  if (!org?.isActive || !org.sitePublished) return { robots: { index: false, follow: false } };
  return { title: `${org.name} | ${BRAND[locale].name}`, description: org.aboutText || undefined, openGraph: { title: org.name, description: org.aboutText || undefined, siteName: org.name } };
}

// المحتوى الذي تكتبه الجهة (الاسم، النبذة، العنوان، الأخبار) بـ dir="auto" — يُعرض باتجاه لغته أيًّا كانت لغة الواجهة
export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const org = await publicOrganization(slug);

  if (!org || !org.isActive || !org.sitePublished) {
    return (
      <main className="ps-empty">
        <div className="ps-empty-card">
          <span className="ps-empty-icon" aria-hidden="true"><Icon name="world" size={28} /></span>
          <h1>{t('psite.unavailableTitle')}</h1>
          <p>{t('psite.unavailableBody')}</p>
        </div>
      </main>
    );
  }

  const announcements = await prisma.announcement.findMany({
    where: { organization: { slug }, isPublished: true },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 30,
    select: { id: true, title: true, body: true, createdAt: true, pinned: true },
  });

  const phone = org.contactPhone?.replace(/[^\d+]/g, '') || null;

  return (
    <div className="ps" style={siteVars(org.brandColor)}>
      <header className="ps-hero">
        <div className="ps-top"><LangToggle /></div>
        <div className="ps-hero-in">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- شعار الجهة من رابط خارجي يحدده المدير
            <img src={org.logoUrl} alt="" className="ps-logo" />
          ) : (
            <div className="ps-logo ps-logo-ph" aria-hidden="true">{org.name.slice(0, 1)}</div>
          )}
          <h1 dir="auto">{org.name}</h1>
          <p className="ps-type">{t(TYPE_KEY[org.type] ?? 'atype.ASSOCIATION')}</p>
        </div>
      </header>

      <main id="main">
        {org.aboutText && (
          <section className="ps-section ps-about">
            <h2>{t('psite.about')}</h2>
            <p dir="auto">{org.aboutText}</p>
          </section>
        )}

        {(org.contactEmail || phone || org.address) && (
          <section className="ps-section">
            <h2>{t('psite.contact')}</h2>
            <ul className="ps-contact">
              {phone && <li><Icon name="phone" size={18} /><a href={`tel:${phone}`} dir="ltr">{org.contactPhone}</a></li>}
              {org.contactEmail && <li><Icon name="mail" size={18} /><a href={`mailto:${org.contactEmail.trim()}`} dir="ltr">{org.contactEmail}</a></li>}
              {org.address && <li><Icon name="location" size={18} /><span dir="auto">{org.address}</span></li>}
            </ul>
          </section>
        )}

        <section className="ps-section">
          <h2>{t('psite.news')}</h2>
          {announcements.length === 0 ? (
            <p className="ps-none">{t('psite.noNews')}</p>
          ) : (
            <div className="ps-news">
              {announcements.map((a) => (
                <article key={a.id} className="ps-card">
                  <div className="ps-card-top">
                    {a.pinned && <span className="ps-pin"><Icon name="pin" size={13} />{t('psite.pinned')}</span>}
                    <time dateTime={a.createdAt.toISOString()}>{dateFmt.format(a.createdAt)}</time>
                  </div>
                  <h3 dir="auto">{a.title}</h3>
                  <p dir="auto">{a.body}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="ps-footer">
        <span className="ps-footer-name" dir="auto">{org.name}</span>
        <Link href="/" className="ps-by">{t('psite.poweredBy')}</Link>
      </footer>
    </div>
  );
}
