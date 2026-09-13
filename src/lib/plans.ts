import type { OrgPlan } from '@/generated/prisma/client';

/* ============================================================
   باقات مسرى — مقترح مبدئي قابل للتعديل بسهولة من هذا الملف.
   العملة والأسعار والحدود كلها هنا في مكان واحد.
   ============================================================ */

export const CURRENCY = 'ر.س'; // غيّرها حسب سوقك ($ / ر.س / ₺ …)

export interface Plan {
  id: OrgPlan;
  name: string;
  tagline: string;
  /** السعر الشهري؛ 0 = مجاني، null = تسعير مخصّص */
  price: number | null;
  /** السعر السنوي الإجمالي؛ إن لم يُحدَّد يُحسب تلقائيًا بخصم شهرين (price × 10) */
  priceYearly?: number | null;
  /** الحد الأقصى للمستخدمين؛ null = بلا حدّ */
  maxUsers: number | null;
  /** مساحة الوثائق بالغيغابايت؛ null = بلا حدّ */
  storageGb: number | null;
  /** الاسم الإنجليزي المرافق */
  en: string;
  /** تسمح الباقة بربط دومين مخصّص للمؤسسة؟ */
  customDomain?: boolean;
  features: string[];
  /** النصوص الإنجليزية (للعرض عند اختيار اللغة الإنجليزية) */
  tagEn?: string;
  featuresEn?: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'انطلاقة',
    en: 'Launch',
    tagline: 'للمؤسسات الصغيرة في بدايتها',
    tagEn: 'For small organizations starting out',
    price: 0,
    maxUsers: 5,
    storageGb: 1,
    features: [
      'حتى 5 مستخدمين',
      'الهيكل التنظيمي والمشاريع',
      'المستندات (1 غيغابايت)',
      'دعم عبر البريد',
    ],
    featuresEn: [
      'Up to 5 users',
      'Structure and projects',
      'Documents (1 GB)',
      'Email support',
    ],
  },
  {
    id: 'GROWTH',
    name: 'نمو',
    en: 'Growth',
    tagline: 'للمؤسسات المتنامية',
    tagEn: 'For growing organizations',
    price: 149,
    maxUsers: 20,
    storageGb: 10,
    highlighted: true,
    features: [
      'حتى 20 مستخدمًا',
      'كل مزايا انطلاقة + البرامج والحملات والتبرعات',
      'إدارة المستفيدين وقاعدة المعرفة',
      'مستندات (10 غيغابايت)',
      'التقارير والتحليلات',
    ],
    featuresEn: [
      'Up to 20 users',
      'All of Launch + programs, campaigns and donations',
      'Beneficiary management and knowledge base',
      'Documents (10 GB)',
      'Reports and analytics',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'تمكين',
    en: 'Empower',
    tagline: 'للمؤسسات المتقدّمة',
    tagEn: 'For advanced organizations',
    price: 449,
    maxUsers: 100,
    storageGb: 50,
    customDomain: true,
    features: [
      'حتى 100 مستخدم',
      'كل الوحدات + نظام التعليم والحلقات',
      'الموارد البشرية (موظفون، متطوعون، فرق)',
      'المساعد الذكي مسرى AI',
      'مستندات (50 غيغابايت)',
      'دعم بأولوية',
    ],
    featuresEn: [
      'Up to 100 users',
      'All modules + education and circles',
      'HR (employees, volunteers, teams)',
      'Masra AI assistant',
      'Documents (50 GB)',
      'Priority support',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'أثر',
    en: 'Impact',
    tagline: 'للمؤسسات الكبيرة والشبكات',
    tagEn: 'For large organizations and networks',
    price: null,
    maxUsers: null,
    storageGb: null,
    customDomain: true,
    features: [
      'مستخدمون ومساحة بلا حدود',
      'الهوية الرقمية والتكاملات المخصّصة',
      'اتفاقية مستوى خدمة (SLA)',
      'مدير حساب مخصّص',
      'تهيئة وتدريب',
    ],
    featuresEn: [
      'Unlimited users and storage',
      'Digital identity and custom integrations',
      'Service level agreement (SLA)',
      'Dedicated account manager',
      'Onboarding and training',
    ],
  },
];

/** عدد الأشهر المدفوعة في الاشتراك السنوي (12 − 2 مجانًا) */
export const YEARLY_MONTHS = 10;

/** السعر السنوي الإجمالي للباقة (null للمجاني/المخصّص) */
export function yearlyPrice(plan: Plan): number | null {
  if (plan.price === null || plan.price === 0) return plan.price;
  return plan.priceYearly ?? plan.price * YEARLY_MONTHS;
}

export const PLAN_BY_ID: Record<OrgPlan, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p]),
) as Record<OrgPlan, Plan>;

export function planLabel(id: string): string {
  return PLAN_BY_ID[id as OrgPlan]?.name ?? id;
}

/** الحدّ الأقصى للمستخدمين لباقة مؤسسة (null = بلا حدّ) */
export function planUserLimit(id: string): number | null {
  return PLAN_BY_ID[id as OrgPlan]?.maxUsers ?? null;
}

/** هل تسمح الباقة بربط دومين مخصّص؟ (تمكين وأثر فقط) */
export function planAllowsCustomDomain(id: string): boolean {
  return PLAN_BY_ID[id as OrgPlan]?.customDomain ?? false;
}
