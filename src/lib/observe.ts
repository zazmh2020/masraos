/* ============================================================
   مراقبة الأخطاء — تسجيل مُهيكل يلتقطه المستضيف (Vercel/سجلّات)،
   مع إرسال اختياري إلى Webhook (Slack/Discord/مخصّص) عند ضبط
   ERROR_WEBHOOK_URL. لا يُسجَّل أي سرّ أو بيانات حساسة.
   ============================================================ */

export interface ErrorReport {
  message: string;
  stack?: string;
  where?: string;   // مكان الخطأ (مسار/مكوّن)
  digest?: string;  // مُعرّف خطأ Next
}

/** يسجّل خطأً ويعيد توجيهه للـ webhook إن وُجد (بلا إسقاط للطلب). */
export async function reportError(report: ErrorReport): Promise<void> {
  const payload = {
    at: new Date().toISOString(),
    message: String(report.message).slice(0, 1000),
    where: report.where,
    digest: report.digest,
    stack: report.stack ? String(report.stack).slice(0, 4000) : undefined,
  };

  // يظهر في سجلّات المستضيف (Vercel Logs) — مراقبة أساسية جاهزة
  console.error('[midad:error]', JSON.stringify(payload));

  const hook = process.env.ERROR_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `⚠️ Masra error: ${payload.message}${payload.where ? ` @ ${payload.where}` : ''}` }),
      });
    } catch {
      /* تجاهل — المراقبة ثانوية */
    }
  }
}
