# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-05
**Phases:** 9 | **Plans:** 19 | **Requirements:** 34

### What Was Built
- Shared build/test/lint infrastructure eliminating all duplicated configs across 11 packages
- 4-layer CI pipeline (11 jobs) with 94%+ coverage, publint/attw validation, and PR coverage reports
- Complete release automation: changesets independent versioning, automated version PRs, npm publish, pkg-pr-new snapshots
- ESM-only publish-ready packages with LICENSE, README, complete metadata passing publint --strict
- 15 utility modules + 2 new packages (lsp1, erc725) extracted from marketplace/lsp-indexer, growing to 731 tests

### What Worked
- **Strict dependency chain in roadmap** — phases built cleanly on each other (builds → quality → hygiene → coverage → CI → metadata → release → extraction)
- **Factory function pattern** — createBuildConfig()/createVitestConfig() gave every package identical config with zero duplication
- **ESM-only decision early** — removing CJS eliminated attw CJSResolvesToESM errors and simplified builds
- **pnpm catalogs** — centralized 25 dependency versions, zero drift
- **Biome with all defaults** — zero config debate, immediate formatting of 92 files
- **Phase 7.1 insertion** — decimal phase numbering cleanly handled an urgent package rename without disrupting the roadmap

### What Was Inefficient
- **codecov.yml created then superseded** — Phase 5 created a Codecov config that was replaced by vitest-coverage-report-action; the approach should have been decided upfront
- **scripts/check-circular.mjs created then removed** — madge ran directly without the filtering script; unnecessary intermediate artifact
- **No VERIFICATION.md files created during execution** — the verifier step was skipped for all 9 phases, requiring a full audit at milestone end instead of catching issues incrementally
- **5 newer packages (lsp7, lsp8, lsp17, lsp26, up) created without READMEs** — Phase 8 extraction created packages but didn't loop back to Phase 6's README requirement

### Patterns Established
- **Thin wrapper pattern** — all package configs are 2-3 line files importing from @chillwhales/config
- **Umbrella check command** — `pnpm check` runs biome → sherif → knip → madge (fastest to slowest) for quick local validation
- **Fork guard on preview workflows** — pkg-pr-new blocked for external PRs to prevent npm token exposure
- **Decimal phase numbering** — 7.1 cleanly inserts between 7 and 8 with no renumbering
- **One catalog, no named catalogs** — all shared deps in default catalog until there's a real need for grouping

### Key Lessons
1. **Run verifiers during execution, not just at milestone end** — skipping phase verification created an audit gap that needed a full retrospective cross-reference
2. **Loop back to metadata requirements when adding packages** — Phase 8 created 5 new packages that missed Phase 6's README requirement; future extraction phases should include a metadata checklist
3. **Decide on tooling approach before creating config files** — the codecov.yml → vitest-coverage-report-action pivot was wasted effort
4. **ESM-only simplifies everything** — removing CJS output eliminated multiple categories of publint/attw errors; default to ESM-only for new packages
5. **pnpm catalogs scale well** — even at 25 entries, single-source dependency versioning prevented any version drift issues

### Cost Observations
- Sessions: ~15 across 7 days
- Notable: Phase execution averaged 2-7 minutes per plan once infrastructure was established; early phases (1-3) took longer due to research and decision-making

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 9 | 19 | Established build/test/lint/release infrastructure from scratch |

### Cumulative Quality

| Milestone | Tests | Coverage | Packages |
|-----------|-------|----------|----------|
| v1.0 | 731 | 94%+ | 11 (8 original + 3 extracted) |

### Top Lessons (Verified Across Milestones)

1. Strict dependency chains between phases prevent rework — each phase built cleanly on prior infrastructure
2. Factory function patterns for config eliminate duplication at scale — proven across build, test, and lint configs
