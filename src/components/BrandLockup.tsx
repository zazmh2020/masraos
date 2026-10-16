import type { CSSProperties } from 'react';

const RATIO = 373 / 56; // نسبة الإطار المقصوص للشعار الأفقي

/**
 * الشعار الأفقي الرسمي: الرمز + «مَسرى للأنظمة الرقمية» + MASRA DIGITAL SYSTEMS.
 * rtl: الرمز على اليمين (العربية)؛ ltr: الرمز على اليسار (الإنجليزية).
 * يُرسم كقناع فيرث لون النص المحيط (currentColor) — اللون من رموز الهوية لا من الملف.
 */
export default function BrandLockup({
  dir,
  height = 36,
  label,
  className = '',
  style,
}: {
  dir: 'rtl' | 'ltr';
  height?: number;
  label: string;
  className?: string;
  style?: CSSProperties;
}) {
  const mask = `url(/brand/masra-lockup-${dir}-ink.svg) center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label={label}
      className={`brand-lockup ${className}`}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        blockSize: height,
        inlineSize: height * RATIO,
        maxInlineSize: '100%',
        backgroundColor: 'currentColor',
        mask,
        WebkitMask: mask,
        ...style,
      }}
    />
  );
}
