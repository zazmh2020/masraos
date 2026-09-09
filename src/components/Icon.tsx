import type { CSSProperties } from 'react';

/**
 * أيقونة من نظام أيقونات مسرى (public/icons).
 * تُلوَّن بلون النص (currentColor) عبر قناع CSS.
 * name = "category/file" مثل "navigation/navigation-home".
 */
export default function Icon({
  name,
  size = 20,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      aria-hidden="true"
      className={`app-icon ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: url,
        maskImage: url,
        ...style,
      }}
    />
  );
}
