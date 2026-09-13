-- مسابقة الباركود: إعداد نقاط المسح + دفتر حركات النقاط (إضافي وآمن)
ALTER TABLE "organizations" ADD COLUMN "pointsPerScan" INTEGER NOT NULL DEFAULT 10;

CREATE TYPE "PointsKind" AS ENUM ('EARN', 'DEDUCT', 'ADJUST');
CREATE TYPE "PointsSource" AS ENUM ('SCAN', 'MANUAL', 'REDEEM');

CREATE TABLE "points_transactions" (
  "id" TEXT NOT NULL,
  "kind" "PointsKind" NOT NULL,
  "source" "PointsSource" NOT NULL DEFAULT 'SCAN',
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "reason" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdById" TEXT,
  CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "points_transactions_idempotencyKey_key" ON "points_transactions"("idempotencyKey");
CREATE INDEX "points_transactions_organizationId_idx" ON "points_transactions"("organizationId");
CREATE INDEX "points_transactions_studentId_idx" ON "points_transactions"("studentId");
CREATE INDEX "points_transactions_organizationId_createdAt_idx" ON "points_transactions"("organizationId", "createdAt");

ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
