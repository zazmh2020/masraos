import type {
  Role,
  ProjectStatus,
  ProgramCategory,
  ProgramStatus,
  CampaignType,
  CampaignStatus,
  BeneficiaryCategory,
  BeneficiaryStatus,
  DonationMethod,
  DonationStatus,
  StudentStatus,
  HalaqaType,
  HalaqaTrack,
  HalaqaPeriod,
  AttendanceStatus,
  MemorizationKind,
  MemorizationRating,
  EmployeeStatus,
  VolunteerStatus,
  TaskStatus,
  TaskPriority,
  RequestType,
  RequestStatus,
  ApprovalCategory,
  ApprovalStatus,
  AssessmentKind,
  AssessmentResult,
  FinanceKind,
  FinanceCategory,
} from '@/generated/prisma/client';

/* ============================================================
   الأدوار والصلاحيات
   مصدر واحد لأسماء الأدوار والقدرات المرتبطة بها.
   ============================================================ */

export const ROLE_LABELS: Record<Role, string> = {
  PLATFORM_OWNER: 'مالك المنصة',
  ORG_ADMIN: 'مدير المؤسسة',
  SUPERVISOR: 'مشرف',
  STAFF: 'موظف',
  TEACHER: 'معلم',
  MEMBER: 'عضو',
  STUDENT: 'طالب',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

/** الأدوار التي يمكن إسنادها لمستخدم داخل مؤسسة — لا يُسند دور مالك المنصة أبدًا */
export const ASSIGNABLE_ROLES: Role[] = ['ORG_ADMIN', 'SUPERVISOR', 'STAFF', 'TEACHER', 'MEMBER', 'STUDENT'];

export function isAssignableRole(role: string): role is Role {
  return (ASSIGNABLE_ROLES as string[]).includes(role);
}

/* ============================================================
   نظام القدرات (Capabilities)
   كل دالة صلاحية تُختزل إلى قدرة واحدة. الأدوار الأساسية الثلاثة
   لها مجموعات قدرات ثابتة (مطابقة للسلوك السابق تمامًا)، والدور
   المخصّص يحمل قائمة قدراته الخاصّة التي تتجاوز الدور الأساسي.
   ============================================================ */

/** الفاعل: إمّا سلسلة دور، أو كائن يحمل الدور وقائمة قدرات مخصّصة (إن وُجد دور مخصّص). */
export type Actor = { role: string; permissions?: string[] | null };

/** مجموعات القدرات لعرضها في محرّر الأدوار (مفتاح ترجمة الوحدة + القدرات). */
export const CAP_GROUPS: { labelKey: string; caps: { key: string; kind: 'view' | 'manage' }[] }[] = [
  { labelKey: 'hub.ops.projects', caps: [{ key: 'projects.view', kind: 'view' }, { key: 'projects.manage', kind: 'manage' }] },
  { labelKey: 'hub.ops.programs', caps: [{ key: 'programs.view', kind: 'view' }, { key: 'programs.manage', kind: 'manage' }] },
  { labelKey: 'hub.ops.campaigns', caps: [{ key: 'campaigns.view', kind: 'view' }, { key: 'campaigns.manage', kind: 'manage' }] },
  { labelKey: 'hub.ops.donations', caps: [{ key: 'donations.view', kind: 'view' }, { key: 'donations.manage', kind: 'manage' }] },
  { labelKey: 'hub.ops.tasks', caps: [{ key: 'tasks.view', kind: 'view' }, { key: 'tasks.manage', kind: 'manage' }] },
  { labelKey: 'hub.ops.workflow', caps: [{ key: 'approvals.view', kind: 'view' }, { key: 'approvals.decide', kind: 'manage' }] },
  { labelKey: 'hub.ops.branches', caps: [{ key: 'branches.view', kind: 'view' }, { key: 'branches.manage', kind: 'manage' }] },
  { labelKey: 'onav.finance', caps: [{ key: 'finance.view', kind: 'view' }, { key: 'finance.manage', kind: 'manage' }] },
  { labelKey: 'onav.education', caps: [{ key: 'education.view', kind: 'view' }, { key: 'education.manage', kind: 'manage' }] },
  { labelKey: 'onav.resources', caps: [{ key: 'hr.view', kind: 'view' }, { key: 'hr.manage', kind: 'manage' }] },
  { labelKey: 'hub.res.beneficiaries', caps: [{ key: 'beneficiaries.view', kind: 'view' }, { key: 'beneficiaries.manage', kind: 'manage' }] },
  { labelKey: 'onav.documents', caps: [{ key: 'documents.view', kind: 'view' }, { key: 'documents.manage', kind: 'manage' }] },
  { labelKey: 'onav.knowledge', caps: [{ key: 'knowledge.view', kind: 'view' }, { key: 'knowledge.manage', kind: 'manage' }] },
  { labelKey: 'roles.mod.structure', caps: [{ key: 'structure.view', kind: 'view' }, { key: 'structure.manage', kind: 'manage' }] },
  { labelKey: 'onav.reports', caps: [{ key: 'reports.view', kind: 'view' }] },
  { labelKey: 'roles.mod.users', caps: [{ key: 'users.view', kind: 'view' }, { key: 'users.manage', kind: 'manage' }] },
  { labelKey: 'roles.mod.customize', caps: [{ key: 'customize.manage', kind: 'manage' }] },
  { labelKey: 'onav.assistant', caps: [{ key: 'assistant.use', kind: 'view' }] },
];

/** كل القدرات المتاحة (تُشتقّ من المجموعات) + قدرات إضافية غير معروضة في المحرّر. */
export const ALL_CAPS: string[] = [
  ...CAP_GROUPS.flatMap((g) => g.caps.map((c) => c.key)),
  'events.view', 'events.manage', 'fees.manage', 'requests.view', 'requests.manage', 'settings.manage',
];

// قدرات العضو الأساسي (اطّلاع على ما يخصّ جميع الأعضاء)
const MEMBER_CAPS = [
  'projects.view', 'programs.view', 'campaigns.view', 'tasks.view', 'approvals.view',
  'requests.view', 'events.view', 'structure.view', 'documents.view', 'knowledge.view', 'assistant.use',
];
// قدرات الموظّف = قدرات العضو + إدارة تشغيلية واطّلاع على الحسّاس
const STAFF_CAPS = [
  ...MEMBER_CAPS, 'users.view', 'branches.view', 'projects.manage', 'programs.manage', 'campaigns.manage',
  'donations.view', 'donations.manage', 'beneficiaries.view', 'beneficiaries.manage', 'tasks.manage',
  'events.manage', 'fees.manage', 'education.view', 'education.manage', 'hr.view', 'hr.manage',
  'documents.manage', 'knowledge.manage', 'reports.view', 'finance.view', 'finance.manage',
];
// قدرات المشرف = إشراف تربوي/برامجي (متابعة الحلقات والمعلمين والطلاب والتقارير)
// دون المالية والتبرعات والمستفيدين (تبقى للإدارة/الموظّفين).
const SUPERVISOR_CAPS = [
  ...MEMBER_CAPS, 'users.view', 'education.view', 'education.manage', 'programs.manage',
  'campaigns.view', 'tasks.manage', 'events.manage', 'reports.view',
  'requests.view', 'requests.manage', 'fees.manage', 'hr.view', 'documents.manage', 'knowledge.manage',
];
// قدرات المعلّم = قدرات العضو + الاطّلاع على التعليم (حلقاته وطلابه تُقصر ببوّابة «حلقاتي»).
const TEACHER_CAPS = [...MEMBER_CAPS, 'education.view'];
// قدرات الطالب = محدودة جدًا (ملفّه ومحتوى منشور فقط).
const STUDENT_CAPS = ['knowledge.view', 'events.view'];

/** قدرات كل دور أساسي — مطابقة لسلوك الدوال السابق. */
export const BASE_CAPS: Record<string, string[]> = {
  PLATFORM_OWNER: [],
  ORG_ADMIN: [...ALL_CAPS],
  SUPERVISOR: SUPERVISOR_CAPS,
  STAFF: STAFF_CAPS,
  TEACHER: TEACHER_CAPS,
  MEMBER: MEMBER_CAPS,
  STUDENT: STUDENT_CAPS,
};

/** القدرات الفعّالة للفاعل: قدرات الدور المخصّص إن وُجد، وإلا قدرات الدور الأساسي. */
export function actorCaps(a: string | Actor): string[] {
  if (typeof a === 'string') return BASE_CAPS[a] ?? [];
  if (Array.isArray(a.permissions)) return a.permissions; // دور مخصّص (حتى لو فارغًا = بلا صلاحيات)
  return BASE_CAPS[a.role] ?? [];
}

/** هل يملك الفاعل هذه القدرة؟ */
export function can(a: string | Actor, cap: string): boolean {
  return actorCaps(a).includes(cap);
}

/** من يدير حسابات المؤسسة (إضافة، تعديل دور، إيقاف) */
export function canManageUsers(a: string | Actor): boolean {
  return can(a, 'users.manage');
}

/** من يطّلع على قائمة المستخدمين */
export function canViewUsers(a: string | Actor): boolean {
  return can(a, 'users.view');
}

/** من يعدّل إعدادات المؤسسة */
export function canManageSettings(a: string | Actor): boolean {
  return can(a, 'settings.manage');
}

/** من يخصّص الهوية والمسميات وأي محتوى قابل للتخصيص — مدير الجهة افتراضيًا، ويمنحها لمن يشاء */
export function canCustomize(a: string | Actor): boolean {
  return can(a, 'customize.manage');
}

/* ---------- المشاريع ---------- */

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'مخطّط',
  ACTIVE: 'جارٍ',
  ON_HOLD: 'متوقّف',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];

