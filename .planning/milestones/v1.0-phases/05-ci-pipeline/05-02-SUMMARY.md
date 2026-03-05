---
phase: 05-ci-pipeline
plan: 02
subsystem: infra
tags: [codecov, coverage, ci-validation, knip]

requires:
  - phase: 05-ci-pipeline
    provides: GitHub Actions CI workflow with codecov.yml scaffold
  - phase: 04-testing-coverage
    provides: vitest coverage config with lcov reporter and 80% thresholds

provides:
  - Documented codecov.yml with patch coverage 80%, project threshold 2%, packages/config ignored
  - Full local validation of all CI commands (typecheck, biome, sherif, knip, madge, build, test:coverage)
  - knip ignoreBinaries fix for tsc binary false positive

affects: [06-package-metadata]

tech-stack:
  added: []
  patterns: [knip-ignoreBinaries-for-pnpm-exec-binaries]

key-files:
  created: []
  modified:
    - codecov.yml
    - knip.json

key-decisions:
  - "publint --strict and attw --pack fail due to FalseCJS type declarations — confirmed Phase 6 territory, not blocking"
  - "knip ignoreBinaries used for tsc — binary runs via pnpm -r exec in package context, not root"

patterns-established:
  - "knip ignoreBinaries for binaries used via pnpm -r exec (available in workspace packages, not root)"

requirements-completed: [CI-04]

duration: 2min
completed: 2026-02-28
---

# Phase 5 Plan 2: Codecov Configuration & CI Validation Summary

**Codecov config documented with inline comments, knip tsc false positive fixed, and all CI commands validated locally — publint/attw type issues confirmed as Phase 6 scope**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T17:07:59Z
- **Completed:** 2026-02-28T17:10:44Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- codecov.yml enriched with documentation comments explaining each configuration choice
- All 6 Layer 2 CI commands pass locally (typecheck, biome ci, sherif, knip, madge, build)
- Test:coverage produces 415 passing tests with coverage well above 80% thresholds
- coverage/lcov.info output verified for Codecov upload
- knip tsc false positive resolved via ignoreBinaries configuration
- publint --strict and attw --pack failures diagnosed as FalseCJS type declaration issues (Phase 6 fix)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create codecov.yml configuration** - `a54c0b9` (chore)
2. **Task 2: End-to-end local validation of all CI commands** - `06ae05e` (fix)

## Files Created/Modified
- `codecov.yml` - Added documentation header and inline comments to existing Codecov configuration
- `knip.json` - Added `ignoreBinaries: ["tsc"]` to root workspace config to fix false positive

## Decisions Made
- publint `--strict` fails on all 8 packages due to FalseCJS (CJS type declarations for ESM files) and missing `type` field — these are package metadata issues that Phase 6 resolves. Non-strict publint passes (warnings only). The CI workflow correctly uses `--strict` per user decision, which will start passing after Phase 6.
- attw `--pack` similarly fails due to "Masquerading as CJS" — same root cause as publint, same Phase 6 fix.
- knip reported `tsc` as unlisted binary at root level. Since the typecheck script uses `pnpm -r exec tsc --noEmit` (which executes tsc from each workspace package's context where typescript IS a devDependency), this is a false positive. Fixed with `ignoreBinaries` rather than adding typescript to root devDependencies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed knip tsc unlisted binary false positive**
- **Found during:** Task 2 (CI command validation — knip step)
- **Issue:** `pnpm knip` failed with "Unlisted binaries: tsc in package.json" because the root workspace uses tsc via `pnpm -r exec` but doesn't have typescript in root devDependencies
- **Fix:** Added `"ignoreBinaries": ["tsc"]` to root workspace config in knip.json
- **Files modified:** knip.json
- **Verification:** `pnpm knip` exits 0 with no issues
- **Committed in:** `06ae05e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary — knip would fail in CI without this fix. No scope creep.

## Issues Encountered
- publint `--strict` and attw `--pack` fail due to FalseCJS type declarations (all packages emit `.d.ts` for both CJS and ESM, but should emit `.d.mts` for ESM). This is a known, pre-existing issue documented in 05-01 summary and STATE.md. Phase 6 (Package Metadata & Publish Readiness) will fix this by splitting types conditions and adding `"type"` field to package.json files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (CI Pipeline) is complete — all 2 plans executed
- CI workflow will validate all PRs once pushed to GitHub
- publint and attw checks will fail in CI until Phase 6 resolves type declaration format
- Ready for Phase 6 (Package Metadata & Publish Readiness)

## Self-Check: PASSED

All files verified on disk. All commit hashes found in git log.

---
*Phase: 05-ci-pipeline*
*Completed: 2026-02-28*
