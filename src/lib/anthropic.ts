import Anthropic from '@anthropic-ai/sdk';

/* ============================================================
   عميل Claude للمساعد الذكي
   يُقرأ المفتاح من ANTHROPIC_API_KEY، والنموذج من ANTHROPIC_MODEL
   (افتراضيًا claude-opus-5).
   ============================================================ */

export function isAssistantConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const ASSISTANT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

/** مستوى دقّة الاستدلال: low أسرع/أرخص، medium متوازن (افتراضي)، high أدقّ. */
const ALLOWED_EFFORT = ['low', 'medium', 'high'] as const;
type Effort = (typeof ALLOWED_EFFORT)[number];
export const ASSISTANT_EFFORT: Effort =
  (ALLOWED_EFFORT as readonly string[]).includes(process.env.ANTHROPIC_EFFORT ?? '')
    ? (process.env.ANTHROPIC_EFFORT as Effort)
    : 'medium';

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!isAssistantConfigured()) {
    throw new Error('المساعد الذكي غير مُعدّ. أضِف ANTHROPIC_API_KEY في .env');
  }
  if (client) return client;
  client = new Anthropic(); // يقرأ المفتاح من البيئة
  return client;
}