export function projectStatusLabel(status: string): string {
  return PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status;
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as string[]).includes(value);
}

/** من يطّلع على مشاريع المؤسسة — جميع أعضائها */
export function canViewProjects(a: string | Actor): boolean {
  return can(a, 'projects.view');
}

/** من ينشئ ويعدّل ويحذف المشاريع */
export function canManageProjects(a: string | Actor): boolean {
  return can(a, 'projects.manage');
}

/* ---------- المهام ---------- */

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as TaskStatus[];
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[];

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as string[]).includes(value);
}
export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as string[]).includes(value);
}

/** من يطّلع على مهام المؤسسة — جميع أعضائها */
export function canViewTasks(a: string | Actor): boolean {
  return can(a, 'tasks.view');
}

/** من ينشئ ويعدّل ويحذف المهام */
export function canManageTasks(a: string | Actor): boolean {
  return can(a, 'tasks.manage');
}

/* ---------- الفروع ---------- */

/** يطّلع على فروع المؤسسة: الإدارة والموظفون */
export function canViewBranches(a: string | Actor): boolean {
  return can(a, 'branches.view');
}
/** يدير الفروع (إضافة/تعديل/حذف): مدير المؤسسة */
export function canManageBranches(a: string | Actor): boolean {
  return can(a, 'branches.manage');
}

