import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';

const STATUSES = ['UPCOMING', 'OPEN', 'CLOSED'];

/** إنشاء مسابقة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? '').trim();
  if (name.length < 2) return NextResponse.json({ error: 'اسم المسابقة قصير جداً.' }, { status: 400 });

  const level = body?.level ? String(body.level).trim() : null;
  const status = STATUSES.includes(body?.status) ? body.status : 'UPCOMING';
  const startDate = body?.startDate ? new Date(String(body.startDate)) : null;
  const endDate = body?.endDate ? new Date(String(body.endDate)) : null;
  const description = body?.description ? String(body.description).trim().slice(0, 600) : null;
  const prize = body?.prize ? String(body.prize).trim().slice(0, 200) : null;
  const location = body?.location ? String(body.location).trim().slice(0, 200) : null;

  await prisma.competition.create({
    data: { name, level, description, status, startDate, endDate, prize, location, organizationId: actor.organizationId! },
  });
  return NextResponse.json({ ok: true });
}

/** حذف مسابقة */
export async function DELETE(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'مُعرّف مفقود.' }, { status: 400 });

  // عزل: احذف فقط ضمن مؤسسة الفاعل
  await prisma.competition.deleteMany({ where: { id, organizationId: actor.organizationId! } });
  return NextResponse.json({ ok: true });
}
