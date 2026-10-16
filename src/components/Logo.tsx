import { BRAND } from '@/lib/brand';
import { useId, type CSSProperties } from 'react';

/**
 * Official Version 2 artwork extracted directly from Asset 6.pdf vector paths.
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
  const h = size * (41.8399 / 51.575);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 51.575 41.8399"
      fill="currentColor"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <mask id={maskId} x="0" y="0" width="51.575" height="41.8399" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
          <image href="/brand/masra-mark-purple.svg" width="51.575" height="41.8399" />
        </mask>
      </defs>
      <rect x="0" y="0" width="51.575" height="41.8399" mask={`url(#${maskId})`} />
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
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.62 }}>{BRAND.ar.name}</span>
        {showLatin && (
          <span style={{ fontSize: size * 0.3, letterSpacing: '0.28em', opacity: 0.7, marginTop: 3 }}>{BRAND.en.name}</span>
        )}
      </span>
    </span>
  );
}