/* ---------- الاعتمادات / سير العمل ---------- */

export const APPROVAL_CATEGORY_LABELS: Record<ApprovalCategory, string> = {
  PURCHASE: 'شراء',
  PAYMENT: 'صرف / دفع',
  LEAVE: 'إجازة',
  CONTRACT: 'عقد / اتفاقية',
  GENERAL: 'عام',
};
export const APPROVAL_CATEGORIES = Object.keys(APPROVAL_CATEGORY_LABELS) as ApprovalCategory[];
export const approvalCategoryLabel = (v: string) => APPROVAL_CATEGORY_LABELS[v as ApprovalCategory] ?? v;
export const isApprovalCategory = (v: string): v is ApprovalCategory => (APPROVAL_CATEGORIES as string[]).includes(v);

export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as ApprovalStatus[];
export const isApprovalStatus = (v: string): v is ApprovalStatus => (APPROVAL_STATUSES as string[]).includes(v);

/** يقدّم طلب اعتماد ويطّلع على الاعتمادات — جميع الأعضاء */
export function canViewApprovals(a: string | Actor): boolean {
  return can(a, 'approvals.view');
}
/** يعتمد/يرفض الطلبات — مدير المؤسسة */
export function canDecideApprovals(a: string | Actor): boolean {
  return can(a, 'approvals.decide');
}

