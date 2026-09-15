import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

/* ============================================================
   حسابات masraos.com التجريبية — كلمة المرور الموحّدة: M1234
   الحسابات المرتبطة بمؤسسة تُنشأ داخل مركز قرآن قائم (alquran).
   قابل لإعادة التشغيل (upsert) بأمان.
   ============================================================ */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('M1234', 12);

  const org = await prisma.organization.findUnique({ where: { slug: 'alquran' } });
  if (!org) throw new Error('لم يُعثر على مركز القرآن (slug: alquran).');

  const upsertUser = (email: string, name: string, role: Role, organizationId: string | null) =>
    prisma.user.upsert({
      where: { email },
      update: { name, role, organizationId, passwordHash, isActive: true },
      create: { email, name, role, organizationId, passwordHash, isActive: true },
    });

  const admin = await upsertUser('admin@masraos.com', 'مالك المنصة', Role.PLATFORM_OWNER, null);
  const quran = await upsertUser('quran@masraos.com', 'مدير مركز القرآن', Role.ORG_ADMIN, org.id);
  const employee = await upsertUser('employee@masraos.com', 'موظف', Role.STAFF, org.id);
  const member = await upsertUser('user@masraos.com', 'مستخدم عادي', Role.MEMBER, org.id);
  const student = await upsertUser('student@masraos.com', 'طالب تجريبي', Role.STUDENT, org.id);
  const parent = await upsertUser('parent@masraos.com', 'ولي أمر تجريبي', Role.MEMBER, org.id);

  // سجلّ طالب مرتبط بحساب الطالب
  let studentRec = await prisma.student.findFirst({ where: { userId: student.id } });
  if (!studentRec) {
    studentRec = await prisma.student.create({
      data: { name: 'طالب تجريبي', organizationId: org.id, userId: student.id },
    });
  }

  // وليّ أمر مرتبط بحساب ولي الأمر + بالطالب
  let guardian = await prisma.guardian.findFirst({ where: { userId: parent.id } });
  if (!guardian) {
    guardian = await prisma.guardian.create({
      data: { fullName: 'ولي أمر تجريبي', organizationId: org.id, userId: parent.id, email: parent.email, students: { connect: { id: studentRec.id } } },
    });
  } else {
    await prisma.guardian.update({ where: { id: guardian.id }, data: { students: { connect: { id: studentRec.id } } } });
  }

  console.log('✓ الحسابات (كلمة المرور: M1234):');
  for (const u of [admin, quran, employee, member, student, parent]) {
    console.log(`  ${u.role.padEnd(14)} ${u.email}  ${u.organizationId ? `→ ${org.slug}` : ''}`);
  }
  console.log(`  طالب#${studentRec.id.slice(-6)} · وليّ أمر#${guardian.id.slice(-6)} مرتبطان.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
