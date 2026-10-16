---
name: masra-ui
description: Improve an existing MASRA screen or flow while preserving its approved identity, RTL/LTR behavior and responsive accessibility, with before/after browser evidence.
---

Read DESIGN.md and the affected components/styles. Capture the current screen before proposing visual changes. Reuse tokens, Qomra typography, Tabler icons and official brand vectors; preserve tenant color overrides. Do not replace the page with a generic template or invent new brand colors.

Choose the highest-impact issue in the requested flow. Implement the smallest coherent change; include meaningful loading, empty, error and success states when affected. Use semantic controls, labels, keyboard navigation and visible focus; dialogs must restore focus. Prefer logical CSS properties and content-driven layouts.

Check Arabic RTL and English LTR at 320, 390, 768 and 1440px; expand to all nine established widths (320, 360, 390, 430, 768, 1024, 1280, 1440, 1920) when the shared shell changes. Test actual keyboard interaction and long content. Scroll-width alone cannot prove no clipping or overlap. Capture final relevant screenshots. Automated accessibility checks complement manual review; do not claim complete WCAG compliance from them.

Report the user benefit, exact changes, viewport/language states tested and remaining gaps. Preserve existing work outside the requested flow.
