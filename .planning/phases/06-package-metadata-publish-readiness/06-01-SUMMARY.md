---
phase: 06-package-metadata-publish-readiness
plan: 01
subsystem: packages
tags: [esm, publint, attw, package-json, license, unbuild, npm-publish]

# Dependency graph
requires:
  - phase: 01-build-hardening-shared-configs
    provides: shared build config (createBuildConfig in packages/config)
  - phase: 05-ci-pipeline
    provides: CI workflow with publint/attw validation jobs
provides:
  - ESM-only build output (no CJS files in dist/)
  - Complete package.json metadata on all 8 publishable packages
  - MIT LICENSE with prepack/postpack distribution mechanism
  - publint --strict and attw --pack passing for all packages
affects: [07-release-automation, 08-external-code-extraction]

# Tech tracking
tech-stack:
  added: []
  patterns: [ESM-only exports map, prepack LICENSE copy, attw --profile esm-only]

key-files:
  created: [LICENSE]
  modified: [packages/config/src/build.ts, .gitignore, .github/workflows/ci.yml, packages/utils/package.json, packages/lsp2/package.json, packages/lsp3/package.json, packages/lsp4/package.json, packages/lsp6/package.json, packages/lsp23/package.json, packages/lsp29/package.json, packages/lsp30/package.json]

key-decisions:
  - "Removed main field from all packages — exports map takes precedence in all modern Node versions"
  - "Used attw --profile esm-only in CI — skips CJS resolution modes for ESM-only packages"
  - "Used default condition (not import) in exports map — standard for ESM-only with type:module"

patterns-established:
  - "ESM-only exports: type:module + exports.default + no main/module fields"
  - "LICENSE distribution: prepack cp, postpack rm, gitignored in packages/*"

requirements-completed: [PKG-01, PKG-03, PKG-04]

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 6 Plan 1: Package Metadata & ESM-Only Build Summary

**ESM-only builds with complete package.json metadata, MIT LICENSE, and passing publint --strict / attw --pack across all 8 publishable packages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T19:34:50Z
- **Completed:** 2026-02-28T19:40:14Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Switched all packages to ESM-only output by removing `rollup.emitCJS` from shared build config
- Added complete metadata to all 8 package.json files: type, engines, repository, keywords, sideEffects, files, prepack/postpack
- Created MIT LICENSE at repo root with prepack/postpack copy mechanism for tarball inclusion
- Resolved FalseCJS/CJSResolvesToESM issues that were blocking publint --strict and attw --pack in CI

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LICENSE, switch to ESM-only, update all package.json metadata** - `6eb9605` (feat)
2. **Task 2: Verify publint and attw pass on all packages** - `4e15ae5` (fix)

## Files Created/Modified
- `LICENSE` - MIT license text (2026 Chillwhales contributors)
- `.gitignore` - Added packages/*/LICENSE exclusion
- `packages/config/src/build.ts` - Removed rollup.emitCJS (ESM-only)
- `.github/workflows/ci.yml` - Added --profile esm-only to attw
- `packages/utils/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp2/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp3/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp4/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp6/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp23/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp29/package.json` - Full metadata, ESM-only exports, prepack/postpack
- `packages/lsp30/package.json` - Full metadata, ESM-only exports, prepack/postpack

## Decisions Made
- Removed `main` field from all packages — with `type: module` and `exports` map, `main` is redundant and was causing attw's `cjs-resolves-to-esm` warning because it pointed to `.mjs` which CJS can't `require()`
- Used `--profile esm-only` in CI attw command — skips CJS resolution modes entirely for ESM-only packages
- Kept `default` condition in exports map rather than `import` — `default` is the standard catch-all for ESM-only packages with `type: module`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed main field causing attw CJSResolvesToESM failure**
- **Found during:** Task 2 (publint/attw verification)
- **Issue:** `"main": "./dist/index.mjs"` was causing attw to report CJSResolvesToESM — Node 16 CJS resolution path finds the `.mjs` file via main field, which can't be `require()`d
- **Fix:** Removed `main` field from all 8 packages (exports map takes precedence in Node 12+)
- **Files modified:** All 8 package.json files
- **Verification:** attw --pack exits 0 for all packages
- **Committed in:** 4e15ae5

**2. [Rule 1 - Bug] Updated CI attw command with --profile esm-only**
- **Found during:** Task 2 (publint/attw verification)
- **Issue:** Even without `main` field, `declaration: "compatible"` generates `.d.ts` which attw uses for node16-CJS resolution, still triggering cjs-resolves-to-esm
- **Fix:** Used `--profile esm-only` in CI attw command — skips CJS resolution modes entirely for ESM-only packages
- **Files modified:** .github/workflows/ci.yml
- **Verification:** All 8 packages pass attw --pack with zero errors
- **Committed in:** 4e15ae5

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for attw to pass. No scope creep — the plan's success criteria require attw --pack to exit 0.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All package metadata complete, ready for Plan 06-02 (dry-run publish verification)
- publint --strict and attw --pack passing in CI
- LICENSE infrastructure ready for first publish

## Self-Check: PASSED

All created files verified on disk. All commit hashes found in git log.

---
*Phase: 06-package-metadata-publish-readiness*
*Completed: 2026-02-28*
