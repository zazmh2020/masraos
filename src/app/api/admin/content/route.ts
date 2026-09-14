import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const URL_RE = /^https?:\/\/.+/i;

function text(v: unknown, max: number): string | null {
  const s = String(v ?? '').trim();
  return s === '' ? null : s.slice(0, max);
}
function url(v: unknown, label: string): string | null {
  const u = String(v ?? '').trim();
  if (u === '') return null;
  if (!URL_RE.test(u) || u.length > 2048) throw new Error(`رابط ${label} غير صالح.`);
  return u;
}
/** وجهة الإعلان: مسار داخلي (يبدأ بـ /) أو رابط خارجي كامل، أو فارغ. */
function link(v: unknown): string | null {
  const u = String(v ?? '').trim();
  if (u === '') return null;
  if (u.startsWith('/')) return u.slice(0, 512);
  if (URL_RE.test(u) && u.length <= 2048) return u;
  throw new Error('رابط الإعلان غير صالح — استخدم مسارًا داخليًا (يبدأ بـ /) أو رابطًا كاملًا.');
}

/** مميزات الصفحة الرئيسية: مصفوفة {title, desc} — تُهمَل الصفوف بلا عنوان. أقصى 12. */
function features(v: unknown): { title: string; desc: string }[] | null {
  if (!Array.isArray(v)) return null;
  const rows = v
    .map((r) => (r && typeof r === 'object' ? r as Record<string, unknown> : {}))
    .map((r) => ({ title: text(r.title, 80) ?? '', desc: text(r.desc, 240) ?? '' }))
    .filter((r) => r.title !== '')
    .slice(0, 12);
  return rows.length > 0 ? rows : null;
}

/** الأسئلة الشائعة: مصفوفة {q, a} — تُهمَل الصفوف الناقصة. أقصى 20. */
function faqs(v: unknown): { q: string; a: string }[] | null {
  if (!Array.isArray(v)) return null;
  const rows = v
    .map((r) => (r && typeof r === 'object' ? r as Record<string, unknown> : {}))
    .map((r) => ({ q: text(r.q, 160) ?? '', a: text(r.a, 800) ?? '' }))
    .filter((r) => r.q !== '' && r.a !== '')
    .slice(0, 20);
  return rows.length > 0 ? rows : null;
}

/** تخصيص المحتوى العام للمنصّة — لمالك المنصّة فقط. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  let data: Record<string, unknown>;
  try {
    data = {
      heroTitle1: text(body.heroTitle1, 120),
      heroTitle2: text(body.heroTitle2, 120),
      heroSubtitle: text(body.heroSubtitle, 400),
      homeFeatures: features(body.homeFeatures),
      homeFaqs: faqs(body.homeFaqs),
      announcement: text(body.announcement, 300),
      announcementLink: link(body.announcementLink),
      announcementActive: Boolean(body.announcementActive),
      contactEmail: text(body.contactEmail, 160),
      contactPhone: text(body.contactPhone, 40),
      whatsapp: text(body.whatsapp, 40),
      twitterUrl: url(body.twitterUrl, 'X'),
      instagramUrl: url(body.instagramUrl, 'إنستغرام'),
    };
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'بيانات غير صالحة.' }, { status: 400 });
  }

  // حقول JSON: القيمة null تعني حذف المحتوى — تُترجم إلى NULL في قاعدة البيانات
  const payload = {
    ...data,
    homeFeatures: data.homeFeatures ?? Prisma.DbNull,
    homeFaqs: data.homeFaqs ?? Prisma.DbNull,
  } as Prisma.PlatformSettingUncheckedUpdateInput & Prisma.PlatformSettingUncheckedCreateInput;

  await prisma.platformSetting.upsert({
    where: { id: 'main' },
    update: payload,
    create: { id: 'main', ...payload },
  });
  return NextResponse.json({ ok: true });
}
