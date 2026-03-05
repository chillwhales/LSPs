---
phase: 01-build-hardening-shared-configs
plan: 03
subsystem: test-config-tsconfig
tags: [vitest, tsconfig, shared-config, test-infrastructure, workspace]

requires:
  - "01-01 (@chillwhales/config with createVitestConfig and tsconfig.base.json)"
provides:
  - "All 8 vitest.config.ts as thin wrappers calling createVitestConfig()"
  - "Root vitest.config.ts with Vitest 4.x test.projects for auto-discovery"
  - "Root pnpm test runs all package tests via single vitest instance"
  - "All 8 tsconfig.json extending from @chillwhales/config/tsconfig"
affects:
  - "Phase 4 (Testing & Coverage) — test infrastructure is consolidated"
  - "All future plans — tsconfig changes go through config package only"

tech-stack:
  added:
    - "vitest (root devDependency for project-level test runner)"
  patterns:
    - "Vitest 4.x test.projects for monorepo test discovery"
    - "Package exports-based tsconfig extends resolution"

key-files:
  created:
    - vitest.config.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - packages/utils/vitest.config.ts
    - packages/lsp2/vitest.config.ts
    - packages/lsp3/vitest.config.ts
    - packages/lsp4/vitest.config.ts
    - packages/lsp6/vitest.config.ts
    - packages/lsp23/vitest.config.ts
    - packages/lsp29/vitest.config.ts
    - packages/lsp30/vitest.config.ts
    - packages/utils/tsconfig.json
    - packages/lsp2/tsconfig.json
    - packages/lsp3/tsconfig.json
    - packages/lsp4/tsconfig.json
    - packages/lsp6/tsconfig.json
    - packages/lsp23/tsconfig.json
    - packages/lsp29/tsconfig.json
    - packages/lsp30/tsconfig.json

key-decisions:
  - decision: "Used @chillwhales/config/tsconfig instead of @chillwhales/config/tsconfig.base.json"
    rationale: "TypeScript extends uses package.json exports map; the export key './tsconfig' maps to './tsconfig.base.json'"
  - decision: "Used test.projects in vitest.config.ts (not deprecated vitest.workspace.ts)"
    rationale: "Vitest 4.x deprecated workspace files in favor of test.projects in config"
  - decision: "Added vitest to root devDependencies"
    rationale: "pnpm strict isolation requires root-level binary for root vitest.config.ts execution"

patterns-established:
  - "Thin 3-line vitest.config.ts wrapper pattern for all packages"
  - "Root vitest.config.ts with glob-based project discovery"
  - "Package-name tsconfig extends via exports map"

requirements-completed:
  - "BUILD-02: Shared test config (all packages use createVitestConfig)"
  - "Tsconfig consolidation (all packages extend from config package)"

duration: ~16 minutes
completed: 2026-02-27
---

# Phase 1 Plan 3: Shared Vitest Config & Tsconfig Migration Summary

**One-liner:** All 8 vitest.config.ts replaced with thin createVitestConfig() wrappers, root vitest.config.ts with Vitest 4.x test.projects discovery, and all tsconfig.json migrated to extend from @chillwhales/config/tsconfig via exports map.

## What Was Done

### Task 1: Replace all vitest.config.ts with thin wrappers and create root vitest config

**Step 1:** Replaced all 8 packages' vitest.config.ts files (utils, lsp2, lsp3, lsp4, lsp6, lsp23, lsp29, lsp30) with identical 3-line thin wrappers:
```typescript
import { createVitestConfig } from "@chillwhales/config/vitest";

export default createVitestConfig();
```

