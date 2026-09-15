import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { planEntitlementYears } from '@/lib/plans';
import {
  deriveEnrollmentTerms,
  ENTITLEMENT_AGREEMENT_VERSION,
  ENTITLEMENT_TERMS_VERSION,
} from '@/lib/entitlement';

/**
 * الانضمام إلى برنامج الاستحقاق الدائم — لمدير المؤسسة حصراً.
 * كل الشروط (المدّة/التواريخ) تُشتقّ خادميًّا من باقة المؤسسة؛ لا تُقبل من العميل.
 */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const org = actor.organization;

  // الباقة مؤهّلة؟
  const years = planEntitlementYears(org.plan);
  if (years == null) {
    return NextResponse.json({ error: 'باقتك الحالية غير مؤهّلة لبرنامج الاستحقاق الدائم.' }, { status: 400 });
  }

  // منضمّ مسبقًا؟
  const existing = await prisma.permanentEntitlement.findUnique({ where: { organizationId: org.id }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'مؤسستك منضمّة إلى البرنامج بالفعل.' }, { status: 409 });
  }

  // الموافقة على الاتفاقية والشروط (بالإصدار الحالي فقط)
  const body = await request.json().catch(() => null);
  if (body?.agreed !== true) {
    return NextResponse.json({ error: 'يجب الإقرار بقراءة الاتفاقية والموافقة عليها.' }, { status: 400 });
  }
  if (body?.agreementVersion !== ENTITLEMENT_AGREEMENT_VERSION || body?.termsVersion !== ENTITLEMENT_TERMS_VERSION) {
    return NextResponse.json({ error: 'تغيّرت الاتفاقية — أعد تحميل الصفحة وراجعها من جديد.' }, { status: 409 });
  }

  const terms = deriveEnrollmentTerms(org.plan);
  if (!terms) {
    return NextResponse.json({ error: 'تعذّر احتساب شروط الاستحقاق.' }, { status: 400 });
  }

  const now = new Date();
  const entitlement = await prisma.permanentEntitlement.create({
    data: {
      organizationId: org.id,
      planIdAtEnrollment: org.plan,
      requiredDurationYears: terms.requiredDurationYears,
      status: 'ACTIVE',
      enrollmentDate: now,
      startDate: terms.startDate,
      targetDate: terms.targetDate,
      accruedDays: 0,
      agreementVersion: ENTITLEMENT_AGREEMENT_VERSION,
      termsVersion: ENTITLEMENT_TERMS_VERSION,
      agreementAcceptedAt: now,
      agreementAcceptedById: actor.id,
      events: {
        create: { type: 'ENROLLED', actorUserId: actor.id, note: `الباقة ${org.plan} · ${terms.requiredDurationYears} سنوات` },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: entitlement.id });
}
