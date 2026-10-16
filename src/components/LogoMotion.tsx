import type { CSSProperties } from 'react';
import { LOCKUP_GEOMETRY, type Shape } from '@/lib/brand-lockup-geometry';
import '@/styles/logo-motion.css';

/** إطار مقصوص على حدود الشعار في كل تخطيط. */
const VIEWBOX = {
  rtl: '24 22 373 56',
  ltr: '23 22 373 56',
  stacked: '63 137 294 146',
} as const;

function ShapeEl({ s, className, style }: { s: Shape; className?: string; style?: CSSProperties }) {
  if (s.t === 'path') return <path className={className} style={style} d={s.d} />;
  if (s.t === 'polygon') return <polygon className={className} style={style} points={s.points} />;
  return <rect className={className} style={style} x={s.x} y={s.y} width={s.width} height={s.height} />;
}

/**
 * شعار «مَسرى للأنظمة الرقمية» المتحرك من الملفات الرسمية:
 * تُبنى العلامة (القاعدتان ← الجناحان ← النقطة)، ثم يُكتب الاسم العربي من اليمين،
 * ثم MASRA DIGITAL SYSTEMS حرفًا حرفًا. بلا توهّج أو حلقة ضوء. اللون من currentColor.
 * layout: rtl (الرمز يمين) · ltr (الرمز يسار) · stacked (الرمز فوق الاسم).
 */
export default function LogoMotion({
  layout,
  width,
  label,
  className = '',
}: {
  layout: 'rtl' | 'ltr' | 'stacked';
  width: string;
  label: string;
  className?: string;
}) {
  const g = LOCKUP_GEOMETRY[layout];
  return (
    <svg
      className={`ml-svg ${className}`}
      viewBox={VIEWBOX[layout]}
      role="img"
      aria-label={label}
      style={{ inlineSize: width }}
    >
      <g className="ml-ar">
        {g.ar.map((s, i) => <ShapeEl key={i} s={s} />)}
      </g>
      <g className="ml-en">
        {g.en.map((s, i) => <ShapeEl key={i} s={s} className="ml-letter" style={{ '--i': i } as CSSProperties} />)}
      </g>
      <g className="ml-mark">
        <path className="ml-leg ml-leg--a" d={g.legs[0]} />
        <path className="ml-leg ml-leg--b" d={g.legs[1]} />
        <path className="ml-wings" pathLength={1} d={g.wings} />
        <circle className="ml-dot" cx={g.dot.cx} cy={g.dot.cy} r={g.dot.r} />
      </g>
    </svg>
  );
}
