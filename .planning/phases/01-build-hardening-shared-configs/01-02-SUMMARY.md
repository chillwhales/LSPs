---
phase: 01-build-hardening-shared-configs
plan: 02
subsystem: build
tags: [unbuild, shared-config, failOnWarn, build-hardening]

requires:
  - 01-01 (config package with createBuildConfig)
provides:
  - All 8 packages use shared build config via thin wrappers
  - failOnWarn: true enforced across all packages
  - Zero-warning builds verified
affects:
  - 01-03 (shared vitest config follows same pattern)
  - Phase 5 (CI can rely on failOnWarn: true)

tech-stack:
  patterns:
    - Thin wrapper pattern for per-package build configs
    - Centralized build settings in @chillwhales/config/build

key-files:
  modified:
    - packages/utils/build.config.ts
    - packages/lsp2/build.config.ts
    - packages/lsp3/build.config.ts
    - packages/lsp4/build.config.ts
    - packages/lsp6/build.config.ts
    - packages/lsp23/build.config.ts
    - packages/lsp29/build.config.ts
    - packages/lsp30/build.config.ts

key-decisions:
  - No build warnings existed — failOnWarn: true transitioned cleanly without fixes
  - No per-package overrides needed — all 8 packages use identical config

patterns-established:
  - Per-package build.config.ts is a 3-line file (import + blank line + export)
  - All build customization lives in @chillwhales/config/build createBuildConfig()

requirements-completed:
  - BUILD-01 (shared build config)
  - BUILD-03 (failOnWarn: true)

duration: ~2 minutes
completed: 2026-02-27
---

# Phase 01 Plan 02: Shared Build Config Migration Summary

**One-liner:** Replaced all 8 packages' build.config.ts with thin 2-liner wrappers calling createBuildConfig() from @chillwhales/config/build, enabling failOnWarn: true with zero warnings.

## What Was Done

### Task 1: Replace all build.config.ts with thin wrappers
All 8 packages' build.config.ts files were replaced with identical 3-line files:
```typescript
import { createBuildConfig } from "@chillwhales/config/build";

export default createBuildConfig();
```

This removed 80 lines of duplicated build configuration (11 lines × 8 packages → 3 lines × 8 packages) and centralized all settings in the shared config package.

**Files changed:** 8 modified (all build.config.ts files)
**Net change:** -64 lines (80 duplicated → 16 thin wrappers)

### Task 2: Verify failOnWarn: true builds cleanly
Built all 8 packages individually in dependency order (leaf first, then dependents), then ran full parallel build from root. All passed with zero warnings.

**Key finding:** No warnings existed in the codebase. The previous `failOnWarn: false` was suppressing nothing — the transition to `true` was seamless.

Build order verified:
1. Leaf: utils, lsp2, lsp30 — all clean
2. Dependents: lsp3, lsp4, lsp6, lsp23, lsp29 — all clean
3. Full parallel: `pnpm build` — all clean

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Replace build.config.ts with thin wrappers | 64f8d65 | 8 files reduced to 3 lines each |
| 2 | Verify failOnWarn: true | (no changes) | Build verified clean, no fixes needed |

## Deviations from Plan

None — plan executed exactly as written. No warnings needed fixing.

## Verification Results

| Check | Result |
|-------|--------|
| `wc -l packages/*/build.config.ts` | All 3 lines each ✅ |
| `grep createBuildConfig packages/*/build.config.ts` | All 8 match ✅ |
| `grep failOnWarn packages/*/build.config.ts` | No results (in shared config only) ✅ |
| `pnpm build` exit code 0 | ✅ |
| No warnings in build output | ✅ |
| `failOnWarn: true` in shared config | ✅ |

## Next Phase Readiness

- **Blockers:** None
- **Concerns:** None
- **Ready for:** Plan 01-03 (shared vitest config) can proceed independently

## Self-Check: PASSED
