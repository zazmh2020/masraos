import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageUsers, isAssignableRole, isUnrestrictedAdmin } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { planUserLimit, planLabel } from '@/lib/plans';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** إنشاء مستخدم داخل مؤسسة الفاعل — العزل مفروض بربط المستخدم بمؤسسة الفاعل حصراً */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageUsers(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = String(body.role ?? '');

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'جميع الحقول مطلوبة.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'البريد الإلكتروني غير صالح.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'كلمة المرور: 8 محارف على الأقل.' }, { status: 400 });
  }
  if (!isAssignableRole(role)) {
    return NextResponse.json({ error: 'الدور غير صالح.' }, { status: 400 });
  }
  // إسناد دور مدير المؤسسة لمدير المؤسسة وحده — لا يكفي امتلاك users.manage عبر دور مخصّص (H1)
  if (role === 'ORG_ADMIN' && !isUnrestrictedAdmin(actor)) {
    return NextResponse.json({ error: 'إسناد دور مدير المؤسسة لمدير المؤسسة فقط.' }, { status: 403 });
  }

  // حدّ الباقة على عدد المستخدمين
  const limit = planUserLimit(actor.organization.plan);
  if (limit !== null) {
    const current = await prisma.user.count({ where: { organizationId: actor.organization.id } });
    if (current >= limit) {
      return NextResponse.json(
        { error: `بلغت الحدّ الأقصى لباقة "${planLabel(actor.organization.plan)}" (${limit} مستخدمين). رقِّ الباقة لإضافة المزيد.` },
        { status: 403 },
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'البريد الإلكتروني مسجّل بالفعل.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      organizationId: actor.organizationId, // عزل: دائمًا مؤسسة الفاعل
    },
    select: { id: true },
  });

  await logAudit(actor.organization.id, actor.name, 'created', 'user', `${name} (${role})`);
  return NextResponse.json({ ok: true, id: user.id });
}
