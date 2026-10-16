---
name: masra-performance
description: Measure and improve MASRA page latency, database queries or client payload without weakening authorization or tenant isolation. Use for performance investigations and optimizations.
---

Pick one route and one measurable symptom. Record a production-build baseline, dataset size, device/network assumptions and cold versus warm state. Separate server response, DB time, JavaScript, images and fonts; do not optimize by intuition alone.

Inspect the request's actual query count and result size, pagination, indexes, serialized fields, server/client boundaries and large imports. Keep changes scoped. Cache keys and lifetime must respect organization, actor permissions, locale and invalidation. Never share private data across users to improve cache hits. A new DB index or migration needs a reviewed migration plan and test data.

Repeat the same measurement after the change and give raw before/after numbers with caveats. Web Vitals field data is different from a single Lighthouse lab run. Proposed targets, not measured results: p75 LCP <= 2.5s, INP <= 200ms, CLS <= 0.1; require representative field data before claiming success. Run authorization regressions if caching or query scope changes. Do not invent percent improvements or remove controls for speed.
