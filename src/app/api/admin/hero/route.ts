import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSession } from '@/lib/session-guard';
import { parseSlideInput } from '@/lib/hero';
import { clientErrorMessage } from '@/lib/client-error';

async function requireOwner() {
  const session = await getVerifiedSession();
  return session && session.role === 'PLATFORM_OWNER' ? session : null;
}

/** كل الشرائح (للوحة الإدارة). */
export async function GET() {
  if (!(await requireOwner())) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const slides = await prisma.heroSlide.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  return NextResponse.json({ ok: true, slides });
}

/** إنشاء شريحة جديدة. */
export async function POST(request: Request) {
  if (!(await requireOwner())) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  try {
    const data = parseSlideInput(body);
    const slide = await prisma.heroSlide.create({ data });
    return NextResponse.json({ ok: true, slide });
  } catch (e) {
    return NextResponse.json({ error: clientErrorMessage(e, 'بيانات غير صالحة.') }, { status: 400 });
  }
}
