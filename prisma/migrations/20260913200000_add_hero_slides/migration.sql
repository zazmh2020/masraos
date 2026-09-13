-- نظام إدارة محتوى Hero — شرائح تديرها لوحة مالك المنصّة (إضافي وآمن)
CREATE TYPE "HeroStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

CREATE TABLE "hero_slides" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imageUrl" TEXT,
  "ctaText" TEXT,
  "ctaLink" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "status" "HeroStatus" NOT NULL DEFAULT 'DRAFT',
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hero_slides_status_order_idx" ON "hero_slides"("status", "order");
