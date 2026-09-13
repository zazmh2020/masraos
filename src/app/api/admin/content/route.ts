import { NextResponse } from 'next/server';
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

/** تخصيص المحتوى العام للمنصّة — لمالك المنصّة فقط. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  let data: Record<string, string | boolean | null>;
  try {
    data = {
      heroTitle1: text(body.heroTitle1, 120),
      heroTitle2: text(body.heroTitle2, 120),
      heroSubtitle: text(body.heroSubtitle, 400),
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

  await prisma.platformSetting.upsert({
    where: { id: 'main' },
    update: data,
    create: { id: 'main', ...data },
  });
  return NextResponse.json({ ok: true });
}
