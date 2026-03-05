---
phase: 01-build-hardening-shared-configs
plan: 01
subsystem: build-config
tags: [config, pnpm-catalog, workspace, unbuild, vitest, tsconfig]

requires: []
provides:
  - "@chillwhales/config package with build/vitest/tsconfig presets"
  - "pnpm catalog for centralized dependency versioning"
  - "All 8 packages wired to config + catalog"
affects:
  - "01-02 (unbuild migration uses createBuildConfig)"
  - "01-03 (vitest migration uses createVitestConfig)"
  - "All future plans (catalog versions are the single source of truth)"

tech-stack:
  added: []
  patterns:
    - "Preset factory pattern: createBuildConfig(), createVitestConfig()"
    - "pnpm catalog: protocol for centralized dep versioning"
    - "workspace:* for internal cross-package references"

key-files:
  created:
    - packages/config/package.json
    - packages/config/src/build.ts
    - packages/config/src/vitest.ts
    - packages/config/tsconfig.base.json
  modified:
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - packages/utils/package.json
    - packages/lsp2/package.json
    - packages/lsp3/package.json
    - packages/lsp4/package.json
    - packages/lsp6/package.json
    - packages/lsp23/package.json
    - packages/lsp29/package.json
    - packages/lsp30/package.json

key-decisions:
  - decision: "Config package uses direct .ts exports (no build step)"
    rationale: "Both unbuild (via jiti) and vitest (via Vite) consume .ts natively"
  - decision: "Single default catalog (no named catalogs)"
    rationale: "Simplicity — all 8 shared deps meet the 2+ packages threshold"
  - decision: "tsconfig.base.json at config package root, not in src/"
    rationale: "tsconfig extends resolves via filesystem, not Node.js exports"
  - decision: "failOnWarn: true in createBuildConfig defaults"
    rationale: "Correct default — Plan 02 will fix warnings before switching packages to use this"

patterns-established:
  - "Factory function pattern for build/test config sharing"
  - "catalog: protocol eliminates version drift across packages"

requirements-completed:
  - "Shared config package exists as workspace dependency"
  - "Centralized dependency versions via pnpm catalog"

duration: ~14 minutes
completed: 2026-02-27
---

# Phase 1 Plan 1: Config Package & Catalogs Summary

**One-liner:** Private @chillwhales/config package with createBuildConfig/createVitestConfig factories plus pnpm catalog centralizing 8 shared dependency versions across all workspace packages.

## What Was Done

### Task 1: Create @chillwhales/config workspace package
Created `packages/config` with:
- **package.json** — private package, `type: "module"`, subpath exports for `./build`, `./vitest`, `./tsconfig`
- **src/build.ts** — `createBuildConfig()` factory wrapping `defineBuildConfig` with defaults: entries `src/index`, declaration `compatible`, clean `true`, failOnWarn `true`, rollup emitCJS `true`
- **src/vitest.ts** — `createVitestConfig()` factory wrapping `defineProject` with defaults: globals `true`, environment `node`
- **tsconfig.base.json** — exact copy of root tsconfig.base.json (ES2022, bundler moduleResolution, strict, declaration + maps)

### Task 2: Add pnpm catalogs and migrate all package.json files
- Added `catalog:` section to `pnpm-workspace.yaml` with 8 entries: typescript, unbuild, vitest, zod, viem, @erc725/erc725.js, @lukso/lsp6-contracts, @lukso/universalprofile-contracts
- Migrated all 8 packages (utils, lsp2, lsp3, lsp4, lsp6, lsp23, lsp29, lsp30) to use `"catalog:"` for every dependency that appears in the catalog
- Added `"@chillwhales/config": "workspace:*"` to devDependencies of all 8 packages
- Workspace protocol deps (`workspace:*`) left as-is (not cataloged)
- `pnpm install` succeeded — lockfile regenerated cleanly

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create @chillwhales/config workspace package | `1b6a4a9` | packages/config/package.json, src/build.ts, src/vitest.ts, tsconfig.base.json |
| 2 | Add pnpm catalogs and migrate all packages | `a797da3` | pnpm-workspace.yaml, pnpm-lock.yaml, 8 package.json files |

## Decisions Made

1. **Config package exports raw .ts files** — No build step needed. unbuild uses jiti and vitest uses Vite, both consume TypeScript natively. Simpler maintenance.
2. **Single default catalog** — All 8 shared deps qualify (used by 2+ packages). Named catalogs would add complexity without benefit at this scale.
3. **tsconfig.base.json at package root** — TypeScript's `extends` resolves via filesystem paths through pnpm symlinks, not via Node.js package exports. Must be at predictable path.
4. **failOnWarn: true as default** — Correct production default. Plan 02 handles the transition by fixing existing warnings before packages adopt this config.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

All 7 verification checks passed:
1. All 4 config files exist
2. Config package has `"private": true`
3. `createBuildConfig` factory exported from build.ts
4. `createVitestConfig` factory exported from vitest.ts
5. `catalog:` section present in pnpm-workspace.yaml
6. `pnpm install` succeeded with zero errors
7. No duplicate version strings for cataloged deps (all use `catalog:`)

## Next Phase Readiness

**Ready for 01-02** (unbuild migration): `createBuildConfig` is available. Plan 02 will create `build.config.ts` in each package importing from `@chillwhales/config/build`.

**Ready for 01-03** (vitest migration): `createVitestConfig` is available. Plan 03 will create `vitest.config.ts` in each package importing from `@chillwhales/config/vitest`.

**No blockers identified.**

## Self-Check: PASSED
