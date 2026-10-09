'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useDesktopMotion } from './useDesktopMotion';

/**
 * ScrollScale — تكبير هادئ للّقطة مع التمرير (0.94 ← 1).
 * فكرة مقتبسة من Skiper UI `skiper34` (Scroll images reveal 003) — https://skiper-ui.com
 * License: free for personal & commercial use; attribution to Skiper UI required (free version).
 * التعديلات: بلا lenis ولا تدوير ولا فلاتر؛ transform فقط، ويتوقف على الجوال ومع «تقليل الحركة».
 */
export default function ScrollScale({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useDesktopMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 30%'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  return (
    <motion.div ref={ref} className={className} style={enabled ? { scale, transformOrigin: '50% 0%' } : undefined}>
      {children}
    </motion.div>
  );
}
