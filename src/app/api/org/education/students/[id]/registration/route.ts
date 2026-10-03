import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageRegistration, validateRegistration } from '@/lib/student-registration';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageRegistration(actor)) return NextResponse.json({ error: 'الاستمارة الإدارية متاحة لمدير المركز فقط.' }, { status: 403 });
  const { id } = await params;
  const student = await prisma.student.findFirst({ where: { id, organizationId: actor.organization.id }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 });
  let data;
  try { data = validateRegistration(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'بيانات غير صالحة.' }, { status: 400 }); }
  const current = await prisma.studentRegistration.findUnique({ where: { studentId: id }, select: { photoKey: true } });
  if (current?.photoKey && !data.registration.consentConfirmed) return NextResponse.json({ error: 'أزل الصورة أولًا قبل إلغاء تأكيد الموافقة.' }, { status: 400 });
  await prisma.$transaction([
    prisma.student.update({ where: { id, organizationId: actor.organization.id }, data: data.student }),
    prisma.studentRegistration.upsert({ where: { studentId: id },
      create: { studentId: id, ...data.registration, updatedByName: actor.name },
      update: { ...data.registration, updatedByName: actor.name } }),
    prisma.auditLog.create({ data: { organizationId: actor.organization.id, actorName: actor.name,
      action: 'UPDATE', entity: 'StudentRegistration', label: id } }),
  ]);
  return NextResponse.json({ ok: true });
}
