import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/** إلغاء انضمام مؤسسة لبرنامج الاستحقاق الدائم — لمالك المنصّة حصراً. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;
  const ent = await prisma.permanentEntitlement.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!ent) return NextResponse.json({ error: 'السجل غير موجود.' }, { status: 404 });
  if (ent.status === 'CANCELLED') return NextResponse.json({ error: 'ملغى بالفعل.' }, { status: 409 });

  const body = await request.json().catch(() => null);
  const reason = String(body?.reason ?? '').trim().slice(0, 500) || null;

  await prisma.permanentEntitlement.update({
    where: { id: ent.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
      events: { create: { type: 'CANCELLED', actorUserId: session.userId, note: reason } },
    },
  });

  return NextResponse.json({ ok: true });
}
