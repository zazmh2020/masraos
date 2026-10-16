'use client';

import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';

/** Keyboard behavior shared by the organization and owner mobile navigation. */
export function useDrawerFocus(open: boolean, panelRef: RefObject<HTMLElement | null>, triggerRef: RefObject<HTMLButtonElement | null>, setOpen: Dispatch<SetStateAction<boolean>>, breakpoint: number) {
  useEffect(() => {
    const compact = window.matchMedia(`(max-width: ${breakpoint}px)`);
    if (!open || !compact.matches) return;
    const panel = panelRef.current;
    if (!panel) return;
    const trigger = triggerRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (!compact.matches) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'Tab') {
        const items = focusables();
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (panel.contains(document.activeElement)) (previous ?? trigger)?.focus();
    };
  }, [open, panelRef, triggerRef, setOpen, breakpoint]);
}