/* ---------- الطلبات ---------- */

export const REQUEST_TYPES = ['EXAM', 'GRADE_EDIT', 'SUPERVISOR_MEETING', 'PERMISSION', 'MAKEUP_CLASS', 'TEACHER_SERVICE', 'DROPOUT_EXAM', 'OTHER'] as RequestType[];
export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as RequestStatus[];
export const isRequestType = (v: string): v is RequestType => (REQUEST_TYPES as string[]).includes(v);
export const isRequestStatus = (v: string): v is RequestStatus => (REQUEST_STATUSES as string[]).includes(v);

/** من يطّلع على طلبات المؤسسة ويقدّمها — جميع الأعضاء */
export function canViewRequests(a: string | Actor): boolean {
  return can(a, 'requests.view');
}
/** من يعتمد/يرفض الطلبات — مدير المؤسسة */
export function canManageRequests(a: string | Actor): boolean {
  return can(a, 'requests.manage');
}

/* ---------- الفعاليات والرسوم ---------- */

export function canViewEvents(a: string | Actor): boolean {
  return can(a, 'events.view');
}
export function canManageEvents(a: string | Actor): boolean {
  return can(a, 'events.manage');
}
export function canManageFees(a: string | Actor): boolean {
  return can(a, 'fees.manage');
}

/* ---------- المالية ---------- */

export const FINANCE_KIND_LABELS: Record<FinanceKind, string> = { INCOME: 'دخل', EXPENSE: 'مصروف' };
export const FINANCE_KINDS = Object.keys(FINANCE_KIND_LABELS) as FinanceKind[];
export const financeKindLabel = (v: string) => FINANCE_KIND_LABELS[v as FinanceKind] ?? v;
export const isFinanceKind = (v: string): v is FinanceKind => (FINANCE_KINDS as string[]).includes(v);

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  SALARY: 'رواتب', RENT: 'إيجار', UTILITIES: 'خدمات', SUPPLIES: 'مستلزمات', MAINTENANCE: 'صيانة',
  FEES: 'رسوم واشتراكات', DONATIONS: 'تبرعات', GRANT: 'منح ودعم', OTHER: 'أخرى',
};
export const FINANCE_CATEGORIES = Object.keys(FINANCE_CATEGORY_LABELS) as FinanceCategory[];
export const financeCategoryLabel = (v: string) => FINANCE_CATEGORY_LABELS[v as FinanceCategory] ?? v;
export const isFinanceCategory = (v: string): v is FinanceCategory => (FINANCE_CATEGORIES as string[]).includes(v);

/** المالية حسّاسة — للإدارة والموظّفين (أو دور مخصّص يمنح finance) */
export function canViewFinance(a: string | Actor): boolean {
  return can(a, 'finance.view');
}
export function canManageFinance(a: string | Actor): boolean {
  return can(a, 'finance.manage');
}

/* ---------- الهيكل المؤسسي ---------- */

/** من يطّلع على الهيكل التنظيمي — جميع أعضاء المؤسسة */
export function canViewStructure(a: string | Actor): boolean {
  return can(a, 'structure.view');
}

/** من يبني الهيكل ويسند الأعضاء إليه */
export function canManageStructure(a: string | Actor): boolean {
  return can(a, 'structure.manage');
}

/* ---------- البرامج ---------- */

export const PROGRAM_CATEGORY_LABELS: Record<ProgramCategory, string> = {
  EDUCATIONAL: 'تعليمي',
  HUMANITARIAN: 'إنساني',
  DEVELOPMENTAL: 'تنموي',
  RELIGIOUS: 'ديني / قرآني',
  HEALTH: 'صحي',
};
export const PROGRAM_CATEGORIES = Object.keys(PROGRAM_CATEGORY_LABELS) as ProgramCategory[];
export function programCategoryLabel(v: string): string {
  return PROGRAM_CATEGORY_LABELS[v as ProgramCategory] ?? v;
}
export function isProgramCategory(v: string): v is ProgramCategory {
  return (PROGRAM_CATEGORIES as string[]).includes(v);
}

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  PLANNED: 'مخطّط',
  ACTIVE: 'جارٍ',
  COMPLETED: 'منتهٍ',
  SUSPENDED: 'موقوف',
};
export const PROGRAM_STATUSES = Object.keys(PROGRAM_STATUS_LABELS) as ProgramStatus[];
export function programStatusLabel(v: string): string {
  return PROGRAM_STATUS_LABELS[v as ProgramStatus] ?? v;
}
export function isProgramStatus(v: string): v is ProgramStatus {
  return (PROGRAM_STATUSES as string[]).includes(v);
}

