import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const url = new URL(process.env.DATABASE_URL ?? '');
if (url.hostname !== '127.0.0.1' || url.port !== '5433' || url.pathname !== '/masra_local_dev') {
  throw new Error('Synthetic data can only be created in the dedicated local development database.');
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const password = 'MasraLocal2026!';
async function main() {
  const hash = await bcrypt.hash(password, 12);
  const org = await db.organization.upsert({ where: { slug: 'masra-demo' }, update: {},
    create: { id: 'local-org-demo', name: 'مركز مَسرى التجريبي — بيانات وهمية', slug: 'masra-demo', type: 'MOSQUE', plan: 'PROFESSIONAL' } });
  const other = await db.organization.upsert({ where: { slug: 'masra-check' }, update: {},
    create: { id: 'local-org-check', name: 'مركز اختبار العزل — بيانات وهمية', slug: 'masra-check', type: 'MOSQUE' } });
  const users = [
    { id: 'local-owner', name: 'مالك المنصة التجريبي', email: 'owner@masra.local', role: 'PLATFORM_OWNER', organizationId: null },
    { id: 'local-admin', name: 'مدير المركز التجريبي', email: 'admin@masra.local', role: 'ORG_ADMIN', organizationId: org.id },
    { id: 'local-teacher', name: 'معلم تجريبي', email: 'teacher@masra.local', role: 'TEACHER', organizationId: org.id },
    { id: 'local-supervisor', name: 'مشرف تجريبي', email: 'supervisor@masra.local', role: 'SUPERVISOR', organizationId: org.id },
    { id: 'local-student-user', name: 'طالب تجريبي 01', email: 'student@masra.local', role: 'STUDENT', organizationId: org.id },
    { id: 'local-guardian-user', name: 'ولي أمر تجريبي', email: 'guardian@masra.local', role: 'MEMBER', organizationId: org.id },
    { id: 'local-other-admin', name: 'مدير مركز الاختبار', email: 'other-admin@masra.local', role: 'ORG_ADMIN', organizationId: other.id },
  ] as const;
  for (const u of users) await db.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash: hash } });
  const teacher = await db.teacher.upsert({ where: { id: 'local-teacher-record' }, update: {}, create: { id: 'local-teacher-record', name: 'معلم تجريبي', organizationId: org.id, userId: 'local-teacher' } });
  for (const [id, name] of [['local-halaqa-1', 'حلقة الفاتحة التجريبية'], ['local-halaqa-2', 'حلقة الإخلاص التجريبية']]) {
    await db.halaqa.upsert({ where: { id }, update: {}, create: { id, name, organizationId: org.id, teacherId: teacher.id, schedule: 'جدول تجريبي للمراجعة فقط' } });
  }
  await db.guardian.upsert({ where: { id: 'local-guardian' }, update: {}, create: { id: 'local-guardian', fullName: 'ولي أمر تجريبي', organizationId: org.id, userId: 'local-guardian-user' } });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
  const day = new Date(`${today}T00:00:00Z`);
  for (let i = 1; i <= 15; i++) {
    const id = `local-student-${String(i).padStart(2, '0')}`;
    const halaqaId = i <= 8 ? 'local-halaqa-1' : 'local-halaqa-2';
    await db.student.upsert({ where: { id }, update: {}, create: { id, name: `طالب تجريبي ${String(i).padStart(2, '0')}`, serial: i, section: 'BOYS', organizationId: org.id, halaqaId,
      guardianName: 'ولي أمر تجريبي', guardianEmail: 'example@example.test', birthDate: new Date('2014-05-15T00:00:00Z'),
      createdAt: new Date(day.getTime() - 30 * 86400000), ...(i === 1 ? { userId: 'local-student-user', guardianId: 'local-guardian' } : {}) } });
    if (i <= 12) {
      for (let d = 0; d < 5; d++) {
        const date = new Date(day.getTime() - d * 86400000);
        const status = i === 10 ? 'ABSENT' : i === 11 ? 'LATE' : i === 12 ? 'EXCUSED' : 'PRESENT';
        await db.attendanceRecord.upsert({ where: { halaqaId_studentId_date: { halaqaId, studentId: id, date } }, update: {},
          create: { studentId: id, organizationId: org.id, halaqaId, date, status } });
        await db.quranDailyRecord.upsert({ where: { studentId_date: { studentId: id, date } }, update: {},
          create: { studentId: id, organizationId: org.id, halaqaId, date, attendance: status, newFrom: 582, newTo: 583, pages: status === 'PRESENT' ? 2 : 0, notes: 'سجل وهمي للمراجعة والتطوير' } });
      }
    }
  }
  await db.studentRegistration.upsert({ where: { studentId: 'local-student-01' }, update: {}, create: {
    studentId: 'local-student-01', city: 'مدينة تجريبية', district: 'حي تجريبي', address: 'عنوان وهمي لا يمثل منزلًا حقيقيًا',
    emergencyName: 'جهة اتصال تجريبية', emergencyRelation: 'ولي الأمر', healthNotes: 'بيانات اختبار فقط',
    memorizationLevel: 'جزء عم — تجريبي', consentConfirmed: true, updatedByName: 'تهيئة محلية تجريبية', enrolledAt: day,
  } });
  console.log('Local synthetic dataset ready: 15 students, 2 circles, 7 review accounts. No cloud records were imported.');
}
main().finally(() => db.$disconnect());
