import { NextResponse } from 'next/server';
import { blockedFor, clientIp, hit, throttleKey, tooManyResponse } from '@/lib/auth-throttle';
import { MIN_PASSWORD_LENGTH, resetPassword } from '@/lib/password-reset';

const IP_RULE = { limit: 20, windowSec: 900, blockSec: 900 }; // يحدّ تخمين الرموز من عنوان واحد

/** يستهلك رمز الاستعادة ويضبط كلمة مرور جديدة. لا يُنشئ جلسة: يعود المستخدم لصفحة الدخول. */
export async function POST(request: Request) {
  const ipKey = throttleKey('reset-consume:ip', clientIp(request));
  const wait = await blockedFor([ipKey]);
  if (wait > 0) return tooManyResponse(wait);

  const body = await request.json().catch(() => null);
  const result = await resetPassword(String(body?.token ?? ''), String(body?.password ?? ''));
  if (result.ok) return NextResponse.json({ ok: true });

  if (result.reason === 'weak') {
    return NextResponse.json({ error: `كلمة المرور الجديدة: ${MIN_PASSWORD_LENGTH} محارف على الأقل.` }, { status: 400 });
  }
  await hit(ipKey, IP_RULE);
  return NextResponse.json({ error: 'رابط الاستعادة غير صالح أو منتهي الصلاحية. اطلب رابطًا جديدًا.' }, { status: 400 });
}
