import { NextResponse } from 'next/server';
import { reportError } from '@/lib/observe';
import { clientIp, hit, throttleKey } from '@/lib/auth-throttle';

const MAX_BODY = 16 * 1024; // بلاغ خطأ لا يحتاج أكثر من هذا
const RULE = { limit: 30, windowSec: 600, blockSec: 600 }; // يمنع إغراق السجلات وروابط التنبيه

/** يستقبل بلاغ خطأ من حدود الأخطاء في المتصفّح ويسجّله على الخادم. */
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }
  const { count } = await hit(throttleKey('observe:ip', clientIp(request)), RULE);
  if (count > RULE.limit) return NextResponse.json({ ok: false }, { status: 429 });

  const raw = await request.text().catch(() => '');
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false }, { status: 413 });
  let body: Record<string, unknown> | null = null;
  try { body = JSON.parse(raw); } catch { body = null; }
  if (!body || typeof body.message !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const short = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : undefined);
  await reportError({
    message: body.message.slice(0, 1000),
    stack: short(body.stack, 4000),
    where: short(body.where, 120) ?? 'client',
    digest: short(body.digest, 120),
  });
  return NextResponse.json({ ok: true });
}