/** من يطّلع على برامج المؤسسة — جميع أعضائها */
export function canViewPrograms(a: string | Actor): boolean {
  return can(a, 'programs.view');
}

/** من ينشئ ويعدّل ويحذف البرامج */
export function canManagePrograms(a: string | Actor): boolean {
  return can(a, 'programs.manage');
}

/* ---------- الحملات ---------- */

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  CHARITY: 'خيرية',
  SEASONAL: 'موسمية',
  AWARENESS: 'توعوية',
};
export const CAMPAIGN_TYPES = Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[];
export function campaignTypeLabel(v: string): string {
  return CAMPAIGN_TYPE_LABELS[v as CampaignType] ?? v;
}
export function isCampaignType(v: string): v is CampaignType {
  return (CAMPAIGN_TYPES as string[]).includes(v);
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  PLANNED: 'مخطّطة',
  ACTIVE: 'جارية',
  COMPLETED: 'منتهية',
  CANCELLED: 'ملغاة',
};
export const CAMPAIGN_STATUSES = Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[];
export function campaignStatusLabel(v: string): string {
  return CAMPAIGN_STATUS_LABELS[v as CampaignStatus] ?? v;
}
export function isCampaignStatus(v: string): v is CampaignStatus {
  return (CAMPAIGN_STATUSES as string[]).includes(v);
}

export function canViewCampaigns(a: string | Actor): boolean {
  return can(a, 'campaigns.view');
}
export function canManageCampaigns(a: string | Actor): boolean {
  return can(a, 'campaigns.manage');
}

/* ---------- المستفيدون ---------- */

export const BENEFICIARY_CATEGORY_LABELS: Record<BeneficiaryCategory, string> = {
  FAMILY: 'أسرة',
  ORPHAN: 'يتيم',
  STUDENT: 'طالب',
  ELDERLY: 'مسنّ',
  OTHER: 'أخرى',
};
export const BENEFICIARY_CATEGORIES = Object.keys(BENEFICIARY_CATEGORY_LABELS) as BeneficiaryCategory[];
export function beneficiaryCategoryLabel(v: string): string {
  return BENEFICIARY_CATEGORY_LABELS[v as BeneficiaryCategory] ?? v;
}
export function isBeneficiaryCategory(v: string): v is BeneficiaryCategory {
  return (BENEFICIARY_CATEGORIES as string[]).includes(v);
}

export const BENEFICIARY_STATUS_LABELS: Record<BeneficiaryStatus, string> = {
  ACTIVE: 'نشط',
  PENDING: 'قيد المراجعة',
  INACTIVE: 'موقوف',
};
export const BENEFICIARY_STATUSES = Object.keys(BENEFICIARY_STATUS_LABELS) as BeneficiaryStatus[];
export function beneficiaryStatusLabel(v: string): string {
  return BENEFICIARY_STATUS_LABELS[v as BeneficiaryStatus] ?? v;
}
export function isBeneficiaryStatus(v: string): v is BeneficiaryStatus {
  return (BENEFICIARY_STATUSES as string[]).includes(v);
}

/** بيانات المستفيدين حسّاسة — تُقصر على من يديرها */
export function canViewBeneficiaries(a: string | Actor): boolean {
  return can(a, 'beneficiaries.view');
}
export function canManageBeneficiaries(a: string | Actor): boolean {
  return can(a, 'beneficiaries.manage');
}

/* ---------- التبرعات ---------- */

