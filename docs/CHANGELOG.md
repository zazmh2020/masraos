# CHANGELOG

## 2026-09-13 — مسابقة الباركود (وحدة داخل مسرى)

### Added
- **دفتر نقاط (Ledger):** نموذج `PointsTransaction` (EARN/DEDUCT/ADJUST، `source`، `balanceAfter`،
  `idempotencyKey` فريد) + `Organization.pointsPerScan`.
- **منطق النقاط** (`src/lib/points.ts`): `applyPoints` ذرّي (عزل + idempotency + منع رصيد سالب)
  و`getPointsBalance`؛ دالة `pointsDelta` النقيّة مُختبَرة.
- **API:** `POST /api/org/points/scan` (منح/خصم، محمي من التكرار، مُدقَّق، أكواد أخطاء ثابتة)،
  `GET /api/org/points` (استعلام طالب → رصيد+سجل، أو أحدث الحركات)، `POST /api/org/points/adjust`.
- **الواجهة:** `/points` وحدة المسح (إدخال يركّز لقارئ USB، منح/خصم، نتيجة حيّة + أحدث العمليات)،
  `/points/display` شاشة عرض كبيرة، `/points/cards` بطاقات طباعة، `/points/report` تقرير الحركات.
- **باركود Code39** (`src/lib/barcode.ts`) بلا مكتبة/خط — مُختبَر.
- **الصلاحيات:** قدرات `points.view/scan/adjust` + منحها للأدوار + دوال مساعدة.

### Database
- هجرة `20260913180000_add_points_transactions` (إضافية آمنة) طُبّقت على Neon.

### Security / Integrity
- عزل المستأجرين: كل استعلام/كتابة مقيّد بـ`organizationId`؛ الطالب يُتحقّق ضمن مؤسسة الفاعل.
- الصلاحيات مفروضة خادميًّا (`points.scan` للمسح، `points.adjust` للتعديل اليدوي).
- منع التكرار/Replay عبر `idempotencyKey` فريد + معاملة ذرّية (`$transaction`).
- الرصيد لا ينزل تحت الصفر؛ التعديل اليدوي حركة `ADJUST` بسبب ومستخدم (لا تُعدَّل الحركات التاريخية).
- تسجيل العمليات في `AuditLog` (مسح/خصم/تعديل).

### Verified
- `tsc` نظيف · `build` ناجح · 45 اختبار وحدة · **اختبار قبول حيّ:** مسح الرقم 1 → +10 → الرصيد 10 →
  ظهر في السجل والتقرير؛ رقم غير موجود → خطأ واضح.

### Follow-ups (غير مطلوبة الآن)
- واجهة لضبط `pointsPerScan` من إعدادات المؤسسة (الحقل موجود، الافتراضي 10).
- شاشة العرض بملء الشاشة خارج غلاف لوحة المؤسسة (حاليًا ضمن الغلاف؛ F11 يكفي).
