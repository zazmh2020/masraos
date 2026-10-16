---
name: masra-release
description: Verify a MASRA change before review or release using scoped tests, lint, build and appropriate local browser or database checks; report actual evidence and remaining blockers.
---

Inspect git status/diff and relevant approvals. Preserve unrelated edits. Run focused behavioral tests for the change; then `npm test`, `npm run lint` and `npm run build` for a code release. Build already checks types: do not repeat standalone type checks without a reason. Stop rerunning successful checks until code or assumptions change.

For UI changes inspect the running flow and screenshots; use masra-ui's affected states. Run any database-backed check only against a disposable test database, never the local (.env.local) or production (.env) database. New external services need a test environment before claiming end-to-end success.

Check staged files for accidental runtime data: .env*, .local, backups, generated files and credentials. Keep package-lock.json and migrations reviewed; never let a stray install change versions silently. CI success is necessary but does not certify tenant isolation, privacy or production readiness. Verify a backup restore and rollback plan before an actual production deployment; do not deploy merely because this skill was invoked.

Return problem/result, changed files, exact checks with pass/fail/not run, and limits. A PR describes final behavior and validation without conversational history. Never fabricate passing checks or silently suppress failures.
