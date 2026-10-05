/* ============================================================
   نظام العملات — التسعير الأساسي بالريال السعودي، ويُحوَّل للعرض.
   حدّث أسعار الصرف (rate) حسب السوق من هذا المكان فقط.
   rate = كم وحدة من هذه العملة تعادل ١ ريال سعودي.
   ============================================================ */

export type CurrencyCode = 'SAR' | 'USD';

export interface CurrencyDef {
  code: CurrencyCode;
  rate: number;   // مقابل ١ ر.س
  step: number;   // تقريب المبلغ لأقرب مضاعف (لعرض أنيق)
  symbolAr: string;
  symbolEn: string;
  nameAr: string;
  nameEn: string;
}

export const BASE_CURRENCY: CurrencyCode = 'SAR';
export const DEFAULT_CURRENCY: CurrencyCode = 'SAR';
export const CURRENCY_COOKIE = 'midad_currency';

export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  // الريال السعودي — العملة الأساس
  SAR: { code: 'SAR', rate: 1, step: 1, symbolAr: 'ر.س', symbolEn: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal' },
  // الدولار الأمريكي — الربط الثابت ٣٫٧٥ ر.س للدولار
  USD: { code: 'USD', rate: 1 / 3.75, step: 1, symbolAr: '$', symbolEn: '$', nameAr: 'دولار أمريكي', nameEn: 'US Dollar' },
};

export const CURRENCY_ORDER: CurrencyCode[] = ['SAR', 'USD'];

export function isCurrency(v: string | undefined | null): v is CurrencyCode {
  // كوكي قديم بقيمة SYP (أُزيلت) يعود تلقائيًا إلى الريال
  return v === 'SAR' || v === 'USD';
}

/** يحوّل مبلغًا بالريال إلى العملة المطلوبة ويقرّبه لعرض أنيق. */
export function convertRounded(amountSar: number, code: CurrencyCode): number {
  const def = CURRENCIES[code];
  const raw = amountSar * def.rate;
  return Math.round(raw / def.step) * def.step;
}

/** رمز العملة حسب اللغة (ر.س / $). */
export function currencySymbol(code: CurrencyCode, locale = 'ar'): string {
  const def = CURRENCIES[code];
  return locale === 'en' ? def.symbolEn : def.symbolAr;
}

/** اسم العملة الكامل حسب اللغة. */
export function currencyName(code: CurrencyCode, locale = 'ar'): string {
  const def = CURRENCIES[code];
  return locale === 'en' ? def.nameEn : def.nameAr;
}

/** تنسيق رقم بأرقام لاتينية وفواصل آلاف. */
export function formatAmount(n: number, locale = 'ar'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-u-nu-latn', { maximumFractionDigits: 0 }).format(n);
}

/** مبلغ كامل مع الرمز: «١٤٩ ر.س» أو «$ 40». */
export function formatMoney(amountSar: number, code: CurrencyCode, locale = 'ar'): string {
  const num = formatAmount(convertRounded(amountSar, code), locale);
  const sym = currencySymbol(code, locale);
  return locale === 'en' ? `${sym} ${num}` : `${num} ${sym}`;
}
