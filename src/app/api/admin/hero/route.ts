import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { parseSlideInput } from '@/lib/hero';

async function requireOwner() {
  const session = await getSession();
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
    return NextResponse.json({ error: e instanceof Error ? e.message : 'بيانات غير صالحة.' }, { status: 400 });
  }
}
