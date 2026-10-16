# MASRA working context

Preserve the existing architecture, DESIGN.md, the official vector logo, and Arabic/English RTL/LTR behavior. Read AGENTS.md and the installed Next.js docs (node_modules/next/dist/docs) for the API being changed. Do not replace libraries or redesign unrelated screens.

The source uses Next.js App Router, React, TypeScript, Prisma 7 and PostgreSQL. package-lock.json is the version authority: use `npm ci` on a clean setup, and never let an install silently change package.json or the lockfile. Never read or print secret values to explain setup. Use synthetic accounts for tests.

Use the relevant project skill: masra-ui, masra-security, masra-performance, masra-release or masra-graphify. Do not load all skills for a routine edit. Start from `git status` and a targeted search; exclude node_modules, .next, .local, generated Prisma and lockfiles unless specifically needed. Save detailed logs to files and return failures plus a compact summary.

Tests: `npm test`; `npm run lint`; `npm run build` (build includes type validation). Database-backed checks run only against a disposable database: never the local (.env.local) or production (.env) database.

Decisions: do not silently change authentication, permissions, billing, destructive migrations or external publication. Prepare the concrete change and ask only for the missing decision. No real provider, deployment, message or production-database mutation is implied by local work.

Finish with what changed, actual validation results and material limits. During compaction retain objective, decisions, changed paths, tests and next action; discard verbose logs.
