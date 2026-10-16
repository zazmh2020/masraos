import type { Locale } from './i18n/config';

/** Product identity only; organization names and technical identifiers stay independent. */
export const BRAND = {
  ar: {
    name: 'مَسرى',
    corporate: 'مَسرى للأنظمة الرقمية',
    positioning: 'منصة تشغيل رقمية لمراكز تعليم القرآن',
    description: 'مَسرى ينظّم عمل مراكز تعليم القرآن: الطلاب والحلقات والحضور وسجل الحفظ والمراجعة، بصلاحيات واضحة لكل دور.',
  },
  en: {
    name: 'MASRA',
    corporate: 'MASRA Digital Systems',
    positioning: 'An Arabic-first digital operating platform for Quran education centers.',
    description: 'MASRA organizes Quran education centers: students, halaqat, attendance, memorization and revision, with clear permissions for each role.',
  },
} as const satisfies Record<Locale, { name: string; corporate: string; positioning: string; description: string }>;
