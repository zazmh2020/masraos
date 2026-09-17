-- محتوى الصفحة الرئيسية القابل للتحرير من لوحة مالك المنصّة (إضافي وآمن)
-- المميزات والأسئلة الشائعة كمصفوفات JSON؛ فارغة = استخدام النصوص الافتراضية
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "homeFeatures" JSONB;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "homeFaqs" JSONB;
