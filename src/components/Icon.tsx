import { createElement, type CSSProperties } from 'react';
import { filledIcons, iconFillPaths, icons, normalizeIconSize, resolveIconName } from '@/lib/icons';

/**
 * أنماط الأيقونات بألوان الهوية (تنطبق على كل الأيقونات بلا استثناء):
 *  - line  (الافتراضي): خط بلون النص المحيط.
 *  - duo:   خط بالبنفسجي الأساسي فوق تعبئة بالبنفسجي الفاتح (نسخة Tabler المعبّأة أو تعبئة مصمَّمة).
 *  - solid: الشكل معبّأ بالبنفسجي الأساسي.
 * الألوان قابلة للتخصيص بـ --icon-line و--icon-fill (وتتبدّل تلقائيًا داخل .on-deep).
 */
export type IconTone = 'line' | 'duo' | 'solid';

export default function Icon({
  name,
  size = 20,
  className = '',
  style,
  tone = 'line',
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  tone?: IconTone;
}) {
  const normalizedSize = normalizeIconSize(size);
  const semantic = resolveIconName(name);
  const box = { width: normalizedSize, height: normalizedSize, ...style };
  const Filled = filledIcons[semantic];
  const fillPath = iconFillPaths[semantic];
  // طبقة التعبئة: نسخة Tabler المعبّأة، أو مسار مصمَّم على نفس الشبكة
  const fillLayer = (className: string) => Filled
    ? createElement(Filled, { 'aria-hidden': true, focusable: false, className, size: normalizedSize })
    : fillPath
      ? <svg className={className} viewBox="0 0 24 24" width={normalizedSize} height={normalizedSize} aria-hidden="true" focusable="false"><path d={fillPath} fill="currentColor" /></svg>
      : null;

  if (tone === 'line') {
    return createElement(icons[semantic], {
      'aria-hidden': true, focusable: false, className: `app-icon ${className}`.trim(),
      size: normalizedSize, stroke: 2, style: box,
    });
  }

  if (tone === 'solid') {
    if (Filled) {
      return createElement(Filled, {
        'aria-hidden': true, focusable: false, className: `app-icon icon-solid ${className}`.trim(), size: normalizedSize, style: box,
      });
    }
    // شكل مصمَّم: تعبئة مساندة قوية تحت خط أساسي — يبدو معبّأ ويحافظ على تفاصيل الرسم
    return (
      <span className={`icon-duo icon-solid-composite ${className}`.trim()} style={box} aria-hidden="true">
        {fillLayer('icon-duo-fill')}
        {createElement(icons[semantic], { 'aria-hidden': true, focusable: false, className: 'icon-duo-line', size: normalizedSize, stroke: 2 })}
      </span>
    );
  }

  return (
    <span className={`icon-duo ${Filled ? 'is-tabler-fill' : 'is-path-fill'} ${className}`.trim()} style={box} aria-hidden="true">
      {fillLayer('icon-duo-fill')}
      {createElement(icons[semantic], { 'aria-hidden': true, focusable: false, className: 'icon-duo-line', size: normalizedSize, stroke: 2 })}
    </span>
  );
}

/**
 * أيقونة داخل شكل بألوان الهوية.
 *  shape:   circle | square (مربع بحواف دائرية)
 *  variant: soft (خلفية فاتحة + أيقونة أساسية) · solid (خلفية أساسية + أيقونة بيضاء)
 *           · deep (خلفية داكنة + أيقونة فاتحة) · outline (حد مساند + أيقونة أساسية)
 */
export type IconShapeVariant = 'soft' | 'solid' | 'deep' | 'outline';

export function IconShape({
  name,
  shape = 'square',
  variant = 'soft',
  size = 'md',
  tone,
  className = '',
}: {
  name: string;
  shape?: 'circle' | 'square';
  variant?: IconShapeVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: IconTone;
  className?: string;
}) {
  const iconSize = { sm: 16, md: 20, lg: 24, xl: 32 }[size];
  const t = tone ?? (variant === 'solid' || variant === 'deep' ? 'line' : 'duo');
  return (
    <span className={`icon-shape is-${shape} is-${variant} is-${size} ${className}`.trim()} aria-hidden="true">
      <Icon name={name} size={iconSize} tone={t} />
    </span>
  );
}

export function IconBox({
  name,
  size = 'md',
  className = '',
  tone,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tone?: IconTone;
}) {
  const iconSize = size === 'lg' ? 32 : size === 'sm' ? 16 : 24;
  return (
    <span className={`icon-box icon-box-${size} ${className}`.trim()}>
      <Icon name={name} size={iconSize} tone={tone} />
    </span>
  );
}