export const DONATION_METHOD_LABELS: Record<DonationMethod, string> = {
  CASH: 'نقداً',
  BANK: 'تحويل بنكي',
  CARD: 'بطاقة',
  ONLINE: 'إلكتروني',
};
export const DONATION_METHODS = Object.keys(DONATION_METHOD_LABELS) as DonationMethod[];
export function donationMethodLabel(v: string): string {
  return DONATION_METHOD_LABELS[v as DonationMethod] ?? v;
}
export function isDonationMethod(v: string): v is DonationMethod {
  return (DONATION_METHODS as string[]).includes(v);
}

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  PLEDGED: 'متعهَّد به',
  RECEIVED: 'مستلَم',
};
export const DONATION_STATUSES = Object.keys(DONATION_STATUS_LABELS) as DonationStatus[];
export function donationStatusLabel(v: string): string {
  return DONATION_STATUS_LABELS[v as DonationStatus] ?? v;
}
export function isDonationStatus(v: string): v is DonationStatus {
  return (DONATION_STATUSES as string[]).includes(v);
}

/** التبرعات مالية — للإدارة والموظفين */
export function canViewDonations(a: string | Actor): boolean {
  return can(a, 'donations.view');
}
export function canManageDonations(a: string | Actor): boolean {
  return can(a, 'donations.manage');
}

/* ---------- قاعدة المعرفة ---------- */

/** يرى المنشور جميع الأعضاء؛ والمسودّات لمن يدير */
export function canViewKnowledge(a: string | Actor): boolean {
  return can(a, 'knowledge.view');
}
export function canManageKnowledge(a: string | Actor): boolean {
  return can(a, 'knowledge.manage');
}

/* ---------- التقارير ---------- */

export function canViewReports(a: string | Actor): boolean {
  return can(a, 'reports.view');
}

/* ---------- الوثائق ---------- */

/** يطّلع على وثائق المؤسسة جميع الأعضاء */
export function canViewDocuments(a: string | Actor): boolean {
  return can(a, 'documents.view');
}
/** يرفع ويحذف الوثائق: الإدارة والموظفون */
export function canManageDocuments(a: string | Actor): boolean {
  return can(a, 'documents.manage');
}

/* ---------- التعليم / الحلقات ---------- */

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: 'منتظم', PAUSED: 'متوقّف', GRADUATED: 'متخرّج', WITHDRAWN: 'منسحب',
};
export const STUDENT_STATUSES = Object.keys(STUDENT_STATUS_LABELS) as StudentStatus[];
export const studentStatusLabel = (v: string) => STUDENT_STATUS_LABELS[v as StudentStatus] ?? v;
export const isStudentStatus = (v: string): v is StudentStatus => (STUDENT_STATUSES as string[]).includes(v);

export const HALAQA_TYPE_LABELS: Record<HalaqaType, string> = {
  MEMORIZATION: 'تحفيظ', TAJWEED: 'تجويد', REVIEW: 'مراجعة', OTHER: 'أخرى',
};
export const HALAQA_TYPES = Object.keys(HALAQA_TYPE_LABELS) as HalaqaType[];
export const halaqaTypeLabel = (v: string) => HALAQA_TYPE_LABELS[v as HalaqaType] ?? v;
export const isHalaqaType = (v: string): v is HalaqaType => (HALAQA_TYPES as string[]).includes(v);

export const HALAQA_TRACKS = ['MEMORIZATION', 'RECITATION'] as HalaqaTrack[];
export const HALAQA_PERIODS = ['MORNING', 'EVENING1', 'EVENING2'] as HalaqaPeriod[];
export const isHalaqaTrack = (v: string): v is HalaqaTrack => (HALAQA_TRACKS as string[]).includes(v);
export const isHalaqaPeriod = (v: string): v is HalaqaPeriod => (HALAQA_PERIODS as string[]).includes(v);

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'حاضر', ABSENT: 'غائب', LATE: 'متأخّر', EXCUSED: 'بعذر',
};
export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[];
export const attendanceStatusLabel = (v: string) => ATTENDANCE_STATUS_LABELS[v as AttendanceStatus] ?? v;
export const isAttendanceStatus = (v: string): v is AttendanceStatus => (ATTENDANCE_STATUSES as string[]).includes(v);

