import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canGrantCaps, canManageUsers, ALL_CAPS, isUnrestrictedAdmin } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

function sanitizeCaps(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const set = new Set(ALL_CAPS);
  return [...new Set(input.map((x) => String(x)).filter((c) => set.has(c)))];
}

/** مفوَّض غير مدير: لا يعدّل دورًا يحمله أو دورًا يفوق قدراته (H1) */
function mayEditRole(actor: Parameters<typeof canGrantCaps>[0] & { customRoleId?: string | null }, role: { id: string; permissions: string[] }): boolean {
  if (isUnrestrictedAdmin(actor)) return true;
  if (actor.customRoleId === role.id) return false;
  return canGrantCaps(actor, role.permissions);
}

async function loadOwn(orgId: string, id: string) {
  // عزل: الدور يجب أن يكون ضمن مؤسسة الفاعل
  return prisma.customRole.findFirst({ where: { id, organizationId: orgId } });
}

/** تعديل دور مخصّص */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageUsers(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الدور غير موجود.' }, { status: 404 });
  if (!mayEditRole(actor, target)) return NextResponse.json({ error: 'لا يمكنك تعديل هذا الدور.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: { name?: string; permissions?: string[] } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return NextResponse.json({ error: 'اسم الدور قصير جداً.' }, { status: 400 });
    data.name = name;
  }
  if (body.permissions !== undefined) {
    data.permissions = sanitizeCaps(body.permissions);
    if (!canGrantCaps(actor, data.permissions)) {
      return NextResponse.json({ error: 'لا يمكنك منح صلاحيات لا تملكها.' }, { status: 403 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'لا تغيير مطلوب.' }, { status: 400 });
  }
  await prisma.customRole.update({ where: { id: target.id }, data });
  await logAudit(actor.organization.id, actor.name, 'updated', 'role', target.name);
  return NextResponse.json({ ok: true });
}

/** حذف دور مخصّص — يُزال تلقائيًا عن أعضائه (يعودون للدور الأساسي) */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getOrgActor();
  if (!actor || !canManageUsers(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const { id } = await params;
  const target = await loadOwn(actor.organization.id, id);
  if (!target) return NextResponse.json({ error: 'الدور غير موجود.' }, { status: 404 });
  if (!mayEditRole(actor, target)) return NextResponse.json({ error: 'لا يمكنك حذف هذا الدور.' }, { status: 403 });

  await prisma.customRole.delete({ where: { id: target.id } });
  await logAudit(actor.organization.id, actor.name, 'deleted', 'role', target.name);
  return NextResponse.json({ ok: true });
}
