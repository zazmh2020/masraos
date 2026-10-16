import { BRAND } from '@/lib/brand';
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
  to, subject, html, text,
}: { to: string; subject: string; html: string; text?: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'not_configured' };
  if (!to) return { ok: false, reason: 'no_recipient' };
  const from = process.env.EMAIL_FROM || `${BRAND.en.name} <onboarding@resend.dev>`;
  if (process.env.NODE_ENV === 'production' && !process.env.EMAIL_FROM?.trim()) return { ok: false, reason: 'not_configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, ...(text ? { text } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, reason: 'send_failed' };
    const result = await res.json().catch(() => null);
    return typeof result?.id === 'string' && result.id.length > 0 ? { ok: true } : { ok: false, reason: 'send_failed' };
  } catch {
    return { ok: false, reason: 'send_failed' };
  }
}
