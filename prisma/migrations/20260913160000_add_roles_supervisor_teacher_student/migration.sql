-- إضافة أدوار جديدة إلى enum "Role" — إضافي وآمن (لا يمسّ بيانات قائمة)
-- الأدوار: مشرف (SUPERVISOR)، معلم (TEACHER)، طالب (STUDENT)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERVISOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEACHER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STUDENT';
