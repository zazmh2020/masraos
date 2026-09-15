-- مدة تدوير صفحات لوحة الترتيب (ثوانٍ) — إضافي وآمن
ALTER TABLE "organizations" ADD COLUMN "pointsBoardRotateSec" INTEGER NOT NULL DEFAULT 15;