export const MEMO_KIND_LABELS: Record<MemorizationKind, string> = { NEW: 'حفظ جديد', REVIEW: 'مراجعة' };
export const MEMO_KINDS = Object.keys(MEMO_KIND_LABELS) as MemorizationKind[];
export const memoKindLabel = (v: string) => MEMO_KIND_LABELS[v as MemorizationKind] ?? v;
export const isMemoKind = (v: string): v is MemorizationKind => (MEMO_KINDS as string[]).includes(v);

export const MEMO_RATING_LABELS: Record<MemorizationRating, string> = {
  EXCELLENT: 'ممتاز', GOOD: 'جيد', NEEDS_REPEAT: 'يحتاج إعادة',
};
export const MEMO_RATINGS = Object.keys(MEMO_RATING_LABELS) as MemorizationRating[];
export const memoRatingLabel = (v: string) => MEMO_RATING_LABELS[v as MemorizationRating] ?? v;
export const isMemoRating = (v: string): v is MemorizationRating => (MEMO_RATINGS as string[]).includes(v);

export const ASSESSMENT_KIND_LABELS: Record<AssessmentKind, string> = {
  MEMORIZATION_TEST: 'اختبار حفظ', TAJWEED_TEST: 'اختبار تجويد',
  RECITATION_TEST: 'اختبار تلاوة', LEVEL_EXAM: 'اختبار مستوى', OTHER: 'أخرى',
};
export const ASSESSMENT_KINDS = Object.keys(ASSESSMENT_KIND_LABELS) as AssessmentKind[];
export const assessmentKindLabel = (v: string) => ASSESSMENT_KIND_LABELS[v as AssessmentKind] ?? v;
export const isAssessmentKind = (v: string): v is AssessmentKind => (ASSESSMENT_KINDS as string[]).includes(v);

export const ASSESSMENT_RESULTS = ['PASS', 'FAIL', 'PENDING'] as AssessmentResult[];
export const isAssessmentResult = (v: string): v is AssessmentResult => (ASSESSMENT_RESULTS as string[]).includes(v);
/** يحسب النتيجة تلقائيًا من الدرجة (النجاح ≥ 50٪). */
export function computeAssessmentResult(score: number | null, maxScore: number): AssessmentResult {
  if (score === null) return 'PENDING';
  return score >= maxScore * 0.5 ? 'PASS' : 'FAIL';
}

/** يطّلع على التعليم: الإدارة والموظفون */
export function canViewEducation(a: string | Actor): boolean {
  return can(a, 'education.view');
}
export function canManageEducation(a: string | Actor): boolean {
  return can(a, 'education.manage');
}

/* ---------- الموارد البشرية ---------- */

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'على رأس العمل', ON_LEAVE: 'في إجازة', TERMINATED: 'منتهية الخدمة',
};
export const EMPLOYEE_STATUSES = Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[];
export const employeeStatusLabel = (v: string) => EMPLOYEE_STATUS_LABELS[v as EmployeeStatus] ?? v;
export const isEmployeeStatus = (v: string): v is EmployeeStatus => (EMPLOYEE_STATUSES as string[]).includes(v);

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatus, string> = { ACTIVE: 'نشط', INACTIVE: 'غير نشط' };
export const VOLUNTEER_STATUSES = Object.keys(VOLUNTEER_STATUS_LABELS) as VolunteerStatus[];
export const volunteerStatusLabel = (v: string) => VOLUNTEER_STATUS_LABELS[v as VolunteerStatus] ?? v;
export const isVolunteerStatus = (v: string): v is VolunteerStatus => (VOLUNTEER_STATUSES as string[]).includes(v);

/** الموارد البشرية حسّاسة — للإدارة والموظفين */
export function canViewHR(a: string | Actor): boolean {
  return can(a, 'hr.view');
}
export function canManageHR(a: string | Actor): boolean {
  return can(a, 'hr.manage');
}

/* ---------- المساعد الذكي ---------- */

/** يستخدم المساعد جميع أعضاء المؤسسة — لكن ضمن حدود ما يحقّ لهم رؤيته */
export function canUseAssistant(a: string | Actor): boolean {
  return can(a, 'assistant.use');
}
