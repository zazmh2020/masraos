import type { CSSProperties } from 'react';

/**
 * علامة مسرى — مستطيل مستدير بمربع مقتطع (فراغ سالب).
 * يُلوَّن بلون النص (currentColor): بنفسجي على الفاتح، أبيض على الداكن.
 * المربع يُظهر لون الخلفية خلفه (تمامًا كالشعار الرسمي).
 */
export function LogoMark({
  size = 28,
  className = '',
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const h = Math.round(size * (54 / 46));
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 46 54"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
      role="img"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0H37A9 9 0 0 1 46 9V45A9 9 0 0 1 37 54H9A9 9 0 0 1 0 45V9A9 9 0 0 1 9 0ZM16 20H30V34H16V20Z"
      />
    </svg>
  );
}

/**
 * الشعار الكامل: العلامة + الكلمة «مسرى» (بخط Qomra) واختياريًا «MASRA».
 */
export default function Logo({
  size = 28,
  showLatin = false,
  className = '',
}: {
  size?: number;
  showLatin?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`brand-logo ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', color: 'inherit' }}
    >
      <LogoMark size={size} />
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.62 }}>مسرى</span>
        {showLatin && (
          <span style={{ fontSize: size * 0.3, letterSpacing: '0.28em', opacity: 0.7, marginTop: 3 }}>MASRA</span>
        )}
      </span>
    </span>
  );
}
