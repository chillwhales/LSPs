---
phase: 02-code-quality-biome-git-hooks
plan: 01
subsystem: code-quality
tags: [biome, linting, formatting, editorconfig, monorepo]

# Dependency graph
requires:
  - phase: 01-build-hardening-shared-configs
    provides: "Shared config package, build infrastructure, monorepo structure"
provides:
  - "Biome v2 linting and formatting for entire monorepo"
  - "Consistent code style: tabs, double quotes, trailing commas, 80-char width"
  - "biome check / check:fix scripts in root package.json"
  - ".git-blame-ignore-revs for formatting commit"
affects: [02-code-quality-biome-git-hooks, 05-ci-pipeline]

# Tech tracking
tech-stack:
  added: ["@biomejs/biome ^2.4.4"]
  patterns: ["Single root biome.json for monorepo", "Biome recommended rules with test-file noExplicitAny override"]

key-files:
  created: ["biome.json", ".git-blame-ignore-revs"]
  modified: [".editorconfig", "package.json", "pnpm-lock.yaml", "92 source/test/config files reformatted"]

key-decisions:
  - "All Biome formatting defaults (tabs, 80 width, double quotes, trailing commas) — zero explicit overrides"
  - "noExplicitAny disabled in test files — as any is standard pattern for type guard testing"
  - "Applied unsafe fixes (useTemplate, noUnused*, noGlobalIsNaN/IsFinite) — all genuinely safe for this codebase"

patterns-established:
  - "Single root biome.json governs all packages — no per-package configs"
  - "All lint violations are errors (zero warnings policy) — overrides only for legitimate patterns"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-02-27
---

# Phase 2 Plan 1: Install & Configure Biome Summary

**Biome v2 installed with minimal root config, entire monorepo formatted (92 files) with zero lint errors — tabs, double quotes, trailing commas across all 8 packages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-27T14:47:42Z
- **Completed:** 2026-02-27T14:52:25Z
- **Tasks:** 2
- **Files modified:** 95

## Accomplishments
- Installed Biome v2.4.4 as root workspace dev dependency with minimal configuration
- Formatted all 92 source, test, and config files across 8 packages to consistent style
- Zero Biome errors and zero warnings across entire monorepo (112 files checked)
- All 8 package builds pass without issues after formatting
- No new test failures introduced (verified with Node 24 — same 10 pre-existing lsp29 failures)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Biome and create root configuration** - `fa20711` (chore)
2. **Task 2: Format and lint entire codebase** - `bdc5cd1` (style) + `9b9bf8f` (chore: blame-ignore-revs)

## Files Created/Modified
- `biome.json` - Root Biome configuration with recommended rules, VCS integration, and test-file override
- `.editorconfig` - Updated from spaces to tabs to match Biome defaults
- `.git-blame-ignore-revs` - Tracks formatting commit for git blame exclusion
- `package.json` - Added @biomejs/biome, check/check:fix scripts
- `pnpm-lock.yaml` - Updated with Biome dependency
- `packages/*/src/**/*.ts` - All source files reformatted (tabs, double quotes, trailing commas, import sorting)
- `packages/*/src/**/*.test.ts` - All test files reformatted + unused imports/variables removed
- `packages/*/*.json` - All package.json and tsconfig.json files reformatted

## Decisions Made
- **Biome defaults for all formatting** — tabs, 80-char width, double quotes, trailing commas are all Biome v2 defaults. Zero explicit formatter overrides in biome.json keeps config minimal.
- **noExplicitAny override for test files** — `as any` is deliberately used in type guard tests (e.g., `isLsp29Asset(value as any)`) to test invalid inputs. This is a standard test pattern, not a code quality issue. Added targeted override in `overrides` section.
- **Applied unsafe Biome fixes** — `useTemplate` (string concat → template literals), `noUnusedImports`/`noUnusedVariables` (dead code removal), `noGlobalIsNaN`/`noGlobalIsFinite` (→ `Number.isNaN`/`Number.isFinite`) are all classified as "unsafe" by Biome but are genuinely safe for this codebase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Applied unsafe Biome fixes alongside safe fixes**
- **Found during:** Task 2 (Format and lint entire codebase)
- **Issue:** After safe auto-fix, 27 "unsafe" but semantically safe fixes remained (template literals, unused code, global isNaN/isFinite)
- **Fix:** Applied `--write --unsafe` to resolve all fixable violations, then added biome.json override for the 23 remaining noExplicitAny warnings in test files
- **Files modified:** 9 additional files fixed by unsafe pass, biome.json (override added)
- **Verification:** `pnpm biome check .` exits 0 with zero errors and zero warnings
- **Committed in:** bdc5cd1

---

**Total deviations:** 1 auto-fixed (Rule 2 - Missing Critical)
**Impact on plan:** Necessary to achieve the zero-errors, zero-warnings goal. All fixes are correct and improve code quality.

## Issues Encountered
- **Vitest config loading failure on Node v20:** All vitest.config.ts files fail to load on Node.js v20.20.0 with `SyntaxError: Unexpected strict mode reserved word`. This is a pre-existing Node v20 / Vitest v4 ESM compatibility issue — NOT caused by formatting. Verified by testing before and after formatting (identical error). Tests pass correctly on Node v24.14.0 with the expected 10 pre-existing lsp29 failures unchanged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Biome configuration complete and enforced — ready for Plan 02 (git hooks with simple-git-hooks + commitlint)
- Pre-commit hook (Plan 02) will use `biome check --write --staged` to enforce formatting on commits

## Self-Check: PASSED

---
*Phase: 02-code-quality-biome-git-hooks*
*Completed: 2026-02-27*
