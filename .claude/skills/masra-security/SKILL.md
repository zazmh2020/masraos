---
name: masra-security
description: Review or implement a scoped MASRA authentication, tenant isolation, permissions, privacy, or upload security change with negative tests. Use for security work, not ordinary UI edits.
---

Read the affected route and its guard (src/lib/session.ts, session-guard.ts, tenant.ts, org-guards, permissions.ts as relevant). Trace actor, organization and object ownership on the server; UI hiding is not authorization. Test no session, wrong role, other tenant and allowed actor for affected reads/writes/exports. Include private notifications and file URLs if touched.

Preserve the production dev-login restriction (src/app/api/auth/dev-login/route.ts: enabled in production only with ENABLE_DEMO_LOGIN=1) and the demo-mode write block in src/proxy.ts. For OTP/signup changes (src/lib/otp.ts, signup.ts) preserve expiry, attempt/send caps and single consumption, and keep provider calls outside DB transactions. Rate limits must work across server instances; define trusted client-address handling and test concurrency and expiry. Do not silently reinterpret existing role or authentication policies; request only unresolved decisions.

Inspect affected input validation, request origins/CSRF where cookie-authenticated writes apply, upload size/type/access, session invalidation and logging. Use synthetic records. No tokens, OTPs, personal contact details or DB URLs in reports. Privacy review covers minimum necessary data, retention/deletion and recovery; do not claim legal certification.

For findings return severity, exact path/line, reproducible evidence, impact and smallest fix. Separate confirmed defects from hypotheses. Implement authorized fixes, run focused regression tests and then applicable release checks. Never label the whole app secure based on a partial audit.
