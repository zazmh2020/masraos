import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { imageValue } from '@/lib/branding';
import { planAllowsCustomDomain } from '@/lib/plans';

type OrgData = Record<string, string | null>;

const HEX = /^#?[0-9a-fA-F]{6}$/;
const URL_RE = /^https?:\/\/.+/i;
const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

function hex(value: unknown): string | null {
  const c = String(value ?? '').trim();
  if (c === '') return null;
  if (!HEX.test(c)) throw new Error('لون غير صالح (#RRGGBB).');
  return c.startsWith('#') ? c : `#${c}`;
}
function url(value: unknown, label: string): string | null {
  const u = String(value ?? '').trim();
  if (u === '') return null;
  if (!URL_RE.test(u) || u.length > 2048) throw new Error(`رابط ${label} غير صالح.`);
  return u;
}
function text(value: unknown, max: number): string | null {
  const s = String(value ?? '').trim();
  if (s === '') return null;
  return s.slice(0, max);
}

/** تخصيص الهوية البصرية والرقمية والدومين لمؤسسة — لمالك المنصة فقط. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true, plan: true } });
  if (!org) return NextResponse.json({ error: 'المؤسسة غير موجودة.' }, { status: 404 });

  const data: OrgData = {};
  try {
    // الهوية البصرية
    if (body.brandColor !== undefined) data.brandColor = hex(body.brandColor);
    if (body.brandAccent !== undefined) data.brandAccent = hex(body.brandAccent);
    if (body.logoUrl !== undefined) data.logoUrl = imageValue(body.logoUrl, 'الشعار');
    if (body.faviconUrl !== undefined) data.faviconUrl = imageValue(body.faviconUrl, 'الأيقونة');
    if (body.coverUrl !== undefined) data.coverUrl = imageValue(body.coverUrl, 'الغلاف');
    // الهوية الرقمية
    if (body.tagline !== undefined) data.tagline = text(body.tagline, 160);
    if (body.websiteUrl !== undefined) data.websiteUrl = url(body.websiteUrl, 'الموقع');
    if (body.twitterUrl !== undefined) data.twitterUrl = url(body.twitterUrl, 'X');
    if (body.instagramUrl !== undefined) data.instagramUrl = url(body.instagramUrl, 'إنستغرام');
    if (body.whatsapp !== undefined) {
      const w = String(body.whatsapp ?? '').trim();
      if (w === '') data.whatsapp = null;
      else if (/^[+0-9 ()-]{6,20}$/.test(w)) data.whatsapp = w;
      else throw new Error('رقم واتساب غير صالح.');
    }
    // الدومين المخصّص — تحقّق من الصيغة والتفرّد
    if (body.customDomain !== undefined) {
      const d = String(body.customDomain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (d === '') data.customDomain = null;
      else if (!planAllowsCustomDomain(org.plan)) throw new Error('الدومين المخصّص غير متاح في باقة هذه المؤسسة — يتطلّب الترقية.');
      else if (!DOMAIN_RE.test(d)) throw new Error('صيغة الدومين غير صحيحة (example.com).');
      else {
        const taken = await prisma.organization.findFirst({
          where: { customDomain: d, id: { not: org.id } },
          select: { id: true },
        });
        if (taken) throw new Error('هذا الدومين مستخدَم لمؤسسة أخرى.');
        data.customDomain = d;
      }
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'بيانات غير صالحة.' }, { status: 400 });
  }

  await prisma.organization.update({ where: { id: org.id }, data });
  return NextResponse.json({ ok: true });
}
