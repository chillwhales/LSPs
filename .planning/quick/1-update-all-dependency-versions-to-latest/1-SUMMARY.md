---
phase: quick-1
plan: 01
subsystem: dependencies
tags: [dependencies, zod, vitest, biome, viem, monorepo]
dependency-graph:
  requires: []
  provides: [latest-deps]
  affects: [all-packages]
tech-stack:
  added: []
  patterns: [zod-4-error-api, zod-4-record-api]
key-files:
  created: []
  modified:
    - package.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - biome.json
    - packages/utils/package.json
    - packages/lsp2/src/schemas.ts
    - packages/lsp3/src/schemas.ts
    - packages/lsp4/src/schemas.ts
    - packages/lsp23/src/schemas.ts
    - packages/lsp29/src/schemas.ts
decisions:
  - "Updated zod from v3 to v4 (major version) — required migrating schema error APIs"
  - "Kept @lukso/* packages at current versions (already latest)"
metrics:
  duration: 6m35s
  completed: "2026-03-06"
  tasks: 2/2
  files_modified: 10
---

# Quick Task 1: Update All Dependency Versions to Latest — Summary

Updated all dependency versions across the monorepo to latest releases, including zod 3→4 major version migration with schema API fixes.

## Task Results

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Update all dependencies to latest versions | `c993512` | Catalog: vitest ^4.0.18, zod ^4.3.6, viem ^2.47.0. Root devDeps: biome ^2.4.6, changesets ^2.30.0, commitlint ^20.4.3, publint ^0.3.18. Package deps: @types/node ^25.3.5 |
| 2 | Verify build, lint, and tests pass | `138a17b` | Migrated 5 schema files to zod 4 API (invalid_type_error→error, required_error removed, z.record fix). Updated biome.json schema version. |

## Version Changes

### Catalog (pnpm-workspace.yaml)
| Package | Before | After |
|---------|--------|-------|
| vitest | ^4.0.17 | ^4.0.18 |
| zod | ^3.24.1 | ^4.3.6 |
| viem | ^2.0.0 | ^2.47.0 |
| typescript | ^5.9.3 | ^5.9.3 (unchanged) |
| unbuild | ^3.6.1 | ^3.6.1 (unchanged) |
| @erc725/erc725.js | ^0.28.2 | ^0.28.2 (unchanged) |
| @lukso/* | various | unchanged (all already latest) |

### Root devDependencies (package.json)
| Package | Before | After |
|---------|--------|-------|
| @biomejs/biome | ^2.4.4 | ^2.4.6 |
| @changesets/changelog-github | ^0.5.2 | ^0.6.0 |
| @changesets/cli | ^2.29.8 | ^2.30.0 |
| @commitlint/cli | ^20.4.2 | ^20.4.3 |
| @commitlint/config-conventional | ^20.4.2 | ^20.4.3 |
| publint | ^0.3.17 | ^0.3.18 |

### Package-level Dependencies
| Package | Dep | Before | After |
|---------|-----|--------|-------|
| @chillwhales/utils | @types/node | ^25.3.3 | ^25.3.5 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod 4 breaking API changes in schema error messages**
- **Found during:** Task 2 — test verification
- **Issue:** Zod 4 replaced `invalid_type_error` with `error` parameter and changed `z.record()` single-argument API semantics
- **Fix:** Updated 5 schema files: replaced `invalid_type_error` with `error`, removed deprecated `required_error`, changed `z.record(z.unknown())` to `z.record(z.string(), z.unknown())`
- **Files modified:** packages/{lsp2,lsp3,lsp4,lsp23,lsp29}/src/schemas.ts
- **Commit:** `138a17b`

**2. [Rule 1 - Bug] Biome schema version mismatch warning**
- **Found during:** Task 2 — lint check
- **Issue:** biome.json referenced schema 2.4.4 but biome CLI was updated to 2.4.6
- **Fix:** Updated `$schema` URL in biome.json to 2.4.6
- **Files modified:** biome.json
- **Commit:** `138a17b`

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm build` | PASS (16/16 packages) |
| `pnpm check:lint` | PASS (202 files, 0 fixes) |
| `pnpm test` | PASS (825/825 tests, 50 files) |
| `pnpm sherif` | PASS (no issues) |
| `pnpm knip` | PASS (no unused code) |
| `pnpm typecheck` | PASS (all packages) |

## Self-Check: PASSED

- All modified files exist on disk
- Both task commits verified: `c993512`, `138a17b`
- Summary file created at `.planning/quick/1-update-all-dependency-versions-to-latest/1-SUMMARY.md`
