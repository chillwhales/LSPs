# Project State: LSPs

## Project Reference

**Core Value:** Every @chillwhales/* package installs cleanly, works in any JS/TS environment (ESM and CJS), and ships with correct types — consumers never think about compatibility.

**Current Focus:** Phase 1 in progress — shared build config migrated, failOnWarn: true enforced, vitest config in progress.

## Current Position

**Phase:** 1 of 8 (Build Hardening & Shared Configs)
**Plan:** 2 of 3 in phase
**Status:** In progress
**Last activity:** 2026-02-27 — Completed 01-02-PLAN.md (Shared Build Config Migration)

**Progress:** █░░░░░░░ 1/8 phases (Phase 1: 2/3 plans)

## Phase Summary

| # | Phase | Status |
|---|-------|--------|
| 1 | Build Hardening & Shared Configs | 🔄 In Progress (2/3 plans) |
| 2 | Code Quality — Biome & Git Hooks | ⬚ Not Started |
| 3 | Dependency & Monorepo Hygiene | ⬚ Not Started |
| 4 | Testing & Coverage Infrastructure | ⬚ Not Started |
| 5 | CI Pipeline | ⬚ Not Started |
| 6 | Package Metadata & Publish Readiness | ⬚ Not Started |
| 7 | Release Automation | ⬚ Not Started |
| 8 | External Code Extraction | ⬚ Not Started |

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans completed | 2 |
| Plans with issues | 0 |
| Requirements done | 4/31 |
| Phases done | 0/8 |

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

### Research Flags
- Phase 7 (Release Automation): npm scope claim, NPM_TOKEN setup, first-publish dry-run — needs phase research
- Phase 8 (External Extraction): Must audit marketplace and lsp-indexer repos — needs phase research

### Pending TODOs
- None yet

### Known Blockers
- None yet

## Session Continuity

**Last session:** 2026-02-27 — Completed 01-02-PLAN.md (Shared Build Config Migration)
**Stopped at:** Completed 01-02-PLAN.md
**Resume file:** .planning/phases/01-build-hardening-shared-configs/01-03-PLAN.md

---
*State initialized: 2026-02-27*
*Last updated: 2026-02-27*
