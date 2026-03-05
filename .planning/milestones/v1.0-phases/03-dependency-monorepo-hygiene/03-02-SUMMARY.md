---
phase: 03-dependency-monorepo-hygiene
plan: 02
subsystem: infra
tags: [knip, sherif, madge, only-allow, monorepo, dependency-hygiene, pnpm]

# Dependency graph
requires:
  - phase: 03-dependency-monorepo-hygiene
    provides: knip, sherif, madge, only-allow tool installation and configuration
provides:
  - zero-violation clean slate for all four hygiene tools
  - clean knip config with no redundant entries
  - alphabetically sorted dependencies in all package.json files
affects: [05-ci-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [zero-tolerance hygiene enforcement via pnpm check umbrella]

key-files:
  created: []
  modified: [knip.json, packages/config/package.json, packages/lsp4/package.json, packages/lsp6/package.json]

key-decisions:
  - "Cleaned knip.json config hints — removed redundant entry patterns and unnecessary ignoreDependencies"
  - "All sherif violations were dependency ordering issues — fixed alphabetically in 3 package.json files"
  - "No unused dependencies, exports, files, or types found — codebase was already clean"
  - "Pre-existing lsp29 test failures (10) confirmed as non-regression — documented in STATE.md"

patterns-established:
  - "Zero-violation baseline: pnpm check exits 0 (biome + sherif + knip + madge)"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 3 Plan 02: Run Hygiene Tools & Fix Violations Summary

**All four hygiene tools pass clean — knip config cleaned of redundant entries, sherif dependency ordering fixed in 3 packages, zero unused deps/exports/files found**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T18:48:57Z
- **Completed:** 2026-02-27T18:52:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- knip exits 0 with zero output — no unused dependencies, exports, files, or types across all 9 workspace packages
- Cleaned knip.json configuration — removed 11 configuration hints (redundant entry patterns and unnecessary ignoreDependencies)
- sherif exits 0 — fixed 3 unordered-dependencies violations across lsp4, lsp6, and config packages
- madge exits 0 — no inter-package circular dependencies (2 intra-package cycles correctly ignored)
- pnpm check umbrella command passes clean (biome → sherif → knip → madge all exit 0)
- pnpm build succeeds — no regressions from changes
- pnpm test confirms same 406/416 pass rate — 10 pre-existing lsp29 failures unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Run knip and fix all violations** - `53453d7` (fix)
2. **Task 2: Run sherif and madge, verify clean slate** - `d0bd8d6` (fix)

## Files Created/Modified
- `knip.json` - Removed redundant entry patterns and unnecessary ignoreDependencies
- `packages/config/package.json` - Sorted devDependencies alphabetically
- `packages/lsp4/package.json` - Sorted dependencies alphabetically
- `packages/lsp6/package.json` - Sorted dependencies alphabetically

## Decisions Made
- Cleaned knip.json by removing auto-detected entry patterns (src/index.ts, src/build.ts, src/vitest.ts) and simple-git-hooks from ignoreDependencies — knip already detects these automatically
- All sherif violations were dependency ordering (not version mismatches or structural issues) — straightforward alphabetical sorting fixes
- only-allow pnpm enforcement verified working via npm_config_user_agent mechanism — rejects npm/yarn user agents, accepts pnpm

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — the codebase had no unused dependencies/exports/files. Only config cleanup (knip hints) and dependency ordering (sherif) needed fixing.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 complete — all dependency hygiene tools installed, configured, and passing clean
- `pnpm check` umbrella command provides single entry point for all hygiene validation
- Ready for Phase 4 (Testing & Coverage Infrastructure)
- Note: 10 pre-existing lsp29 test failures remain (Zod schema: images field required but missing in fixtures) — tracked in STATE.md

## Self-Check: PASSED

---
*Phase: 03-dependency-monorepo-hygiene*
*Completed: 2026-02-27*
