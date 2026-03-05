---
phase: 03-dependency-monorepo-hygiene
verified: 2026-02-27T19:10:00Z
status: passed
score: 7/7 must-haves verified
gaps: []
human_verification:
  - test: "Run `npm install` in repo root (not via pnpm)"
    expected: "Fails with 'Use pnpm install for installation in this project' error"
    why_human: "Requires running npm binary directly — only-allow detects via npm_config_user_agent set by real package managers"
  - test: "Run `pnpm deps:graph` and open deps-graph.svg"
    expected: "Generates a visual SVG showing package dependency relationships"
    why_human: "Visual output — programmatic verification can't assess graph correctness"
---

# Phase 3: Dependency & Monorepo Hygiene Verification Report

**Phase Goal:** Structural problems — circular dependencies, unused code, inconsistent package metadata, and wrong package managers — are caught automatically.
**Verified:** 2026-02-27T19:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | knip, sherif, madge, and only-allow are installed as root devDependencies | ✓ VERIFIED | `pnpm ls` confirms knip@5.85.0, sherif@1.10.0, madge@8.0.0, only-allow@1.2.2 |
| 2 | `pnpm knip` exits 0 — no unused dependencies, exports, files, or types | ✓ VERIFIED | Ran `pnpm knip` — exit 0, no output (clean) |
| 3 | `pnpm sherif` exits 0 — monorepo package consistency validated | ✓ VERIFIED | Ran `pnpm sherif` — exit 0, "✓ No issues found" |
| 4 | `pnpm madge` exits 0 — no inter-package circular dependencies | ✓ VERIFIED | Ran `pnpm madge` — exit 0, "✔ No inter-package circular dependencies (2 intra-package cycles ignored)" |
| 5 | `pnpm check` exits 0 — all hygiene tools pass clean in sequence | ✓ VERIFIED | Ran `pnpm check` — biome (114 files), sherif, knip, madge all pass sequentially, exit 0 |
| 6 | Running npm/yarn install in the repo root is blocked via preinstall | ✓ VERIFIED | `preinstall: "npx only-allow pnpm"` in package.json; `npx only-allow pnpm` with npm user_agent exits 1 with rejection message; with pnpm user_agent exits 0; with yarn user_agent exits 1 |
| 7 | All violations were fixed in code (not suppressed in central config) | ✓ VERIFIED | `grep -r "knip:ignore"` across packages/ finds 0 results; knip.json has no `ignore` arrays; sherif config has no ignore rules |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Restructured scripts with preinstall, tool scripts, umbrella check, sherif config | ✓ VERIFIED | 12 scripts including check umbrella, preinstall hook, sherif.failOnWarnings: true |
| `knip.json` | Workspace-aware knip configuration | ✓ VERIFIED | 17 lines, 3 workspace configs (root, packages/*, packages/config), includeEntryExports on config |
| `scripts/check-circular.mjs` | Inter-package circular dependency filtering script | ✓ VERIFIED | 81 lines, uses spawnSync with --circular --json flags, filters by package name extraction, proper exit codes |
| `.gitignore` | deps-graph.svg excluded | ✓ VERIFIED | `deps-graph.svg` present on line 6 |
| `pnpm-lock.yaml` | Updated with new dependencies | ✓ VERIFIED | All 4 tools resolvable via pnpm ls |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `knip.json` | `pnpm-workspace.yaml` | knip workspace auto-detection | ✓ WIRED | knip.json workspaces `packages/*` matches pnpm-workspace.yaml `packages: - packages/*`; `pnpm knip` runs successfully |
| `scripts/check-circular.mjs` | madge | spawnSync with --circular --json flags | ✓ WIRED | Line 13: `spawnSync("npx", ["madge", "--circular", "--json", ...])` — parses JSON output, filters inter-package cycles |
| `package.json preinstall` | only-allow | `npx only-allow pnpm` lifecycle hook | ✓ WIRED | preinstall script present; only-allow correctly rejects npm/yarn user agents, accepts pnpm |
| `pnpm check` | all hygiene tools | sequential script execution | ✓ WIRED | `"check": "pnpm check:lint && pnpm sherif && pnpm knip && pnpm madge"` — all 4 run and pass |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **BUILD-05**: Circular dependencies between packages are detected and reported | ✓ SATISFIED | `pnpm madge` runs `scripts/check-circular.mjs` which invokes madge with `--circular --json`, filters to inter-package cycles, exits non-zero when found. Currently exits 0 (clean). |
| **QUAL-04**: Unused dependencies and exports are detected via knip | ✓ SATISFIED | `pnpm knip` runs workspace-aware knip with 3 workspace configs. Currently exits 0 (clean). Would detect and report any unused deps/exports/files/types. |
| **QUAL-05**: Monorepo package consistency is validated via sherif | ✓ SATISFIED | `pnpm sherif` runs with `failOnWarnings: true`. Currently exits 0. Would catch version mismatches, empty deps, types in wrong section, unordered deps. |
| **QUAL-06**: Only pnpm can be used as package manager (enforced via preinstall) | ✓ SATISFIED | `preinstall: "npx only-allow pnpm"` hook in package.json. Verified: rejects npm user_agent (exit 1), rejects yarn user_agent (exit 1), accepts pnpm user_agent (exit 0). |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | None found |

No TODO, FIXME, HACK, placeholder, empty return, or stub patterns found in any phase-modified files.

### Human Verification Required

### 1. npm install Rejection
**Test:** Run `npm install` in repo root (using actual npm binary, not pnpm)
**Expected:** Installation fails with "Use pnpm install for installation in this project" error box
**Why human:** only-allow uses `npm_config_user_agent` env var set by real package managers — requires running actual npm binary

### 2. Visual Dependency Graph
**Test:** Run `pnpm deps:graph` and open the generated `deps-graph.svg`
**Expected:** SVG file shows package dependency relationships between workspace packages
**Why human:** Visual output correctness can't be verified programmatically

### Gaps Summary

No gaps found. All 7 observable truths verified. All 4 requirement IDs (BUILD-05, QUAL-04, QUAL-05, QUAL-06) satisfied with working tooling. All artifacts exist, are substantive, and are properly wired. The umbrella `pnpm check` command runs all 4 hygiene tools sequentially and exits 0. Zero anti-patterns detected.

---

_Verified: 2026-02-27T19:10:00Z_
_Verifier: Claude (gsd-verifier)_
