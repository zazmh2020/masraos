-- إضافة فقط: عمود رقم إصدار الجلسات، بقيمة افتراضية 0 لكل المستخدمين الحاليين.
-- لا حذف ولا تعديل لبيانات قائمة. التراجع: ALTER TABLE "users" DROP COLUMN "sessionVersion";
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
