import type { OrgType, OrgPlan } from '@/generated/prisma/client';

/**
 * وحدات المؤسسة القابلة للتفعيل/الإيقاف.
 * المخزَّن على المؤسسة هو قائمة «المعطّلة»؛ فالمفعّل = كل ما ليس معطّلًا.
 * الأساسيات (لوحة التحكم، المؤسسة، الهوية، الإعدادات، الإدارة) لا تُعطَّل.
 */
export const ORG_MODULES = [
  'operations',
  'resources',
  'education',
  'documents',
  'knowledge',
  'reports',
  'assistant',
  'content',
] as const;

export type OrgModule = (typeof ORG_MODULES)[number];

/** مفتاح ترجمة اسم الوحدة (يعاد استخدام مفاتيح التنقّل الموجودة). */
export const MODULE_LABEL_KEY: Record<OrgModule, string> = {
  operations: 'onav.operations',
  resources: 'onav.resources',
  education: 'onav.education',
  documents: 'onav.documents',
  knowledge: 'onav.knowledge',
  reports: 'onav.reports',
  assistant: 'onav.assistant',
  content: 'onav.content',
};

/** مفتاح ترجمة وصف مختصر للوحدة. */
export const MODULE_DESC_KEY: Record<OrgModule, string> = {
  operations: 'mod.desc.operations',
  resources: 'mod.desc.resources',
  education: 'mod.desc.education',
  documents: 'mod.desc.documents',
  knowledge: 'mod.desc.knowledge',
  reports: 'mod.desc.reports',
  assistant: 'mod.desc.assistant',
  content: 'mod.desc.content',
};

export function isOrgModule(value: string): value is OrgModule {
  return (ORG_MODULES as readonly string[]).includes(value);
}

/** هل الوحدة مفعّلة لهذه المؤسسة؟ */
export function moduleEnabled(disabled: string[] | null | undefined, m: OrgModule): boolean {
  return !(disabled ?? []).includes(m);
}

/* ============================================================
   سجلّ الأنظمة المدفوع بالبيانات (Metadata-driven registry)
   ------------------------------------------------------------
   طبقة وصفية غنيّة فوق قائمة الوحدات — تُمكّن النظام من معرفة:
     • أيّ الأنظمة تخصّ نوع المؤسسة (organizationTypes)؟
     • ما الحد الأدنى للباقة (requiredPlan)؟
     • ما التبعيّات (dependencies)؟ وما التصنيف (category)؟
   الهدف: إضافة قطاعات/أنظمة مستقبلًا عبر التهيئة (Config) لا بإعادة
   بناء النواة. هذه الطبقة إضافية ولا تغيّر سلوك التنقّل الحالي.
   ============================================================ */

/** حالة النظام بالنسبة لمؤسسة بعينها. */
export type ModuleStatus =
  | 'ACTIVE' // مفعّل ومتاح
  | 'DISABLED' // متاح للنوع لكن عطّله المدير
  | 'PLAN_LOCKED' // يحتاج ترقية باقة
  | 'UNAVAILABLE'; // لا يخصّ نوع هذه المؤسسة

/** تصنيف النظام لتجميعه في الواجهة. */
export type ModuleCategory = 'OPERATIONS' | 'EDUCATION' | 'KNOWLEDGE' | 'SYSTEM';

export interface ModuleDef {
  id: OrgModule;
  labelKey: string;
  descKey: string;
  /** مفتاح أيقونة تحت public/icons (بلا .svg). */
  icon: string;
  category: ModuleCategory;
  /** أنواع المؤسسات التي يخصّها هذا النظام. فارغة = عام لكل الأنواع. */
  organizationTypes: OrgType[];
  /** الحد الأدنى للباقة لتفعيل النظام. */
  requiredPlan: OrgPlan;
  /** أنظمة يعتمد عليها هذا النظام (يجب أن تكون مفعّلة). */
  dependencies: OrgModule[];
}

