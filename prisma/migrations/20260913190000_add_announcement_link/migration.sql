-- إنشاء جدول إعدادات المنصّة إن لم يوجد — كان يُنشأ سابقًا عبر db push، ما يُعطّل النشر النظيف على قاعدة جديدة
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "heroTitle1" TEXT,
    "heroTitle2" TEXT,
    "heroSubtitle" TEXT,
    "announcement" TEXT,
    "announcementActive" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "whatsapp" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- وجهة اختيارية لشريط الإعلان (مسار داخلي أو رابط خارجي) — إضافي وآمن
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "announcementLink" TEXT;
