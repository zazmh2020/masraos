import { NextResponse } from 'next/server';
import { clientIp, hit, throttleKey, tooManyResponse } from '@/lib/auth-throttle';

const RULE = { limit: 5, windowSec: 3600, blockSec: 3600 }; // 5 طلبات من العنوان في الساعة — يمنع إغراق قناة الاستلام

/* ============================================================
   طلب استشارة مجانية (من مساعد اختيار الباقة) — عام، بلا تسجيل.
   لا يُنشئ جدولًا ولا migration. التسليم أفضل جهد:
   • إن ضُبط CONSULT_WEBHOOK_URL (Slack/Zapier/Make…) نُرسل الطلب إليه.
   • وإلا نعيد عدم توفر الخدمة دون تسجيل بيانات الاتصال الشخصية.
   لاحقًا يمكن اعتماد جدول ConsultationRequest لالتقاط دائم.
   ============================================================ */

export const dynamic = 'force-dynamic';

interface Lead {
  name?: unknown; center?: unknown; phone?: unknown;
  email?: unknown; note?: unknown; recommendedPlan?: unknown;
}

function clean(v: unknown, max = 300): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  const { count } = await hit(throttleKey('consult:ip', clientIp(request)), RULE);
  if (count > RULE.limit) return tooManyResponse(3600, 'تم استلام طلبات كثيرة من هذا الجهاز. حاول لاحقًا.');

  const body = (await request.json().catch(() => null)) as Lead | null;
  if (!body) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const lead = {
    name: clean(body.name, 120),
    center: clean(body.center, 160),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    note: clean(body.note, 1000),
    recommendedPlan: clean(body.recommendedPlan, 40),
    at: new Date().toISOString(),
  };

  // الحقول الإلزامية الدنيا (تقليل الاحتكاك: الاسم/المركز/الهاتف فقط)
  if (!lead.name || !lead.center || !lead.phone) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const hook = process.env.CONSULT_WEBHOOK_URL;
  if (hook) {
    try {
      const response = await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `📞 طلب استشارة جديد — ${lead.center} (${lead.phone})`, lead }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return NextResponse.json({ error: 'تعذّر تسليم الطلب. حاول لاحقًا.' }, { status: 502 });
    } catch {
      return NextResponse.json({ error: 'تعذّر تسليم الطلب. حاول لاحقًا.' }, { status: 502 });
    }
  } else {
    return NextResponse.json({ error: 'خدمة الاستشارة غير مفعّلة حاليًا.' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
