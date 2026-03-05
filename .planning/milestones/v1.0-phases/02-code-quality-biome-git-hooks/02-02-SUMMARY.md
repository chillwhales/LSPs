---
phase: 02-code-quality-biome-git-hooks
plan: 02
subsystem: code-quality
tags: [git-hooks, commitlint, simple-git-hooks, conventional-commits, pre-commit]

# Dependency graph
requires:
  - phase: 02-code-quality-biome-git-hooks
    plan: 01
    provides: "Biome v2 configuration and formatting rules"
provides:
  - "Pre-commit hook auto-formatting via Biome --write --staged"
  - "Commit-msg hook enforcing conventional commit format"
  - "Auto-install hooks on pnpm install via prepare script"
affects: [05-ci-pipeline]

# Tech tracking
tech-stack:
  added: ["simple-git-hooks ^2.13.1", "@commitlint/cli ^20.4.2", "@commitlint/config-conventional ^20.4.2"]
  patterns: ["Git hooks via simple-git-hooks with package.json config", "Conventional commits enforced via commitlint"]

key-files:
  created: ["commitlint.config.mjs"]
  modified: ["package.json", "pnpm-lock.yaml"]

key-decisions:
  - "simple-git-hooks over husky — simpler config, package.json-based, zero boilerplate"
  - "commitlint.config.mjs (not .js) — root package.json lacks type:module so CJS default breaks ESM export"
  - "pnpm.onlyBuiltDependencies for simple-git-hooks — required by pnpm v10 strict build policy"

patterns-established:
  - "All commits must use conventional format: type(scope): description"
  - "Pre-commit auto-formats staged files with Biome — developers never commit unformatted code"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 2 Plan 2: Git Hooks & Commitlint Summary

**Pre-commit (Biome auto-format) and commit-msg (conventional commits via commitlint) hooks installed with simple-git-hooks — auto-installs on pnpm install**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T14:56:19Z
- **Completed:** 2026-02-27T14:59:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed simple-git-hooks with pre-commit hook running `biome check --write --staged` for auto-formatting
- Installed commitlint with conventional commits preset enforcing `type(scope): description` format
- Added `prepare` script to auto-install hooks on `pnpm install` (fresh clones included)
- Verified end-to-end: bad commits rejected, formatting auto-fixed, lint errors blocked

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure simple-git-hooks and commitlint** - `8e1ce1a` (chore)
2. **Task 2: Verify hook enforcement end-to-end** - No commit (verification-only task, all test artifacts cleaned up)

## Files Created/Modified
- `commitlint.config.mjs` - Commitlint configuration extending @commitlint/config-conventional
- `package.json` - Added simple-git-hooks config, prepare script, commitlint/simple-git-hooks deps, pnpm.onlyBuiltDependencies
- `pnpm-lock.yaml` - Updated with 74 new packages for commitlint and simple-git-hooks

## Decisions Made
- **simple-git-hooks over husky** — Configuration lives directly in package.json, zero additional config files or setup scripts. Simpler for monorepo.
- **commitlint.config.mjs extension** — Root package.json has no `"type": "module"`, so plain `.js` would default to CJS and fail with ESM export syntax. Using `.mjs` ensures ESM parsing.
- **pnpm.onlyBuiltDependencies** — pnpm v10 blocks build scripts by default. Added simple-git-hooks to the allowlist so it can run its postinstall hook for automatic setup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pnpm.onlyBuiltDependencies for simple-git-hooks**
- **Found during:** Task 1 (Install and configure)
- **Issue:** pnpm v10 blocked simple-git-hooks build script with "Ignored build scripts" warning
- **Fix:** Added `"pnpm": { "onlyBuiltDependencies": ["simple-git-hooks"] }` to package.json
- **Files modified:** package.json
- **Verification:** `npx simple-git-hooks` runs successfully, hooks installed
- **Committed in:** 8e1ce1a

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Required for simple-git-hooks to function with pnpm v10 strict build policy. No scope creep.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete — Biome formatting + git hooks with commitlint fully operational
- Ready for Phase 3 (Dependency & Monorepo Hygiene)
- All future commits will be automatically formatted and validated

## Self-Check: PASSED

---
*Phase: 02-code-quality-biome-git-hooks*
*Completed: 2026-02-27*
