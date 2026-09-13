import { prisma } from '@/lib/prisma';
import type { HeroStatus } from '@/generated/prisma/client';

/* ============================================================
   Hero CMS — منطق شرائح الواجهة الرئيسية (يديرها مالك المنصّة)
   ============================================================ */

export const HERO_STATUSES: HeroStatus[] = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];
export function isHeroStatus(v: string): v is HeroStatus {
  return (HERO_STATUSES as string[]).includes(v);
}

const URL_RE = /^https?:\/\/.+/i;

/** وجهة الزر: مسار داخلي (/x) أو رابط خارجي كامل أو فارغ. */
function ctaLinkValue(v: unknown): string | null {
  const u = String(v ?? '').trim();
  if (u === '') return null;
  if (u.startsWith('/')) return u.slice(0, 512);
  if (URL_RE.test(u) && u.length <= 2048) return u;
  throw new Error('رابط الزر غير صالح — مسار داخلي (/) أو رابط كامل.');
}
function textValue(v: unknown, max: number): string | null {
  const s = String(v ?? '').trim();
  return s === '' ? null : s.slice(0, max);
}
function dateValue(v: unknown): Date | null {
  if (v == null || v === '') return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error('تاريخ غير صالح.');
  return d;
}

export interface SlideInput {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  status: HeroStatus;
  order: number;
  startAt: Date | null;
  endAt: Date | null;
  enabled: boolean;
}

/** يتحقّق من مدخلات شريحة ويعيدها جاهزة للحفظ (يرمي خطأً عند بيانات غير صالحة). */
export function parseSlideInput(body: Record<string, unknown>): SlideInput {
  const title = String(body.title ?? '').trim();
  if (title.length < 2) throw new Error('العنوان مطلوب.');
  const status = isHeroStatus(String(body.status)) ? (body.status as HeroStatus) : 'DRAFT';
  const order = Number.isFinite(Number(body.order)) ? Math.trunc(Number(body.order)) : 0;
  return {
    title: title.slice(0, 160),
    subtitle: textValue(body.subtitle, 400),
    imageUrl: textValue(body.imageUrl, 2048),
    ctaText: textValue(body.ctaText, 60),
    ctaLink: ctaLinkValue(body.ctaLink),
    status,
    order,
    startAt: dateValue(body.startAt),
    endAt: dateValue(body.endAt),
    enabled: body.enabled === undefined ? true : Boolean(body.enabled),
  };
}

export type PublicHeroSlide = {
  id: string; title: string; subtitle: string | null;
  imageUrl: string | null; ctaText: string | null; ctaLink: string | null;
};

/** الشرائح المعروضة الآن على الواجهة: منشورة/مجدولة، مفعّلة، وضمن نافذة العرض. */
export async function getActiveHeroSlides(): Promise<PublicHeroSlide[]> {
  const now = new Date();
  return prisma.heroSlide.findMany({
    where: {
      enabled: true,
      status: { in: ['PUBLISHED', 'SCHEDULED'] },
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, title: true, subtitle: true, imageUrl: true, ctaText: true, ctaLink: true },
  });
}
