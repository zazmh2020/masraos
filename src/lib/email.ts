/**
 * إرسال البريد عبر مزوّد Resend (بلا اعتمادية إضافية — عبر fetch).
 * يعمل فقط عند ضبط RESEND_API_KEY؛ وإلا يعيد reason: 'not_configured'
 * ليعرض الموقع رسالة واضحة بدل الفشل الصامت.
 */
export type SendResult = { ok: boolean; reason?: 'not_configured' | 'send_failed' | 'no_recipient' };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'not_configured' };
  if (!to) return { ok: false, reason: 'no_recipient' };
  const from = process.env.EMAIL_FROM || 'Masra <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: 'send_failed' };
  } catch {
    return { ok: false, reason: 'send_failed' };
  }
}
