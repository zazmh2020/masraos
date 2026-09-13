import { prisma } from '@/lib/prisma';

export type PlatformSettings = {
  heroTitle1: string | null;
  heroTitle2: string | null;
  heroSubtitle: string | null;
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
  announcement: null, announcementLink: null, announcementActive: false,
  contactEmail: null, contactPhone: null, whatsapp: null,
  twitterUrl: null, instagramUrl: null,
};

/** يقرأ إعدادات المنصّة العامّة (بلا كتابة). يعيد قيمًا فارغة إن لم تُضبط بعد. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { id: 'main' } });
    return row ? { ...EMPTY, ...row } : EMPTY;
  } catch {
    return EMPTY;
  }
}
