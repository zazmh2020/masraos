import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getOrgActor } from '@/lib/org';
import { canUseAssistant } from '@/lib/permissions';
import { anthropic, isAssistantConfigured, ASSISTANT_MODEL, ASSISTANT_EFFORT } from '@/lib/anthropic';
import { buildAssistantContext } from '@/lib/assistant-context';

export const maxDuration = 60;

/** يجيب عن سؤال ضمن حدود ما يحقّ للمستخدم رؤيته في مؤسسته */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canUseAssistant(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  if (!isAssistantConfigured()) {
    return NextResponse.json(
      { error: 'المساعد الذكي غير مُعدّ. أضِف ANTHROPIC_API_KEY في .env' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const question = String(body?.question ?? '').trim();
  if (question.length < 2) {
    return NextResponse.json({ error: 'اكتب سؤالك.' }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: 'السؤال طويل جداً.' }, { status: 400 });
  }

  // سياق معزول بالمؤسسة ومقيّد بصلاحيات المستخدم
  const context = await buildAssistantContext(actor);

  const system =
    `أنت المساعد الذكي لمنصّة مسرى داخل مؤسسة "${actor.organization.name}".\n` +
    `أجب اعتمادًا على "بيانات المؤسسة" أدناه فقط. هذه البيانات تعكس ما يحقّ لهذا المستخدم الاطّلاع عليه، ` +
    `فلا تفترض وجود بيانات خارجها ولا تخترع أرقامًا أو أسماء.\n` +
    `إن لم تكن الإجابة موجودة في البيانات، قل بوضوح إنك لا تملك هذه المعلومة ضمن صلاحيات المستخدم.\n` +
    `أجب بالعربية، بإيجاز ووضوح.\n\n` +
    `=== بيانات المؤسسة ===\n${context || '(لا توجد بيانات متاحة لهذا المستخدم)'}\n=== نهاية البيانات ===`;

  try {
    const message = await anthropic().messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1500,
      output_config: { effort: ASSISTANT_EFFORT },
      system,
      messages: [{ role: 'user', content: question }],
    });

    if (message.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'تعذّر تقديم إجابة لهذا الطلب.' }, { status: 422 });
    }

    const answer = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return NextResponse.json({ ok: true, answer: answer || 'لا توجد إجابة.' });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'مفتاح المساعد غير صالح.' }, { status: 502 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'الخدمة مزدحمة، حاول بعد قليل.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'تعذّر الاتصال بالمساعد.' }, { status: 502 });
  }
}
