---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
stopped_at: Completed 08-02-PLAN.md
last_updated: "2026-03-01T18:45:29.000Z"
last_activity: 2026-03-01 — Completed 08-02 LSP-specific extraction (lsp2, lsp4, lsp6)
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 19
  completed_plans: 18
  percent: 94
---

# Project State: LSPs

## Project Reference

**Core Value:** Every @chillwhales/* package installs cleanly, works in any JS/TS environment (ESM and CJS), and ships with correct types — consumers never think about compatibility.

**Current Focus:** Phase 8 in progress. 18/19 plans done. External code extraction from marketplace and lsp-indexer into monorepo packages.

## Current Position

**Phase:** 8 (External Code Extraction)
**Plan:** 2 of 3 in phase
**Status:** In Progress — Plan 03 remaining
**Last activity:** 2026-03-01 — Completed 08-02 LSP-specific extraction

**Progress:** [█████████░] 94%

## Phase Summary

| # | Phase | Status |
|---|-------|--------|
| 1 | Build Hardening & Shared Configs | ✅ Complete (3/3 plans) |
| 2 | Code Quality — Biome & Git Hooks | ✅ Complete (2/2 plans) |
| 3 | Dependency & Monorepo Hygiene | ✅ Complete (2/2 plans) |
| 4 | Testing & Coverage Infrastructure | ✅ Complete (2/2 plans) |
| 5 | CI Pipeline | ✅ Complete (2/2 plans) |
| 6 | Package Metadata & Publish Readiness | ✅ Complete (2/2 plans) |
| 7 | Release Automation | ✅ Complete (2/2 plans) |
| 7.1 | Rename LSP30→LSP31, LICENSE, Scripts | ✅ Complete (1/1 plans) |
| 8 | External Code Extraction | 🔄 In Progress (2/3 plans) |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans completed | 18 |
| Plans total | 19 |
| Plans with issues | 0 |
| Requirements done | 25/31 |
| Phases done | 7.1/8 |
| Phase 05 P02 | 2min | 2 tasks | 2 files |
| Phase 06 P01 | 5min | 2 tasks | 12 files |
| Phase 06 P02 | 2min | 2 tasks | 8 files |
| Phase 07 P01 | 2min | 2 tasks | 5 files |
| Phase 07 P02 | 2min | 2 tasks | 1 files |
| Phase 07.1 P01 | 7min | 2 tasks | 37 files |
| Phase 08 P02 | 7min | 2 tasks | 8 files |

## Accumulated Context

### Key Decisions
- Roadmap uses 8 phases (comprehensive depth) derived from natural requirement boundaries
- failOnWarn: true fix prioritized as Phase 1 (most dangerous existing debt per research)
- Code quality (Biome) separated from dependency hygiene (knip, sherif) — different concerns
- Commitlint grouped with Biome/hooks (Phase 2) since both use simple-git-hooks
- Coverage infrastructure (Phase 4) separated from CI (Phase 5) — coverage must work locally before CI reports it
- External extraction is Phase 8 (last) — requires stable, published packages
- Config package uses direct .ts exports (no build step) — unbuild/vitest consume TS natively
- Single default pnpm catalog (no named catalogs) — all 8 shared deps meet 2+ package threshold
- tsconfig.base.json at config package root (extends resolves via filesystem, not Node exports)
- failOnWarn: true as createBuildConfig default — Plan 02 handles transition
- No build warnings existed — failOnWarn: true transition was seamless (no fixes needed)
- All 8 packages use identical thin wrapper pattern (no per-package overrides needed)
- tsconfig extends uses @chillwhales/config/tsconfig (exports map key), not tsconfig.base.json directly
- Vitest 4.x test.projects used instead of deprecated vitest.workspace.ts
- vitest added to root devDependencies for root-level test runner (pnpm strict isolation)
- All Biome formatting defaults (tabs, 80 width, double quotes, trailing commas) — zero explicit overrides in biome.json
- noExplicitAny disabled in test files — as any is standard pattern for type guard testing
- Single root biome.json governs all packages — no per-package configs
- simple-git-hooks over husky — simpler config, package.json-based, zero boilerplate
- commitlint.config.mjs (not .js) — root lacks type:module so CJS default breaks ESM export
- pnpm.onlyBuiltDependencies for simple-git-hooks — pnpm v10 strict build policy
- check renamed to check:lint, check becomes umbrella (biome → sherif → knip → madge) — fastest to slowest
- Inter-package cycles only for madge — intra-package cycles are each package's internal concern
- deps-graph.svg gitignored — on-demand developer visualization, not committed
- knip: packages/config gets includeEntryExports (private), library packages don't (barrel exports are public API)
- knip auto-detects entry points from package.json exports — redundant entries removed from knip.json
- Zero unused deps/exports/files across all workspace packages — codebase was already clean
- packages/config excluded from coverage — no testable logic (only defineProject/defineBuildConfig wrappers)
- typecheck script filters both root workspace and config package — root has no tsconfig, config has no src
- publint --strict and attw --pack used in CI despite current warnings — Phase 6 fixes package metadata
- codecov.yml in repo root with patch coverage 80%, project threshold 2%, ignore packages/config
- Build artifacts passed via upload/download-artifact for CI Layer 3 jobs
- Coverage uploaded from Node 24 only via conditional artifact upload in test matrix
- publint --strict and attw --pack failures confirmed as FalseCJS type issues — Phase 6 scope
- knip ignoreBinaries for tsc — runs via pnpm -r exec in package context, not root
- ESM-only build output — removed rollup.emitCJS, no CJS files generated
- Removed main field from all packages — exports map takes precedence, main caused attw CJSResolvesToESM
- attw --profile esm-only in CI — skips CJS resolution modes for ESM-only packages
- @changesets/changelog-github for PR-attributed changelogs with author credit
- cancel-in-progress: false on release workflow — partial publish is dangerous, retry is recovery
- privatePackages { version: false, tag: false } to skip @chillwhales/config
- Build step before changesets/action so dist/ artifacts exist for publish
- pkg-pr-new with --compact --comment=update --packageManager=pnpm for clean PR preview comments
- Fork guard (head.repo.full_name == github.repository) blocks external PRs from snapshot access
- Reserved prefix changed from 0x0030 to 0x0031 to match LSP31 standard number
- LICENSE committed permanently in all packages instead of dynamic copy at pack time
- LSP17 prefix inlined as constant instead of adding @lukso/lsp17contractextension-contracts dep
- getData uses inline minimal ERC725Y ABI instead of importing full universalprofile-contracts ABI
- NftMetadata extends LSP4Metadata with optional token fields instead of separate type
- LSP26 noted as candidate for future @chillwhales/lsp26 package (4 functions from marketplace)

### Research Flags
- Phase 7 (Release Automation): npm scope claim, NPM_TOKEN setup, first-publish dry-run — needs phase research
- Phase 8 (External Extraction): Must audit marketplace and lsp-indexer repos — needs phase research
- ~~Pre-existing: 10 test failures in @chillwhales/lsp29~~ — RESOLVED in 04-01 (fixtures aligned with Zod schema)
- Pre-existing: Vitest v4 configs fail to load on Node v20 (ESM compat issue) — tests only run on Node v24+

### Pending TODOs
- None yet

### Known Blockers
- None yet

## Session Continuity

**Last session:** 2026-03-01T18:45:29.000Z
**Stopped at:** Completed 08-02-PLAN.md
**Resume with:** Execute 08-03-PLAN.md (lsp1, erc725, integration)

---
*State initialized: 2026-02-27*
*Last updated: 2026-03-01T18:45:29Z*
