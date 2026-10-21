/* ============================================================
   الحقول الحساسة (NP1 · MAS-339/430): تُحجب على الخادم قبل أي إرسال للعميل أو التصدير.
   الإخفاء بإزالة القيمة (null/«متبرع») — لا قيمة مقنّعة جزئيًا تُسرّب أجزاءً منها.
   ============================================================ */

export const DONOR_MASK = 'متبرع';

type StudentContacts = { phone?: string | null; guardianPhone?: string | null; guardianEmail?: string | null };

/** يحجب هاتف الطالب وهاتف/بريد وليّ الأمر ما لم يُسمح. */
export function withStudentContacts<T extends StudentContacts>(s: T, allowed: boolean): T {
  if (allowed) return s;
  const out = { ...s };
  if ('phone' in out) out.phone = null;
  if ('guardianPhone' in out) out.guardianPhone = null;
  if ('guardianEmail' in out) out.guardianEmail = null;
  return out;
}

/** يحجب الرقم الوطني للمستفيد ما لم يُسمح. */
export function withBeneficiaryId<T extends { nationalId?: string | null }>(b: T, allowed: boolean): T {
  return allowed || !('nationalId' in b) ? b : { ...b, nationalId: null };
}

/** يحجب اسم المتبرع ما لم يُسمح. */
export function withDonor<T extends { donorName?: string }>(d: T, allowed: boolean): T {
  return allowed || !('donorName' in d) ? d : { ...d, donorName: DONOR_MASK };
}
