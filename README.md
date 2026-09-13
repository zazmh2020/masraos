# MASRA | مسرى

Multi-tenant digital platform for organizational management.

## Setup
1. npm install
2. npm install framer-motion
3. Copy .env.example → .env, fill values
4. npx prisma generate
5. npx prisma migrate dev
6. Edit prisma/seed.ts, then: npx tsx prisma/seed.ts

## Routes (subdomain-aware)
- midad.localhost:3000                  → Marketing site
- admin.midad.localhost:3000            → Platform owner dashboard
- <slug>.midad.localhost:3000           → Organization workspace (/org/<slug>)
- <any>.midad.localhost:3000/login      → Sign in (shared page, per-host session)

## Progress
- ✅ Stage 1: Subdomain routing + STAFF role + session/tenant helpers
- ✅ Stage 2: Platform-owner admin dashboard (create orgs, list, view detail)
- ✅ Stage 3: Org workspace — guarded /org/[slug] layout, shell, dashboard
- ✅ Stage 4: User management — list, invite, change role, activate/deactivate
- ✅ Stage 5: Roles — ORG_ADMIN manages; self-edit & last-admin guards; scoped nav
- ✅ Stage 6: Isolation — session bound to subdomain; cross-tenant page → redirect,
             cross-tenant API → 404; every query scoped to the org
- ✅ Stage 7: Functional modules (all org-scoped, role-gated, cross-tenant safe)
  - ✅ Org structure — department tree, member assignment, cycle prevention, delete guards
  - ✅ Projects — status workflow, dates, department link + filter
  - ✅ Programs — category + status + target capacity, department link + filter
  - ✅ Campaigns — type + status + goal amount + dates, department link, status filter
  - ✅ Donations — amount/method/status, campaign link, received-total aggregation
  - ✅ Beneficiaries — case files (phone/id/notes), category + status, dept + program links
  - ✅ Knowledge base — articles with draft/publish (members see published only)
  - ✅ Reports — org-wide metrics + status distributions across all modules
  - ✅ Documents — S3-compatible storage (AWS S3 / R2 / MinIO), presigned upload &
       download, org-prefixed keys, 25 MB cap; needs `S3_*` in `.env` to activate
  - ✅ AI assistant (Claude) — permission-aware Q&A over org data; the context passed
       to the model contains only what the asking user's role may see; needs
       `ANTHROPIC_API_KEY` to activate (graceful banner + 503 without it)

### Roadmap phases (post-Stage 7)
- ✅ Phase 0: per-user profile + settings (name, password, prefs); S3/Claude await keys
- ✅ Phase 1: Education/Halaqat — teachers, students, halaqat, attendance roster,
     memorization log; type-aware labels (Quran terms for MOSQUE); routes under `/education/*`
- ✅ Phase 2: HR — employees, volunteers, teams under `/resources/*`, org-scoped
- ⏳ Phase 3: tasks/workflow/branches · Phase 4: rich dashboard + digital identity ·
     then launch on midad.app

### Document storage (S3-compatible)
Fill `S3_*` in `.env` (see `.env.example`). Files upload straight from the browser to
the bucket via presigned PUT and download via presigned GET (`content-disposition`),
so file bytes never pass through the Next server. Object keys are `documents/<orgId>/…`
and every route re-checks org ownership. Without config the module degrades gracefully
(banner shown, uploads disabled). `src/lib/s3.ts` is the only storage-aware module.

### AI assistant (Claude)
Set `ANTHROPIC_API_KEY` (optionally `ANTHROPIC_MODEL`, default `claude-opus-5`) in `.env`.
`src/lib/assistant-context.ts` builds a text context from the org's data, including only
the sections the asking user's role is permitted to see (e.g. members get projects but
not donations/beneficiaries/users; sensitive modules are aggregates, never raw PII). The
model is instructed to answer only from that context, so it cannot surface anything the
user couldn't see in the UI. `src/lib/anthropic.ts` is the only model-aware module.

### Workspace navigation (3-layer IA)
The org sidebar is grouped into three layers via `OrgShell` `NavEntry[]` (links + dividers):
1. **العمل المؤسسي** — لوحة التحكم, المؤسسة, العمليات, الموارد, التعليم
2. **المعرفة والذكاء** — المستندات, قاعدة المعرفة, التحليلات, الهوية الرقمية, مِداد AI
3. **النظام** — الإدارة, الإعدادات, تسجيل الخروج

The grouping sections (المؤسسة/العمليات/الموارد/التعليم/الإدارة) are **hub pages** built
from `SectionHub` — a card grid linking to the real module pages, with not-yet-built items
shown as "قريبًا". Sidebar items carry `match` prefixes so the parent section stays active
when you're deep in a module (e.g. `/projects` highlights العمليات). Labels are **type-aware**:
the التعليم hub shows Quran terms (الحلقات/الحفظ/التسميع) for `MOSQUE` orgs, general terms
(الفصول/الواجبات) otherwise — extend `labelsFor()` per `org.type` for more per-entity naming.

### Org workspace pieces
- `src/lib/org.ts`          — tenant guard (`requireOrgAccess`, `getOrgActor`)
- `src/lib/permissions.ts`  — role labels + capability helpers for every module
- `src/app/org/[slug]/*`    — dashboard, structure, projects, programs, campaigns,
                              donations, beneficiaries, knowledge, reports, users, settings
- `src/app/api/org/*`       — one route folder per module (+ `[id]`), all org-scoped

### Module template (how to add the next one, e.g. Documents)
1. Add the model to `prisma/schema.prisma` (with `organizationId` + `@@index`), then
   `npx prisma migrate dev --name add_x && npx prisma generate`.
2. Add `canView…` / `canManage…` + labels to `src/lib/permissions.ts`.
3. Add `src/app/api/org/<x>/route.ts` (+ `[id]/route.ts`) — always scope by
   `actor.organization.id`; return 404 on cross-tenant ids.
4. Add `src/app/org/[slug]/<x>/page.tsx` (guard + `redirect` if not permitted) and a
   client view component.
5. Register it in the layout `nav` and the dashboard modules grid.
