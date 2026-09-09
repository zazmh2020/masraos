import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { matchedRoot } from '@/lib/session';

/**
 * نقطة تحقّق شهادات TLS عند الطلب (Caddy On-Demand TLS).
 * يستدعيها Caddy قبل إصدار شهادة لأي مضيف: GET /api/tls-check?domain=<host>
 * تُعيد 200 للسماح بإصدار الشهادة، و404 للرفض — لمنع إصدار شهادات لنطاقات غير تابعة للمنصّة.
 *
 * يُسمح بـ: نطاق الجذر، وadmin/www، وأي نطاق فرعي يطابق slug مؤسسة موجودة،
 * وأي دومين مخصّص (customDomain) مسجّل لمؤسسة.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RESERVED = new Set(['www', 'admin', 'api', 'app']);
const deny = () => new NextResponse('denied', { status: 404 });
const allow = () => new NextResponse('ok', { status: 200 });

export async function GET(request: Request) {
  const domain = new URL(request.url).searchParams.get('domain')?.trim().toLowerCase();
  if (!domain) return deny();

  const hostname = domain.split(':')[0];
  const root = matchedRoot(hostname);

  // مضيف تحت نطاق جذر معروف (مثل masraos.com)
  if (root) {
    if (hostname === root) return allow(); // الموقع التعريفي على الجذر
    const sub = hostname.slice(0, hostname.length - root.length - 1).split('.')[0];
    if (!sub) return deny();
    if (RESERVED.has(sub)) return allow(); // admin.masraos.com وغيرها

    const org = await prisma.organization.findUnique({ where: { slug: sub }, select: { id: true } });
    return org ? allow() : deny();
  }

  // دومين مخصّص لمؤسسة (خارج نطاق الجذر)
  const org = await prisma.organization.findFirst({ where: { customDomain: hostname }, select: { id: true } });
  return org ? allow() : deny();
}
