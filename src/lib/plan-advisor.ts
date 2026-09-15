import type { OrgPlan } from '@/generated/prisma/client';
import { OFFERED_PLANS, PLAN_BY_ID, type Plan } from '@/lib/plans';

/* ============================================================
   مساعد اختيار الباقة — محرّك التوصية (Best-Fit، لا الأغلى).
   • مصدر بيانات الباقات: plans.ts (اسم/سعر/مزايا) — لا تكرار هنا.
   • أوزان التوصية فقط هي ما يُعدَّل من هذا الملف (مكان واحد).
   • كل الحساب نقيّ وقابل لإعادة الضبط عند اعتماد باقات/أسعار جديدة.
   ============================================================ */

export type StudentBucket = 'lt100' | 'b100_300' | 'b301_750' | 'gt750';
export type BranchAnswer = 'one' | 'multi' | 'expand';
export type WebsiteAnswer = 'have' | 'basic' | 'pro' | 'unsure';
export type NeedKey =
  | 'students_halaqat'
  | 'full_center'
  | 'reports'
  | 'website_identity'
  | 'communication'
  | 'automation_ai'
  | 'branches_expand';

export interface AdvisorAnswers {
  students?: StudentBucket;
  branches?: BranchAnswer;
  website?: WebsiteAnswer;
  needs: NeedKey[];
}

/** رموز أسباب التوصية — تُترجَم في الواجهة (advisor.reason.*). */
export type ReasonCode =
  | 'sizeFit'
  | 'needsTools'
  | 'growthRoom'
  | 'branches'
  | 'website'
  | 'notOverpay'
  | 'enterprise';

type Weights = Partial<Record<OrgPlan, number>>;

/* ------------------------------------------------------------
   جدول الأوزان — المكان الوحيد لضبط منطق التوصية.
   عدّل الأرقام هنا عند تغيّر الباقات دون لمس الـ Wizard.
   ------------------------------------------------------------ */
const STUDENT_W: Record<StudentBucket, Weights> = {
  lt100:     { STARTER: 2, GROWTH: 3, PROFESSIONAL: 1 },
  b100_300:  { GROWTH: 3, PROFESSIONAL: 2 },
  b301_750:  { GROWTH: 1, PROFESSIONAL: 3, ENTERPRISE: 1 },
  gt750:     { PROFESSIONAL: 1, ENTERPRISE: 4 },
};

const BRANCH_W: Record<BranchAnswer, Weights> = {
  one:    { STARTER: 1, GROWTH: 2, PROFESSIONAL: 1 },
  multi:  { PROFESSIONAL: 2, ENTERPRISE: 3 },
  expand: { GROWTH: 1, PROFESSIONAL: 2, ENTERPRISE: 1 },
};

const WEBSITE_W: Record<WebsiteAnswer, Weights> = {
  have:   {},
  basic:  { GROWTH: 2, PROFESSIONAL: 1 },
  pro:    { PROFESSIONAL: 3, ENTERPRISE: 2 },
  unsure: { GROWTH: 1, PROFESSIONAL: 1 },
};

const NEED_W: Record<NeedKey, Weights> = {
  students_halaqat: { STARTER: 1, GROWTH: 2, PROFESSIONAL: 2 },
  full_center:      { GROWTH: 1, PROFESSIONAL: 2, ENTERPRISE: 1 },
  reports:          { GROWTH: 2, PROFESSIONAL: 2, ENTERPRISE: 1 },
  website_identity: { PROFESSIONAL: 2, ENTERPRISE: 2 },
  communication:    { GROWTH: 1, PROFESSIONAL: 2 },
  automation_ai:    { PROFESSIONAL: 3, ENTERPRISE: 2 },
  branches_expand:  { PROFESSIONAL: 1, ENTERPRISE: 3 },
};

/** ترتيب الباقات من الأدنى للأعلى — لكسر التعادل لصالح الأنسب (لا الأغلى). */
function planRank(id: OrgPlan): number {
  const order: OrgPlan[] = ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];
  const i = order.indexOf(id);
  return i < 0 ? order.length : i;
}

function addWeights(into: Map<OrgPlan, number>, w: Weights) {
  for (const [plan, pts] of Object.entries(w) as [OrgPlan, number][]) {
    into.set(plan, (into.get(plan) ?? 0) + pts);
  }
}

export interface Recommendation {
  plan: Plan;
  /** النقاط لكل باقة (شفافية/تصحيح). */
  scores: Record<OrgPlan, number>;
  reasons: ReasonCode[];
}

/**
 * يحسب الباقة الأنسب من الإجابات.
 * عند التعادل تُختار الباقة الأقل سعرًا (Best-Fit وليس Upsell).
 */
export function recommend(a: AdvisorAnswers): Recommendation {
  const scores = new Map<OrgPlan, number>();
  for (const p of OFFERED_PLANS) scores.set(p.id, 0);

  if (a.students) addWeights(scores, STUDENT_W[a.students]);
  if (a.branches) addWeights(scores, BRANCH_W[a.branches]);
  if (a.website) addWeights(scores, WEBSITE_W[a.website]);
  for (const n of a.needs) addWeights(scores, NEED_W[n] ?? {});

  // أعلى نقاط؛ التعادل يُكسَر لصالح الباقة الأدنى رتبةً (الأنسب لا الأغلى)
  let best: OrgPlan = OFFERED_PLANS[0].id;
  for (const p of OFFERED_PLANS) {
    const s = scores.get(p.id) ?? 0;
    const bs = scores.get(best) ?? 0;
    if (s > bs || (s === bs && planRank(p.id) < planRank(best))) best = p.id;
  }

  const scoresObj = Object.fromEntries(scores) as Record<OrgPlan, number>;
  return { plan: PLAN_BY_ID[best], scores: scoresObj, reasons: buildReasons(best, a) };
}

/** يبني أسباب التوصية (رموز تُترجَم) حسب ما دفع الاختيار فعلًا. */
function buildReasons(plan: OrgPlan, a: AdvisorAnswers): ReasonCode[] {
  const r: ReasonCode[] = ['sizeFit'];

  // تغطية الاحتياجات المختارة
  if (a.needs.length > 0) r.push('needsTools');

  // الموقع الإلكتروني (عند طلبه والباقة تدعم دومينًا/موقعًا احترافيًا)
  if ((a.website === 'basic' || a.website === 'pro') && (plan === 'GROWTH' || plan === 'PROFESSIONAL' || plan === 'ENTERPRISE')) {
    r.push('website');
  }

  // الفروع (عند تعدّدها أو خطة التوسّع مع باقة تدعم ذلك)
  if ((a.branches === 'multi' || a.branches === 'expand') && (plan === 'PROFESSIONAL' || plan === 'ENTERPRISE')) {
    r.push('branches');
  }

  if (plan === 'ENTERPRISE') {
    r.push('enterprise');
  } else {
    // ليست الأعلى: نبرز أنها تكفي الحاجة دون دفع زائد + مساحة نموّ
    r.push('notOverpay');
    if (plan === 'STARTER' || plan === 'GROWTH') r.push('growthRoom');
  }

  // أزل التكرار واحتفظ بأول 4 أسباب كحدّ أقصى
  return [...new Set(r)].slice(0, 4);
}
