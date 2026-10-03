-- طلبات إنشاء الحساب قيد التحقق (إضافي وآمن — جدول ونوع جديدان فقط)
CREATE TYPE "VerifyChannel" AS ENUM ('EMAIL', 'PHONE');

CREATE TABLE "signup_requests" (
    "id" TEXT NOT NULL,
    "channel" "VerifyChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "orgName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sendCount" INTEGER NOT NULL DEFAULT 1,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signup_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "signup_requests_email_idx" ON "signup_requests"("email");
CREATE INDEX "signup_requests_createdAt_idx" ON "signup_requests"("createdAt");
