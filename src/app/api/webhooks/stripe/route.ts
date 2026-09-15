import type Stripe from 'stripe';
import type { OrgPlan, EntitlementStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getStripe, planForPriceId } from '@/lib/stripe';

// يجب قراءة الجسم الخام للتحقق من التوقيع
export const dynamic = 'force-dynamic';

/** يزامن حالة اشتراك Stripe مع المؤسسة. */
async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const org = await prisma.organization.findFirst({ where: { stripeCustomerId: customerId }, select: { id: true } });
  if (!org) return;

  const priceId = sub.items.data[0]?.price?.id ?? '';
  const plan: OrgPlan | null = planForPriceId(priceId);
  const active = sub.status === 'active' || sub.status === 'trialing';
  const periodEnd = sub.items.data[0]?.current_period_end;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      // نُطبّق الباقة فقط عند نشاط الاشتراك؛ عند الإلغاء نعود للمجانية
      ...(active && plan ? { plan } : {}),
      ...(sub.status === 'canceled' ? { plan: 'STARTER' as OrgPlan } : {}),
      ...(periodEnd ? { planRenewsAt: new Date(periodEnd * 1000) } : {}),
    },
  });

  await accrueEntitlement(org.id, active);
}

/**
 * تراكم الوقت المدفوع لبرنامج الاستحقاق الدائم — خادميّ فقط.
 * يُضيف الوقت المنقضي منذ آخر تراكم فقط إن كان الاشتراك نشطًا ومتّصلًا (بلا فجوة).
 * عند الانقطاع تُوقَف الحالة (PAUSED) ولا يُحتسب زمن الفجوة عند العودة.
 */
async function accrueEntitlement(organizationId: string, active: boolean) {
  const ent = await prisma.permanentEntitlement.findUnique({ where: { organizationId } });
  if (!ent || ent.status === 'COMPLETED' || ent.status === 'CANCELLED' || ent.status === 'EXPIRED') return;

  const now = new Date();
  let accruedDays = ent.accruedDays;
  let status: EntitlementStatus = ent.status;
  let eventType = '';

  if (active) {
    // نحتسب المنقضي فقط إن كان متراكمًا سابقًا (بلا فجوة)؛ وإلا نستأنف من الآن
    if (ent.status === 'ACTIVE' && ent.lastAccrualAt) {
      const elapsed = Math.floor((now.getTime() - ent.lastAccrualAt.getTime()) / 86_400_000);
      if (elapsed > 0) { accruedDays += elapsed; eventType = 'ACCRUED'; }
    } else if (ent.status === 'PAUSED') {
      eventType = 'RESUMED';
    }
    status = 'ACTIVE';
  } else {
    if (ent.status === 'ACTIVE') { status = 'PAUSED'; eventType = 'PAUSED'; }
  }

  const requiredDays = ent.requiredDurationYears * 365;
  let completedAt = ent.completedAt;
  if (accruedDays >= requiredDays) {
    accruedDays = requiredDays;
    status = 'COMPLETED';
    completedAt = completedAt ?? now;
    eventType = 'COMPLETED';
  }

  await prisma.permanentEntitlement.update({
    where: { id: ent.id },
    data: {
      accruedDays,
      status,
      completedAt,
      lastAccrualAt: active ? now : ent.lastAccrualAt,
      ...(eventType ? { events: { create: { type: eventType } } } : {}),
    },
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response('billing not configured', { status: 503 });

  const sig = request.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret); // يتحقق من صحة التوقيع
  } catch {
    return new Response('invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(session.subscription));
          await syncSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object);
        break;
      }
      default:
        break;
    }
  } catch {
    return new Response('handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
