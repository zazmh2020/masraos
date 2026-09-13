import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { parseSlideInput } from '@/lib/hero';

async function requireOwner() {
  const session = await getSession();
  return session && session.role === 'PLATFORM_OWNER' ? session : null;
}

/** تعديل شريحة (تعديل كامل، أو إجراء سريع: order/status/enabled). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const existing = await prisma.heroSlide.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'الشريحة غير موجودة.' }, { status: 404 });

  try {
    if (body.title !== undefined) {
      // تعديل كامل
      await prisma.heroSlide.update({ where: { id }, data: parseSlideInput(body) });
    } else {
      // إجراء سريع
      const data: Record<string, unknown> = {};
      if (body.order !== undefined) data.order = Math.trunc(Number(body.order)) || 0;
      if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);
      if (body.status !== undefined) {
        const s = String(body.status);
        if (!['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'].includes(s)) {
          return NextResponse.json({ error: 'حالة غير صالحة.' }, { status: 400 });
        }
        data.status = s;
      }
      if (Object.keys(data).length) await prisma.heroSlide.update({ where: { id }, data });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'بيانات غير صالحة.' }, { status: 400 });
  }
}

/** حذف شريحة. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  await prisma.heroSlide.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
