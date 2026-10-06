-- إضافة فقط: النمط العام لواجهة الجهة (JSON اختياري، فارغ لكل الجهات الحالية).
-- لا حذف ولا تعديل لبيانات قائمة. التراجع: ALTER TABLE "organizations" DROP COLUMN "uiTheme";
ALTER TABLE "organizations" ADD COLUMN "uiTheme" JSONB;