**Step 2:** Created root `vitest.config.ts` using Vitest 4.x `test.projects` API (not deprecated `vitest.workspace.ts`):
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*", "!packages/config"],
  },
});
```

**Step 3:** Updated root `package.json`:
- Added `vitest: "catalog:"` to devDependencies
- Changed test script from `pnpm -r test` to `vitest run`

Root `pnpm test` now discovers and runs all 416 tests across all 8 packages via a single vitest instance. Per-package `pnpm test` (e.g., `cd packages/utils && pnpm test`) still works independently.

### Task 2: Migrate all tsconfig.json to extend from config package

Updated the `"extends"` field in all 8 packages' tsconfig.json from:
```json
"extends": "../../tsconfig.base.json"
```
to:
```json
"extends": "@chillwhales/config/tsconfig"
```

All other fields (compilerOptions, include, exclude) remain unchanged.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Replace vitest configs with thin wrappers + root project discovery | `26aa15e` | vitest.config.ts, package.json, 8 packages/*/vitest.config.ts |
| 2 | Migrate all tsconfig.json to extend from config package | `3fb3870` | 8 packages/*/tsconfig.json |

## Decisions Made

1. **Used `@chillwhales/config/tsconfig` instead of `@chillwhales/config/tsconfig.base.json`** — The plan specified `tsconfig.base.json` in the extends path, but TypeScript 5's `extends` resolution uses the package.json `exports` map when it detects one. The config package's exports has `"./tsconfig": "./tsconfig.base.json"`, so the correct extends path is `@chillwhales/config/tsconfig` (matching the export key). Using `tsconfig.base.json` directly fails because the exports map blocks direct file access. The intent (extending from config package) is fully honored.

2. **Used `test.projects` (Vitest 4.x API)** — The CONTEXT.md mentioned `vitest.workspace.ts` but RESEARCH.md correctly noted this is deprecated in Vitest 4.x. Used `test.projects` in `vitest.config.ts` as the correct modern approach.

3. **Added vitest to root devDependencies with `catalog:` reference** — Required because pnpm strict isolation means child package deps are not resolvable from root. Without root-level vitest, `vitest run` at root fails with missing binary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig extends path resolution via exports map**

- **Found during:** Task 2
- **Issue:** Plan specified `@chillwhales/config/tsconfig.base.json` as the extends path, but TypeScript's extends resolution uses the package.json `exports` map when present. The config package has `"./tsconfig": "./tsconfig.base.json"` in exports, so `@chillwhales/config/tsconfig.base.json` (which would match export key `./tsconfig.base.json`) doesn't exist in exports. TypeScript errors with "File not found."
- **Fix:** Used `@chillwhales/config/tsconfig` instead, matching the actual exports key `./tsconfig`. This correctly resolves to `./tsconfig.base.json` via the exports map.
- **Files modified:** All 8 packages/*/tsconfig.json
- **Commit:** `3fb3870`

## Verification Results

All verification checks passed:
1. All 8 vitest.config.ts are 3-line thin wrappers (createVitestConfig count: 2 per file)
2. Root vitest.config.ts uses `test.projects` (Vitest 4.x API)
3. No deprecated vitest.workspace.ts file exists
4. Root `pnpm test` runs all 416 tests (406 pass, 10 fail — pre-existing lsp29 failures)
5. Per-package `pnpm test` works (verified with packages/utils — 31/31 pass)
6. All 8 tsconfig.json extend from `@chillwhales/config/tsconfig`
7. No relative `../../tsconfig.base.json` paths remain
8. `pnpm build` succeeds for all 9 packages

**Note:** 10 pre-existing test failures in @chillwhales/lsp29 (Zod schema validation — `images` field required but missing in test fixtures). These failures exist on the current branch independent of any changes made in this plan.

## Next Phase Readiness

**Phase 1 complete** — All 3 plans (01-01 config package, 01-02 build config, 01-03 vitest+tsconfig) are done. The @chillwhales/config package is now the single source of truth for build, test, and TypeScript configuration.

**Ready for Phase 2** (Code Quality — Biome & Git Hooks): Build and test infrastructure is consolidated, providing a clean foundation for linting/formatting.

**No blockers identified.**

## Self-Check: PASSED
