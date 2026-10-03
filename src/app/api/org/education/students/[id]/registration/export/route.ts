import { NextResponse } from 'next/server';
import { getOrgActor } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canManageRegistration } from '@/lib/student-registration';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageRegistration(actor)) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  const { id } = await params;
  const student = await prisma.student.findFirst({ where: { id, organizationId: actor.organization.id }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!['administrative', 'educational'].includes(body?.mode)) return NextResponse.json({ error: 'نوع النسخة غير صالح.' }, { status: 400 });
  // Record a print request, not a claim that the browser actually printed/saved it.
  await prisma.auditLog.create({ data: { organizationId: actor.organization.id, actorName: actor.name,
    action: 'PRINT_REQUEST', entity: 'StudentRegistration', label: `${id}:${body.mode}` } });
  return NextResponse.json({ ok: true });
}
