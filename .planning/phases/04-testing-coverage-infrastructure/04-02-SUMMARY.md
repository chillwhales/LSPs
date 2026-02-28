---
phase: 04-testing-coverage-infrastructure
plan: 02
subsystem: testing
tags: [coverage, vitest, v8, thresholds, scripts]
dependencies:
  requires: [04-01]
  provides: [coverage-infrastructure, coverage-thresholds, coverage-scripts]
  affects: [05-01]
tech-stack:
  added: ["@vitest/coverage-v8"]
  patterns: [root-level-coverage-config, v8-provider, threshold-enforcement]
key-files:
  created: []
  modified:
    - vitest.config.ts
    - package.json
    - pnpm-lock.yaml
    - .gitignore
decisions:
  - "packages/config excluded from coverage (no testable logic — only defineProject/defineBuildConfig wrappers)"
metrics:
  duration: ~4min
  completed: "2026-02-27"
---

# Phase 4 Plan 02: Configure Coverage Infrastructure Summary

**One-liner:** Installed @vitest/coverage-v8 with v8 provider, 80% thresholds on all 4 metrics, text/lcov/HTML reporters, and test:coverage script — baseline is 94%+ across the board.

## What Was Done

### Task 1: Install @vitest/coverage-v8 and configure coverage in root vitest.config.ts

- Installed `@vitest/coverage-v8` as root devDependency (`^4.0.18`)
- Added coverage configuration block to `vitest.config.ts`:
  - Provider: `v8`
  - Reporters: `text`, `lcov`, `html`
  - Reports directory: `./coverage`
  - Include: `packages/*/src/**/*.ts`
  - Exclude: `**/*.test.ts`, `**/*.d.ts`, `**/index.ts`, `packages/config/**`
  - Thresholds: 80% on lines, branches, functions, statements
- Did NOT set `coverage.enabled: true` — coverage only runs with `--coverage` flag
- Did NOT add coverage config to per-package configs or `createVitestConfig()`
- Did NOT install `@vitest/coverage-v8` in individual packages

### Task 2: Wire scripts, update .gitignore, and capture baseline coverage

- Added `"test:coverage": "vitest run --coverage"` to root package.json scripts
- Added `coverage/` to `.gitignore` (after `dist/` for logical grouping of build artifacts)
- Ran full coverage baseline and captured results

## Baseline Coverage Results

| Package | Stmts | Branch | Funcs | Lines | Status |
|---------|-------|--------|-------|-------|--------|
| lsp2    | 98.82% | 96.87% | 100% | 98.80% | PASS |
| lsp23   | 96.15% | 75.00% | 100% | 95.83% | PASS (branch low but above per-file, not enforced per-package) |
| lsp29   | 97.56% | 80.00% | 100% | 97.56% | PASS |
| lsp3    | 100%  | 100%   | 100% | 100%   | PASS |
| lsp30   | 94.36% | 93.75% | 100% | 94.20% | PASS |
| lsp4    | 100%  | 100%   | 100% | 100%   | PASS |
| lsp6    | 82.45% | 82.97% | 100% | 83.33% | PASS |
| utils   | 90.90% | 100%   | 50%  | 87.50% | PASS (funcs low — 1 unused util) |
| **All** | **94.26%** | **90.90%** | **98.11%** | **94.38%** | **PASS** |

All packages pass the 80% threshold in aggregate. The thresholds are enforced globally (not per-package), so individual package dips don't trigger failure as long as the overall numbers stay above 80%.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install @vitest/coverage-v8 and configure coverage | 1c457b8 | vitest.config.ts, package.json, pnpm-lock.yaml |
| 2 | Wire scripts, update .gitignore, capture baseline | e991e25 | package.json, .gitignore |

## Verification Results

1. `pnpm test` passes (415 tests, no coverage overhead)
2. `pnpm test:coverage` produces coverage in 3 formats (text, lcov, html)
3. `pnpm test --coverage` produces identical results (flag forwarding works)
4. `coverage/` directory is gitignored (confirmed via `git check-ignore`)
5. Threshold enforcement: exit non-zero if any metric drops below 80%
6. No coverage config in per-package vitest configs or `createVitestConfig()`
7. `sherif` reports no issues
8. `knip` reports no unused dependencies

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Excluded packages/config from coverage**

- **Found during:** Task 1
- **Issue:** The coverage `include` pattern `packages/*/src/**/*.ts` picked up `packages/config/src/build.ts` and `packages/config/src/vitest.ts`, which showed 0% coverage. These files are thin configuration wrappers (`defineBuildConfig()`, `defineProject()`) with no testable logic — they're consumed by build tools, not tested directly.
- **Fix:** Added `packages/config/**` to the coverage `exclude` array
- **Files modified:** vitest.config.ts
- **Commit:** 1c457b8

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Exclude packages/config from coverage | Config package has no testable logic (only build/test config wrappers). Including it artificially lowers coverage and could cause false threshold failures. |

## Next Phase Readiness

**Phase 5 (CI Pipeline):** Ready. Coverage infrastructure is complete — `pnpm test:coverage` produces lcov.info that Codecov can consume. CI workflow can add `pnpm test:coverage` step and upload `coverage/lcov.info`.

## Self-Check: PASSED
