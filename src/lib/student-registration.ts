export type RegistrationActor = { role: string; permissions?: string[] | null };

// The sensitive registration is deliberately not covered by general education access.
export function canManageRegistration(actor: RegistrationActor): boolean {
  return actor.role === 'ORG_ADMIN' &&
    (actor.permissions == null || actor.permissions.includes('education.manage'));
}

export const registrationFields = [
  ['city', 'المدينة', 100], ['district', 'الحي', 100], ['address', 'وصف العنوان', 500],
  ['homeLocationUrl', 'رابط موقع المنزل (اختياري)', 1000],
  ['guardianRelation', 'صلة قرابة ولي الأمر', 100], ['alternatePhone', 'رقم اتصال بديل', 40],
  ['emergencyName', 'اسم جهة اتصال الطوارئ', 150], ['emergencyRelation', 'صلة القرابة', 100],
  ['emergencyPhone', 'هاتف الطوارئ', 40], ['authorizedPickup', 'المصرح لهم باستلام الطالب', 500],
  ['healthNotes', 'معلومات صحية لازمة للرعاية فقط', 1000], ['adminNotes', 'ملاحظات الإدارة', 1000],
  ['memorizationLevel', 'مستوى الحفظ والمراجعة', 300],
] as const;
export type RegistrationField = typeof registrationFields[number][0];

export function parseDateOnly(value: unknown): Date | null {
  if (value === '' || value == null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('التاريخ غير صالح.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('التاريخ غير صالح.');
  return date;
}

export function validateRegistration(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('بيانات غير صالحة.');
  const body = input as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const value = body[key];
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || value.trim().length > max) throw new Error(`قيمة الحقل ${key} غير صالحة أو طويلة جدًا.`);
    return value.trim() || null;
  };
  const fields = Object.fromEntries(registrationFields.map(([key, , max]) => [key, text(key, max)])) as Record<RegistrationField, string | null>;
  if (fields.homeLocationUrl) {
    let url: URL;
    try { url = new URL(fields.homeLocationUrl); } catch { throw new Error('رابط موقع المنزل غير صالح.'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('استخدم رابط موقع يبدأ بـ https دون بيانات دخول.');
  }
  const consentConfirmed = body.consentConfirmed === true;
  if (!consentConfirmed && (fields.address || fields.homeLocationUrl || fields.healthNotes)) {
    throw new Error('أكد إبلاغ ولي الأمر بالغرض والحصول على موافقته قبل حفظ العنوان أو المعلومات الصحية.');
  }
  const name = text('name', 150);
  if (!name || name.length < 2) throw new Error('أدخل اسم الطالب كاملًا.');
  const birthDate = parseDateOnly(body.birthDate);
  if (birthDate && birthDate > new Date()) throw new Error('تاريخ الميلاد لا يمكن أن يكون في المستقبل.');
  const guardianEmail = text('guardianEmail', 254);
  if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) throw new Error('البريد الإلكتروني غير صالح.');
  return {
    student: { name, phone: text('phone', 40), guardianName: text('guardianName', 150),
      guardianPhone: text('guardianPhone', 40), guardianEmail, birthDate },
    registration: { ...fields, enrolledAt: parseDateOnly(body.enrolledAt), consentConfirmed },
  };
}
