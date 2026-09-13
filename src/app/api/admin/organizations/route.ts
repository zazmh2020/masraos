import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { isOrgModule } from '@/lib/modules';

const RESERVED_SLUGS = ['www', 'admin', 'api', 'app', 'midad', 'mail', 'ftp'];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const slug = String(body.slug ?? '').trim().toLowerCase();
  const type = String(body.type ?? '');
  const adminName = String(body.adminName ?? '').trim();
  const adminEmail = String(body.adminEmail ?? '').trim().toLowerCase();
  const adminPassword = String(body.adminPassword ?? '');

  if (!name || !slug || !adminName || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'جميع الحقول مطلوبة.' }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'الرابط الفرعي: حروف إنجليزية صغيرة وأرقام وشرطات فقط.' },
      { status: 400 },
    );
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return NextResponse.json({ error: 'هذا الرابط الفرعي محجوز.' }, { status: 400 });
  }

  if (adminPassword.length < 8) {
    return NextResponse.json({ error: 'كلمة المرور: 8 محارف على الأقل.' }, { status: 400 });
  }

  if (!['ASSOCIATION', 'MOSQUE', 'SCHOOL', 'PROJECT'].includes(type)) {
    return NextResponse.json({ error: 'نوع المؤسسة غير صالح.' }, { status: 400 });
  }

  // الأنظمة المُهيَّأة عند الإنشاء (اختياري) — نقبل مفاتيح معروفة فقط
  const disabledModules = Array.isArray(body.disabledModules)
    ? [...new Set((body.disabledModules as unknown[]).map((x) => String(x)))].filter(isOrgModule)
    : [];

  // تحقق من عدم التكرار
  const [existingOrg, existingUser] = await Promise.all([
    prisma.organization.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email: adminEmail } }),
  ]);

  if (existingOrg) {
    return NextResponse.json({ error: 'الرابط الفرعي مستخدم بالفعل.' }, { status: 409 });
  }

  if (existingUser) {
    return NextResponse.json({ error: 'البريد الإلكتروني مسجّل بالفعل.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // إنشاء المؤسسة والمدير في نفس المعاملة
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      type: type as 'ASSOCIATION' | 'MOSQUE' | 'SCHOOL' | 'PROJECT',
      disabledModules,
      users: {
        create: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: 'ORG_ADMIN',
        },
      },
    },
  });

  return NextResponse.json({ ok: true, slug: org.slug });
}
