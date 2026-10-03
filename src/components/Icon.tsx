import { createElement, type CSSProperties } from 'react';
import { normalizeIconSize, resolveIcon } from '@/lib/icons';

/** Decorative Tabler outline icon. Icon-only controls need an aria-label on the control. */
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
  const normalizedSize = normalizeIconSize(size);
  return createElement(resolveIcon(name), {
    'aria-hidden': true,
    focusable: false,
    className: `app-icon ${className}`.trim(),
    size: normalizedSize,
    stroke: 2,
    style: { width: normalizedSize, height: normalizedSize, ...style },
  });
}

export function IconBox({
  name,
  size = 'md',
  className = '',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const iconSize = size === 'lg' ? 32 : size === 'sm' ? 16 : 24;
  return (
    <span className={`icon-box icon-box-${size} ${className}`.trim()}>
      <Icon name={name} size={iconSize} />
    </span>
  );
}
