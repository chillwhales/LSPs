---
phase: 05-ci-pipeline
plan: 01
subsystem: infra
tags: [github-actions, ci, publint, attw, codecov, pnpm, monorepo]

requires:
  - phase: 04-testing-coverage
    provides: vitest coverage config with v8 provider, lcov reporter, 80% thresholds
  - phase: 03-dependency-hygiene
    provides: sherif, knip, madge scripts in root package.json
  - phase: 02-code-quality
    provides: biome config, simple-git-hooks, commitlint
  - phase: 01-build-hardening
    provides: unbuild with failOnWarn, pnpm catalog, shared tsconfig

provides:
  - GitHub Actions CI workflow with 4-layer parallel pipeline (11 jobs)
  - publint and @arethetypeswrong/cli as devDependencies
  - typecheck root script for tsc --noEmit across packages
  - codecov.yml with patch coverage 80% and project threshold 2%
  - engines.node updated to >=22

affects: [06-package-metadata, 07-release-automation]

tech-stack:
  added: [publint, "@arethetypeswrong/cli"]
  patterns: [4-layer-ci-pipeline, build-artifact-passing, pnpm-store-caching, concurrency-cancellation]

key-files:
  created:
    - .github/workflows/ci.yml
    - codecov.yml
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "typecheck script filters both root workspace and config package — root has no tsconfig, config has no src"
  - "publint --strict and attw --pack used in CI despite current warnings — Phase 6 fixes package metadata"
  - "codecov.yml in repo root with patch coverage 80%, project threshold 2%, ignore packages/config"
  - "Build artifacts passed via upload/download-artifact for Layer 3 jobs (publint, attw, tests)"
  - "Coverage uploaded from Node 24 only via conditional artifact upload in test matrix"

patterns-established:
  - "CI preamble pattern: checkout -> pnpm/action-setup -> setup-node (cache: pnpm) -> install --frozen-lockfile"
  - "4-layer pipeline: install -> validate+build -> verify+test -> report"
  - "Build artifact passing: upload packages/*/dist, download at repo root with path: ."

requirements-completed: [CI-01, CI-02, CI-03]

duration: 4min
completed: 2026-02-28
---

# Phase 5 Plan 1: CI Pipeline Workflow Summary

**GitHub Actions 4-layer CI pipeline with 11 parallel jobs — typecheck, biome, sherif, knip, madge, build, publint+attw verification, Node 22+24 test matrix, and Codecov upload**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T17:00:11Z
- **Completed:** 2026-02-28T17:04:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Complete GitHub Actions CI workflow with 4-layer parallel pipeline (install -> 6 validate/build -> 3 verify/test -> codecov)
- publint and @arethetypeswrong/cli installed for package export/type validation in CI
- typecheck root script added for recursive tsc --noEmit across workspace packages
- codecov.yml configuration with patch coverage enforcement at 80%
- engines.node updated from >=18 to >=22 to reflect CI test matrix

## Task Commits

Each task was committed atomically:

1. **Task 1: Install publint/attw, add typecheck script, update engines** - `5004d0e` (chore)
2. **Task 2: Create GitHub Actions CI workflow** - `dc8de8b` (feat)

## Files Created/Modified
- `.github/workflows/ci.yml` - Complete 4-layer CI pipeline with 11 jobs
- `codecov.yml` - Codecov configuration: patch 80%, project threshold 2%, ignore config package
- `package.json` - Added typecheck script, publint/attw devDeps, engines >=22
- `pnpm-lock.yaml` - Lockfile updated with publint and attw dependencies

## Decisions Made
- typecheck script uses `--filter './packages/*' --filter '!@chillwhales/config'` to exclude both root workspace (no tsconfig) and config package (no src to typecheck)
- publint `--strict` and attw `--pack .` used in CI — they currently report warnings about type ambiguity (CJS types for ESM imports) that Phase 6 will resolve by splitting types conditions
- codecov.yml placed in repo root per user decision, with patch coverage at 80% and project threshold allowing 2% dip
- Build artifacts passed between jobs via upload-artifact/download-artifact (packages/*/dist)
- Coverage artifact uploaded conditionally from Node 24 test run only, downloaded into coverage/ dir for codecov job

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed typecheck script filter to exclude root workspace**
- **Found during:** Task 1 (typecheck script setup)
- **Issue:** `pnpm -r --filter '!@chillwhales/config' exec tsc` includes the root workspace which has no tsconfig.json, causing "tsc not found" error
- **Fix:** Added `--filter './packages/*'` to scope execution to packages directory only
- **Files modified:** package.json
- **Verification:** `pnpm typecheck` runs successfully
- **Committed in:** `5004d0e` (part of Task 1 commit)

**2. [Rule 2 - Missing Critical] Added codecov.yml configuration**
- **Found during:** Task 2 (CI workflow creation)
- **Issue:** User decided codecov.yml should be version-controlled in repo root (CONTEXT.md), but plan only mentioned it in CI workflow — no task created the file
- **Fix:** Created codecov.yml with patch coverage 80%, project threshold 2%, packages/config ignored
- **Files modified:** codecov.yml
- **Verification:** File exists with correct coverage thresholds
- **Committed in:** `dc8de8b` (part of Task 2 commit)

**3. [Rule 1 - Bug] Fixed coverage artifact download path in codecov job**
- **Found during:** Task 2 (CI workflow creation)
- **Issue:** download-artifact without path would place lcov.info in workspace root, but codecov-action references `./coverage/lcov.info`
- **Fix:** Added `path: coverage` to download-artifact step so file lands at `coverage/lcov.info`
- **Files modified:** .github/workflows/ci.yml
- **Verification:** Path alignment verified in workflow YAML
- **Committed in:** `dc8de8b` (part of Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. CODECOV_TOKEN must be added as a GitHub repository secret before Codecov uploads will succeed, but this is standard GitHub Actions setup documented in codecov-action.

## Next Phase Readiness
- CI workflow ready — will validate all PRs automatically once pushed to GitHub
- publint and attw will report warnings until Phase 6 fixes package metadata (type field, split types conditions)
- Ready for 05-02 (if exists) or Phase 6 (Package Metadata & Publish Readiness)

## Self-Check: PASSED

All files verified on disk. All commit hashes found in git log.

---
*Phase: 05-ci-pipeline*
*Completed: 2026-02-28*
