import { NextResponse } from 'next/server';
import type { OrgPlan } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getVerifiedSession } from '@/lib/session-guard';
import { PLAN_BY_ID } from '@/lib/plans';

/** تغيير باقة مؤسسة — لمالك المنصة فقط */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getVerifiedSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const plan = String(body?.plan ?? '');
  if (!(plan in PLAN_BY_ID)) {
    return NextResponse.json({ error: 'الباقة غير صالحة.' }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
  if (!org) return NextResponse.json({ error: 'المؤسسة غير موجودة.' }, { status: 404 });

  await prisma.organization.update({ where: { id: org.id }, data: { plan: plan as OrgPlan } });
  return NextResponse.json({ ok: true });
}
