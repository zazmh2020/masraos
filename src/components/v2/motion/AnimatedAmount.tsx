'use client';

import { useMotionValueEvent, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * AnimatedAmount — يتحرك الرقم بنعومة عند تغيّر القيمة (مثل تبديل العملة).
 * مقتبس من Skiper UI `skiper37` (AnimatedNumber_002) — https://skiper-ui.com
 * License: free for personal & commercial use; attribution to Skiper UI required (free version).
 * التعديلات: بلا ارتداد، يبدأ من القيمة الفعلية (لا عدّ من الصفر)، وينسّق الرقم بمنسّق الموقع.
 */
export default function AnimatedAmount({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { bounce: 0, duration: 600 });
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduce) spring.jump(value); else spring.set(value); // كلاهما يطلق حدث change فيُحدَّث الرقم المعروض
  }, [value, reduce, spring]);
  useMotionValueEvent(spring, 'change', (v) => setShown(Math.round(v)));

  return <>{format(shown)}</>;
}
