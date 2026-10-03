import {
  IconAdjustmentsHorizontal, IconChevronLeft, IconChevronRight, IconDots,
  IconInfoCircle, IconClock, IconX, IconLoader2, IconPencil, IconCheck,
  type TablerIcon,
} from '@tabler/icons-react';

/* أيقونات إضافية من نفس عائلة Tabler (خطّية، سماكة 2) — تُنقل إلى src/lib/icons.ts عند الدمج. */
const extra = {
  filter: IconAdjustmentsHorizontal,
  chevronStart: IconChevronRight, // RTL: «السابق» يشير يمينًا
  chevronEnd: IconChevronLeft,    // RTL: «التالي»/«الدخول» يشير يسارًا
  more: IconDots,
  info: IconInfoCircle,
  clock: IconClock,
  x: IconX,
  pending: IconLoader2,
  pencil: IconPencil,
  check: IconCheck,
} satisfies Record<string, TablerIcon>;

export type CalmIconName = keyof typeof extra;

export function CalmIcon({ name, size = 18, className }: { name: CalmIconName; size?: number; className?: string }) {
  const C = extra[name];
  return <C aria-hidden focusable={false} size={size} stroke={2} className={`app-icon ${className ?? ''}`.trim()} />;
}
