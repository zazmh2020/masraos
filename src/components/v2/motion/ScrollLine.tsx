'use client';

import { motion, useScroll, useSpring, type MotionStyle } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useDesktopMotion } from './useDesktopMotion';

/**
 * ScrollLine — خط «كيف يعمل» يُرسم مع تقدّم التمرير.
 * مقتبس من Skiper UI `skiper19` (Svg follow scroll) — https://skiper-ui.com
 * License: free for personal & commercial use; attribution to Skiper UI required (free version).
 * التعديلات: خط مستقيم يُرسم بمتغيّر CSS ‎--p‎ (scaleX أفقيًا / scaleY عموديًا — أخف من pathLength)، بلون الهوية، ويتجه مع RTL/LTR.
 * على الجوال ومع «تقليل الحركة» يظهر الخط كاملًا ثابتًا.
 */
export default function ScrollLine({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const enabled = useDesktopMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 40%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <ol ref={ref} className={className}>
      <motion.li aria-hidden="true" role="presentation" className="v2-steps-progress" style={enabled ? ({ '--p': progress } as unknown as MotionStyle) : undefined} />
      {children}
    </ol>
  );
}
