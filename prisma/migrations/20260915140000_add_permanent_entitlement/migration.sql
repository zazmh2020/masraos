-- برنامج الاستحقاق الدائم — جدولان + enum (إضافي وآمن، لا يمسّ الاشتراك الحالي)
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "permanent_entitlements" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planIdAtEnrollment" "OrgPlan" NOT NULL,
  "requiredDurationYears" INTEGER NOT NULL,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startDate" TIMESTAMP(3) NOT NULL,
  "targetDate" TIMESTAMP(3) NOT NULL,
  "accruedDays" INTEGER NOT NULL DEFAULT 0,
  "lastAccrualAt" TIMESTAMP(3),
  "agreementVersion" TEXT NOT NULL,
  "termsVersion" TEXT NOT NULL,
  "agreementAcceptedAt" TIMESTAMP(3) NOT NULL,
  "agreementAcceptedById" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permanent_entitlements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permanent_entitlements_organizationId_key" ON "permanent_entitlements"("organizationId");
CREATE INDEX "permanent_entitlements_status_idx" ON "permanent_entitlements"("status");

CREATE TABLE "entitlement_events" (
  "id" TEXT NOT NULL,
  "entitlementId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "note" TEXT,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "entitlement_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "entitlement_events_entitlementId_idx" ON "entitlement_events"("entitlementId");

ALTER TABLE "permanent_entitlements" ADD CONSTRAINT "permanent_entitlements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "permanent_entitlements" ADD CONSTRAINT "permanent_entitlements_agreementAcceptedById_fkey" FOREIGN KEY ("agreementAcceptedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlement_events" ADD CONSTRAINT "entitlement_events_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "permanent_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
