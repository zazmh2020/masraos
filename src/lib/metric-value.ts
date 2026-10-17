/** قيمة مؤشر نصية بلا أي رقم (بأي نظام أرقام) — تُعرض بحجم عنوان لا بحجم الرقم الكبير. */
export function isTextMetric(value: unknown): boolean {
  return typeof value === 'string' && !/\p{Nd}/u.test(value);
}
