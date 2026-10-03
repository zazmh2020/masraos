CREATE TABLE "student_registrations" (
  "studentId" TEXT NOT NULL,
  "city" TEXT, "district" TEXT, "address" TEXT, "homeLocationUrl" TEXT,
  "guardianRelation" TEXT, "alternatePhone" TEXT,
  "emergencyName" TEXT, "emergencyRelation" TEXT, "emergencyPhone" TEXT,
  "authorizedPickup" TEXT, "healthNotes" TEXT, "adminNotes" TEXT,
  "memorizationLevel" TEXT, "enrolledAt" DATE,
  "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "photoKey" TEXT, "updatedByName" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_registrations_pkey" PRIMARY KEY ("studentId"),
  CONSTRAINT "student_registrations_studentId_fkey" FOREIGN KEY ("studentId")
    REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