/** ترتيب الباقات لمقارنة الأحقّية (الأعلى يشمل ما دونه). */
export const PLAN_RANK: Record<OrgPlan, number> = {
  STARTER: 0,
  GROWTH: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

/** هل باقة المؤسسة تفي بالحد الأدنى المطلوب؟ */
export function planMeets(orgPlan: OrgPlan, required: OrgPlan): boolean {
  return PLAN_RANK[orgPlan] >= PLAN_RANK[required];
}

/**
 * السجلّ المركزي للأنظمة. أضِف/عدّل نظامًا من هنا فقط.
 * organizationTypes الفارغة تعني «نظام عام» يظهر لكل الأنواع.
 */
export const MODULE_REGISTRY: Record<OrgModule, ModuleDef> = {
  operations: {
    id: 'operations', labelKey: MODULE_LABEL_KEY.operations, descKey: MODULE_DESC_KEY.operations,
    icon: 'operations/operations-activities', category: 'OPERATIONS',
    organizationTypes: ['ASSOCIATION', 'PROJECT'], requiredPlan: 'GROWTH', dependencies: [],
  },
  resources: {
    id: 'resources', labelKey: MODULE_LABEL_KEY.resources, descKey: MODULE_DESC_KEY.resources,
    icon: 'people/people-groups', category: 'OPERATIONS',
    organizationTypes: ['ASSOCIATION'], requiredPlan: 'GROWTH', dependencies: [],
  },
  education: {
    id: 'education', labelKey: MODULE_LABEL_KEY.education, descKey: MODULE_DESC_KEY.education,
    icon: 'education/education-education', category: 'EDUCATION',
    organizationTypes: ['MOSQUE', 'SCHOOL'], requiredPlan: 'PROFESSIONAL', dependencies: [],
  },
  documents: {
    id: 'documents', labelKey: MODULE_LABEL_KEY.documents, descKey: MODULE_DESC_KEY.documents,
    icon: 'documents/documents-documents', category: 'KNOWLEDGE',
    organizationTypes: [], requiredPlan: 'STARTER', dependencies: [],
  },
  knowledge: {
    id: 'knowledge', labelKey: MODULE_LABEL_KEY.knowledge, descKey: MODULE_DESC_KEY.knowledge,
    icon: 'education/education-learning', category: 'KNOWLEDGE',
    organizationTypes: [], requiredPlan: 'GROWTH', dependencies: [],
  },
  reports: {
    id: 'reports', labelKey: MODULE_LABEL_KEY.reports, descKey: MODULE_DESC_KEY.reports,
    icon: 'analytics/analytics-analytics', category: 'KNOWLEDGE',
    organizationTypes: [], requiredPlan: 'GROWTH', dependencies: [],
  },
  assistant: {
    id: 'assistant', labelKey: MODULE_LABEL_KEY.assistant, descKey: MODULE_DESC_KEY.assistant,
    icon: 'ai/ai-ai-assistant', category: 'KNOWLEDGE',
    organizationTypes: [], requiredPlan: 'PROFESSIONAL', dependencies: [],
  },
  content: {
    id: 'content', labelKey: MODULE_LABEL_KEY.content, descKey: MODULE_DESC_KEY.content,
    icon: 'documents/documents-document-management', category: 'SYSTEM',
    organizationTypes: [], requiredPlan: 'STARTER', dependencies: [],
  },
};

/** قائمة تعريفات الأنظمة بالترتيب المعياري. */
export const MODULE_DEFS: ModuleDef[] = ORG_MODULES.map((m) => MODULE_REGISTRY[m]);

/** هل يخصّ النظام نوع المؤسسة؟ (الأنظمة العامة تخصّ الجميع.) */
export function moduleAppliesToType(m: OrgModule, type: OrgType): boolean {
  const def = MODULE_REGISTRY[m];
  return def.organizationTypes.length === 0 || def.organizationTypes.includes(type);
}

/** الأنظمة التي تخصّ نوع مؤسسة معيّن (عامة + خاصّة بالنوع). */
export function modulesForType(type: OrgType): ModuleDef[] {
  return MODULE_DEFS.filter((d) => moduleAppliesToType(d.id, type));
}

/** حالة النظام بالنسبة لمؤسسة (النوع + الباقة + قائمة المعطّل). */
export function moduleStatusFor(
  m: OrgModule,
  org: { type: OrgType; plan: OrgPlan; disabledModules?: string[] | null },
): ModuleStatus {
  if (!moduleAppliesToType(m, org.type)) return 'UNAVAILABLE';
  if (!planMeets(org.plan, MODULE_REGISTRY[m].requiredPlan)) return 'PLAN_LOCKED';
  if (!moduleEnabled(org.disabledModules, m)) return 'DISABLED';
  return 'ACTIVE';
}
