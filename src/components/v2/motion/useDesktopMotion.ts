'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * يسمح بحركة التمرير المرتبطة بالموضع فقط على الشاشات ≥ 768px ودون تفضيل «تقليل الحركة».
 * على الجوال تبقى الواجهة ثابتة (أخف وأسرع).
 */
export function useDesktopMotion(): boolean {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return wide && !reduce;
}
