import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { anthropic, isAssistantConfigured, ASSISTANT_MODEL, ASSISTANT_EFFORT } from '@/lib/anthropic';

export const maxDuration = 60;

/** يبني سياقًا موجزًا على مستوى المنصّة لمالكها. */
async function buildOwnerContext(): Promise<string> {
  const [orgs, usersTotal, activeUsers] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        name: true, type: true, slug: true, isActive: true, createdAt: true,
        _count: { select: { users: true } },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const typeLabel: Record<string, string> = {
    MOSQUE: 'مركز قرآني', ASSOCIATION: 'جمعية', SCHOOL: 'مركز تعليمي', PROJECT: 'مشروع خاص',
  };
  const lines = orgs.map((o, i) =>
    `${i + 1}. ${o.name} — النوع: ${typeLabel[o.type] ?? o.type}، الرابط: ${o.slug}، ` +
    `الأعضاء: ${o._count.users}، الحالة: ${o.isActive ? 'نشطة' : 'موقوفة'}، ` +
    `أُنشئت: ${o.createdAt.toISOString().slice(0, 10)}`,
  );

  return (
    `إجمالي المؤسسات: ${orgs.length}\n` +
    `المؤسسات النشطة: ${orgs.filter((o) => o.isActive).length}\n` +
    `إجمالي المستخدمين على المنصّة: ${usersTotal} (النشطون: ${activeUsers})\n\n` +
    `قائمة المؤسسات:\n${lines.join('\n') || '(لا توجد مؤسسات بعد)'}`
  );
}

/** مساعد ذكي لمالك المنصّة — يجيب من بيانات المنصّة العامّة. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PLATFORM_OWNER') {
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
  if (question.length < 2) return NextResponse.json({ error: 'اكتب سؤالك.' }, { status: 400 });
  if (question.length > 2000) return NextResponse.json({ error: 'السؤال طويل جداً.' }, { status: 400 });

  const context = await buildOwnerContext();

  const system =
    `أنت المساعد الذكي لمالك منصّة مسرى.\n` +
    `أجب اعتمادًا على "بيانات المنصّة" أدناه فقط، ولا تخترع أرقامًا أو أسماء.\n` +
    `إن لم تكن الإجابة موجودة في البيانات، قل بوضوح إنك لا تملك هذه المعلومة.\n` +
    `أجب بالعربية، بإيجاز ووضوح.\n\n` +
    `=== بيانات المنصّة ===\n${context}\n=== نهاية البيانات ===`;

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
