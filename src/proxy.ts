import { NextRequest, NextResponse } from 'next/server';

/**
 * يوجّه الطلبات بحسب الدومين الفرعي ضمن دومينات مسرى الجذر فقط:
 *
 *   masraos.com / midad.localhost          →  الموقع التعريفي
 *   admin.masraos.com                      →  لوحة مالك المنصة (/admin/*)
 *   alqoran.masraos.com                    →  مساحة المؤسسة (/org/*)
 *
 * أي دومين آخر → الموقع التعريفي مباشرةً، حتى لا يُفسَّر مضيف غير معروف
 * على أنه مؤسسة (كان يسبّب 404).
 */

// دومينات الجذر التي يُفعَّل عليها التوجيه بالدومين الفرعي.
// يمكن تجاوزها بمتغيّر البيئة APP_ROOT_DOMAINS (مفصولة بفواصل).
const ROOT_DOMAINS = (process.env.APP_ROOT_DOMAINS ?? 'midad.localhost,masraos.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** يعيد المقطع الفرعي (subdomain) إن كان المضيف تحت أحد دومينات الجذر، وإلا null. */
function extractSubdomain(hostname: string): string | null {
  for (const root of ROOT_DOMAINS) {
    if (hostname === root) return null; // الجذر نفسه → لا دومين فرعي
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, hostname.length - root.length - 1);
      return sub.split('.')[0] || null; // أول مقطع فقط
    }
  }
  return null; // ليس تحت أي دومين جذر معروف (vercel.app، localhost، إلخ)
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // العرض التجريبي: للاستعراض فقط — نمنع أي تعديل عبر الـ API (باستثناء مسارات الدخول/الخروج).
  // الوسم كوكي غير موقّع؛ وجوده يقيّد فقط، فلا حاجة للتحقّق التوقيعي هنا.
  if (path.startsWith('/api')) {
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const isDemo = request.cookies.get('midad_demo')?.value === '1';
    if (isDemo && mutating && !path.startsWith('/api/auth/')) {
      return NextResponse.json(
        { ok: false, error: 'وضع العرض التجريبي — للاستعراض فقط، لا يمكن حفظ التغييرات.', code: 'DEMO_READONLY' },
        { status: 403 },
      );
    }
  }

  // مسارات لا يمسّها التوجيه
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/fonts') ||
    path.startsWith('/site') || // الموقع العام للمؤسسات — بلا مصادقة
    path === '/privacy' ||      // صفحات قانونية عامة
    path === '/terms' ||
    path === '/login' ||
    path.startsWith('/verify') || // التحقّق العام من البطاقات الرقمية
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(hostname);

  // لا دومين فرعي ضمن مسرى → الموقع التعريفي (يشمل *.vercel.app والدومين الرئيسي)
  if (!subdomain || ['www', 'api', 'app'].includes(subdomain)) {
    return NextResponse.next();
  }

  // لوحة مالك المنصة
  if (subdomain === 'admin') {
    if (!path.startsWith('/admin')) {
      url.pathname = `/admin${path === '/' ? '' : path}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // دومين فرعي لمؤسسة → /org/[slug]
  if (!path.startsWith('/org/')) {
    url.pathname = `/org/${subdomain}${path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|hero.webp|hero.jpg).*)'],
};
