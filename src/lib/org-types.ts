import type { OrgType } from '@/generated/prisma/client';
import type { OrgModule } from './modules';

/* ============================================================
   قطاعات المؤسسات (Sectors) — طبقة بيانات وصفية (Metadata)
   ------------------------------------------------------------
   الهدف: «منصّة واحدة — مؤسسات مختلفة — احتياجات مختلفة».
   نصف القطاعات السبعة هنا كتهيئة قابلة للتوسّع. القطاعات التي لها
   نوع فعلي في قاعدة البيانات (OrgType) تُفعَّل الآن؛ والبقية «قريبًا/
   مستقبلًا» تُعرض في التسويق ويُضاف نوعها لاحقًا دون إعادة بناء النواة.

   ملاحظة: لا نعدّل enum قاعدة البيانات هنا — التوسّع عبر التهيئة.
   ============================================================ */

/** حالة إتاحة القطاع على المنصّة. */
export type SectorStatus =
  | 'ACTIVE' // متاح الآن
  | 'COMING_SOON' // قريبًا
  | 'FUTURE'; // مستقبلًا

export interface SectorDef {
  /** معرّف ثابت للقطاع (مستقل عن enum قاعدة البيانات). */
  id: string;
  /** نوع المؤسسة الفعلي في قاعدة البيانات، أو null إن لم يُضَف بعد. */
  type: OrgType | null;
  labelKey: string;
  descKey: string;
  icon: string;
  status: SectorStatus;
  /** الأنظمة المقترحة افتراضيًا لهذا القطاع (تُستخدم عند إنشاء مؤسسة). */
  suggestedModules: OrgModule[];
}

/**
 * القطاعات السبعة. عدّل/أضف من هنا فقط.
 * suggestedModules تُستعمل مستقبلًا لتهيئة الأنظمة الافتراضية عند الإنشاء.
 */
export const SECTORS: SectorDef[] = [
  {
    id: 'QURAN_CENTER', type: 'MOSQUE',
    labelKey: 'sector.quran', descKey: 'sector.quran.d',
    icon: 'education/education-education', status: 'ACTIVE',
    suggestedModules: ['education', 'documents', 'knowledge', 'reports', 'assistant', 'content'],
  },
  {
    id: 'CHARITY', type: 'ASSOCIATION',
    labelKey: 'sector.charity', descKey: 'sector.charity.d',
    icon: 'finance/finance-donations', status: 'COMING_SOON',
    suggestedModules: ['operations', 'resources', 'documents', 'knowledge', 'reports', 'assistant', 'content'],
  },
  {
    id: 'HUMANITARIAN', type: null,
    labelKey: 'sector.humanitarian', descKey: 'sector.humanitarian.d',
    icon: 'people/people-beneficiaries', status: 'COMING_SOON',
    suggestedModules: ['operations', 'resources', 'documents', 'reports'],
  },
  {
    id: 'EDUCATIONAL', type: 'SCHOOL',
    labelKey: 'sector.educational', descKey: 'sector.educational.d',
    icon: 'education/education-learning', status: 'COMING_SOON',
    suggestedModules: ['education', 'documents', 'knowledge', 'reports', 'assistant', 'content'],
  },
  {
    id: 'DEVELOPMENTAL', type: null,
    labelKey: 'sector.developmental', descKey: 'sector.developmental.d',
    icon: 'operations/operations-programs', status: 'COMING_SOON',
    suggestedModules: ['operations', 'documents', 'reports'],
  },
  {
    id: 'WAQF', type: null,
    labelKey: 'sector.waqf', descKey: 'sector.waqf.d',
    icon: 'organization/organization-institution', status: 'COMING_SOON',
    suggestedModules: ['operations', 'documents', 'reports', 'content'],
  },
  {
    id: 'COMMUNITY', type: null,
    labelKey: 'sector.community', descKey: 'sector.community.d',
    icon: 'people/people-groups', status: 'FUTURE',
    suggestedModules: ['documents', 'knowledge', 'content'],
  },
];

/** القطاع المطابق لنوع مؤسسة فعلي (أول تطابق). */
export function sectorForType(type: OrgType): SectorDef | undefined {
  return SECTORS.find((s) => s.type === type);
}

/** القطاعات المتاحة الآن (لها نوع فعلي وحالتها ACTIVE). */
export function activeSectors(): SectorDef[] {
  return SECTORS.filter((s) => s.status === 'ACTIVE' && s.type !== null);
}

/** القطاعات القابلة للإنشاء فعليًا الآن (لها نوع في قاعدة البيانات). */
export function creatableSectors(): SectorDef[] {
  return SECTORS.filter((s) => s.type !== null);
}
