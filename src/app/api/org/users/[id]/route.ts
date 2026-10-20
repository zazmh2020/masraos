import { NextResponse } from 'next/server';
import type { Role } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canGrantCaps, canManageUsers, isAssignableRole, isUnrestrictedAdmin } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

/** تعديل دور مستخدم أو حالته (تفعيل/إيقاف) داخل مؤسسة الفاعل */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getOrgActor();
  if (!actor || !canManageUsers(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const { id } = await params;

  // عزل: الهدف يجب أن يكون ضمن مؤسسة الفاعل
  const target = await prisma.user.findFirst({
    where: { id, organizationId: actor.organizationId },
  });
  if (!target) {
    return NextResponse.json({ error: 'المستخدم غير موجود.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  // لا يعدّل المستخدم دوره أو حالته أو صلاحياته بنفسه (تفادي القفل والتصعيد الذاتي)
  if (target.id === actor.id && (body.role !== undefined || body.isActive !== undefined || body.customRoleId !== undefined)) {
    return NextResponse.json(
      { error: 'لا يمكنك تعديل دورك أو حالتك أو صلاحياتك بنفسك.' },
      { status: 400 },
    );
  }

  // مدراء المؤسسة (إسنادًا وتعديلًا وإيقافًا) لمدير المؤسسة وحده (H1)
  if (!isUnrestrictedAdmin(actor) && (target.role === 'ORG_ADMIN' || String(body.role ?? '') === 'ORG_ADMIN')) {
    return NextResponse.json({ error: 'تعديل مدير المؤسسة أو إسناد دوره لمدير المؤسسة فقط.' }, { status: 403 });
  }

  const data: { role?: Role; isActive?: boolean; departmentId?: string | null; customRoleId?: string | null } = {};

  if (body.customRoleId !== undefined) {
    const customRoleId = body.customRoleId ? String(body.customRoleId) : null;
    if (customRoleId) {
      // عزل: الدور المخصّص يجب أن يكون ضمن نفس المؤسسة
      const role = await prisma.customRole.findFirst({
        where: { id: customRoleId, organizationId: actor.organization.id },
        select: { id: true, permissions: true },
      });
      if (!role) return NextResponse.json({ error: 'الدور المخصّص غير موجود.' }, { status: 400 });
      // لا يُمنَح مستخدم قدرات لا يملكها الفاعل نفسه (H1)
      if (!canGrantCaps(actor, role.permissions)) {
        return NextResponse.json({ error: 'لا يمكنك منح صلاحيات لا تملكها.' }, { status: 403 });
      }
    }
    data.customRoleId = customRoleId;
  }

  if (body.role !== undefined) {
    const nextRole = String(body.role);
    if (!isAssignableRole(nextRole)) {
      return NextResponse.json({ error: 'الدور غير صالح.' }, { status: 400 });
    }
    data.role = nextRole;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  if (body.departmentId !== undefined) {
    const departmentId = body.departmentId ? String(body.departmentId) : null;
    if (departmentId) {
      // عزل: الوحدة يجب أن تكون ضمن نفس المؤسسة
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: actor.organization.id },
        select: { id: true },
      });
      if (!dept) {
        return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
      }
    }
    data.departmentId = departmentId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }

  // لا تُبقِ المؤسسة بلا مدير نشط
  const losingAdmin =
    target.role === 'ORG_ADMIN' &&
    ((data.role !== undefined && data.role !== 'ORG_ADMIN') ||
      data.isActive === false);

  if (losingAdmin) {
    const otherActiveAdmins = await prisma.user.count({
      where: {
        organizationId: actor.organizationId,
        role: 'ORG_ADMIN',
        isActive: true,
        id: { not: target.id },
      },
    });
    if (otherActiveAdmins === 0) {
      return NextResponse.json(
        { error: 'لا يمكن إبقاء المؤسسة بلا مدير نشط.' },
        { status: 400 },
      );
    }
  }

  // تغيير الدور أو الحالة أو الدور المخصّص يُبطل جلسات المستخدم القائمة فورًا
  const revoke = data.role !== undefined || data.isActive !== undefined || data.customRoleId !== undefined;
  await prisma.user.update({
    where: { id: target.id },
    data: revoke ? { ...data, sessionVersion: { increment: 1 } } : data,
  });
  const changes = [
    data.role !== undefined ? `role=${data.role}` : '',
    data.isActive !== undefined ? (data.isActive ? 'activated' : 'deactivated') : '',
    data.customRoleId !== undefined ? 'customRole' : '',
    data.departmentId !== undefined ? 'department' : '',
  ].filter(Boolean).join(', ');
  await logAudit(actor.organization.id, actor.name, 'updated', 'user', `${target.name}: ${changes}`);
  return NextResponse.json({ ok: true });
}
