import { useId, type CSSProperties } from 'react';

/**
 * Official supplied transparent artwork, without its empty canvas margins.
 * Alpha masking preserves the artwork and inherits the surrounding brand color.
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
  const maskId = `masra-logo-${useId()}`;
  const h = size * (50 / 58);
  return (
    <svg
      width={size}
      height={h}
      viewBox="21 25 58 50"
      fill="currentColor"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <mask id={maskId} x="21" y="25" width="58" height="50" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
          <image href="/masra-logo.png" width="101" height="101" />
        </mask>
      </defs>
      <rect x="21" y="25" width="58" height="50" mask={`url(#${maskId})`} />
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
