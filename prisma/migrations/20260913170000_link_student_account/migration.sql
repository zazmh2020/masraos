-- ربط الطالب بحساب دخول (اختياري) — لبوّابة الطالب. إضافي وآمن.
ALTER TABLE "students" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
