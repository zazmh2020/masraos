import { NextResponse } from 'next/server';
import { getVerifiedSession } from '@/lib/session-guard';

export const maxDuration = 60;

/**
 * توليد صورة بالذكاء الاصطناعي (صورة شخصية/شعار).
 * ملاحظة: نماذج Claude (Anthropic) لا تولّد صورًا، لذا نستخدم مزوّد صور مخصّصًا
 * عبر متغيّر البيئة OPENAI_API_KEY (نموذج قابل للضبط بـ OPENAI_IMAGE_MODEL).
 */
export async function POST(request: Request) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'توليد الصور غير مُفعّل. أضِف مفتاح مزوّد صور (OPENAI_API_KEY) في .env — نماذج Claude لا تولّد صورًا.' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const prompt = String(body?.prompt ?? '').trim();
  if (prompt.length < 3) return NextResponse.json({ error: 'اكتب وصفًا للصورة.' }, { status: 400 });
  if (prompt.length > 800) return NextResponse.json({ error: 'الوصف طويل جدًا.' }, { status: 400 });

  const kind = body?.kind === 'logo' ? 'logo' : 'avatar';
  const styled = kind === 'logo'
    ? `${prompt}. A clean, modern logo mark, centered, flat, on a simple background.`
    : `${prompt}. A friendly avatar portrait, centered, simple soft background, high quality.`;

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt: styled,
        n: 1,
        size: '1024x1024',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message ? String(data.error.message) : 'تعذّر توليد الصورة.';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const item = data?.data?.[0];
    const image = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
    if (!image) return NextResponse.json({ error: 'لم تُرجع الخدمة صورة.' }, { status: 502 });
    return NextResponse.json({ ok: true, image });
  } catch {
    return NextResponse.json({ error: 'تعذّر الاتصال بخدمة توليد الصور.' }, { status: 502 });
  }
}
