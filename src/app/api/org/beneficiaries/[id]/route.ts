import { NextResponse } from 'next/server';
import type { BeneficiaryCategory, BeneficiaryStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageBeneficiaries, canSeeBeneficiaryId, isBeneficiaryCategory, isBeneficiaryStatus } from '@/lib/permissions';

async function loadOwn(orgId: string, id: string) {
  return prisma.beneficiary.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageBeneficiaries(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const orgId = actor.organization.id;
  const { id } = await params;
  const target = await loadOwn(orgId, id);
  if (!target) return NextResponse.json({ error: 'المستفيد غير موجود.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: {
    name?: string; phone?: string | null; nationalId?: string | null; notes?: string | null;
    category?: BeneficiaryCategory; status?: BeneficiaryStatus; departmentId?: string | null; programId?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم المستفيد قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
  // الرقم الوطني: يعدّله من يملك beneficiaries.sensitive فقط (غيره لا يراه فلا يستبدله ولا يمحوه)
  if (body.nationalId !== undefined && canSeeBeneficiaryId(actor)) data.nationalId = String(body.nationalId).trim() || null;
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;
  if (body.category !== undefined) {
    const category = String(body.category);
    if (!isBeneficiaryCategory(category)) return NextResponse.json({ error: 'التصنيف غير صالح.' }, { status: 400 });
    data.category = category;
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isBeneficiaryStatus(status)) return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
    data.status = status;
  }
  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
      if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
    }
    data.departmentId = departmentId;
  }
  if (body.programId !== undefined) {
    const programId = body.programId ? String(body.programId) : null;
    if (programId) {
      const prog = await prisma.program.findFirst({ where: { id: programId, organizationId: orgId }, select: { id: true } });
      if (!prog) return NextResponse.json({ error: 'البرنامج غير موجود.' }, { status: 400 });
    }
    data.programId = programId;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });

  await prisma.beneficiary.update({ where: { id: target.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageBeneficiaries(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'المستفيد غير موجود.' }, { status: 404 });

  await prisma.beneficiary.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
