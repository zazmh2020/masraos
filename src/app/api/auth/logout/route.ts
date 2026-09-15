import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, sessionCookieDomain, DEMO_COOKIE } from '@/lib/session';

export async function POST(request: Request) {
  const domain = sessionCookieDomain(request.headers.get('host'));
  await destroySession(domain);
  // إزالة وسم العرض التجريبي إن وُجد
  (await cookies()).set(DEMO_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0, ...(domain ? { domain } : {}) });
  return NextResponse.json({ ok: true });
}
