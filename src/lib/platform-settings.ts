import { prisma } from '@/lib/prisma';

export type HomeFeature = { title: string; desc: string };
export type HomeFaq = { q: string; a: string };

export type PlatformSettings = {
  heroTitle1: string | null;
  heroTitle2: string | null;
  heroSubtitle: string | null;
  homeFeatures: HomeFeature[] | null;
  homeFaqs: HomeFaq[] | null;
  announcement: string | null;
  announcementLink: string | null;
  announcementActive: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsapp: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
};

const EMPTY: PlatformSettings = {
  heroTitle1: null, heroTitle2: null, heroSubtitle: null,
  homeFeatures: null, homeFaqs: null,
  announcement: null, announcementLink: null, announcementActive: false,
  contactEmail: null, contactPhone: null, whatsapp: null,
  twitterUrl: null, instagramUrl: null,
};

/** يحوّل قيمة JSON مخزّنة إلى مصفوفة عناصر نظيفة، أو null إن كانت فارغة/غير صالحة. */
function parseList<T>(raw: unknown, pick: (o: Record<string, unknown>) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null;
  const items = raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map(pick)
    .filter((x): x is T => x !== null);
  return items.length > 0 ? items : null;
}

/** يقرأ إعدادات المنصّة العامّة (بلا كتابة). يعيد قيمًا فارغة إن لم تُضبط بعد. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { id: 'main' } });
    if (!row) return EMPTY;
    return {
      ...EMPTY,
      ...row,
      homeFeatures: parseList<HomeFeature>(row.homeFeatures, (o) => {
        const title = typeof o.title === 'string' ? o.title.trim() : '';
        const desc = typeof o.desc === 'string' ? o.desc.trim() : '';
        return title ? { title, desc } : null;
      }),
      homeFaqs: parseList<HomeFaq>(row.homeFaqs, (o) => {
        const q = typeof o.q === 'string' ? o.q.trim() : '';
        const a = typeof o.a === 'string' ? o.a.trim() : '';
        return q && a ? { q, a } : null;
      }),
    };
  } catch {
    return EMPTY;
  }
}
