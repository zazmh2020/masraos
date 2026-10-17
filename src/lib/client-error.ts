/**
 * رسالة خطأ آمنة للعميل: رسائل التحقق من المدخلات (التي نكتبها نحن) تُعرض كما هي،
 * أما أخطاء قاعدة البيانات (Prisma) فقد تحمل أسماء جداول وأعمدة — تُستبدل برسالة عامة.
 */
export function clientErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  if (/^PrismaClient|^Prisma/.test(error.name) || 'clientVersion' in error) return fallback;
  return error.message;
}
