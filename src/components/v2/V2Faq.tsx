'use client';

import { useId, useState } from 'react';

/**
 * أكورديون الأسئلة — فتح وإغلاق ناعم بانتقال grid-template-rows (0fr ← 1fr).
 * مقتبس من VengeanceUI `faq-accordion` (MIT — https://github.com/Ashutoshx7/VengeanceUI).
 * التعديلات: ألوان الهوية، خصائص منطقية (RTL)، aria-controls، بلا ارتداد.
 */
export default function V2Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();
  return (
    <ul className="v2-faq">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <li key={i} className={isOpen ? 'is-open' : undefined}>
            <h3>
              <button type="button" id={`${base}-q${i}`} aria-expanded={isOpen} aria-controls={`${base}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}>
                {f.q}<span className="v2-faq-mark" aria-hidden="true" />
              </button>
            </h3>
            <div id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`} className="v2-faq-panel" inert={!isOpen}>
              <div><p>{f.a}</p></div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
