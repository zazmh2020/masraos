import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canCustomize } from '@/lib/permissions';
import { imageValue } from '@/lib/branding';
import { parseUiThemeInput } from '@/lib/ui-theme';
import type { Prisma } from '@/generated/prisma/client';

/** تخصيص الهوية البصرية للجهة — من يملك صلاحية التخصيص. */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canCustomize(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const data: Prisma.OrganizationUpdateInput = {};

  if (body.brandColor !== undefined) {
    const c = String(body.brandColor ?? '').trim();
    if (c === '') data.brandColor = null;
    else if (/^#?[0-9a-fA-F]{6}$/.test(c)) data.brandColor = c.startsWith('#') ? c : `#${c}`;
    else return NextResponse.json({ error: 'لون غير صالح (استخدم صيغة #RRGGBB).' }, { status: 400 });
  }
  if (body.logoUrl !== undefined) {
    try { data.logoUrl = imageValue(body.logoUrl, 'الشعار'); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'شعار غير صالح.' }, { status: 400 }); }
  }

  if (body.uiTheme !== undefined) {
    const theme = parseUiThemeInput(body.uiTheme);
    if (!theme) return NextResponse.json({ error: 'نمط الواجهة غير صالح.' }, { status: 400 });
    data.uiTheme = theme;
  }

  await prisma.organization.update({ where: { id: actor.organizationId! }, data });
  return NextResponse.json({ ok: true });
}
