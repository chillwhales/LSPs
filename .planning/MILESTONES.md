# Milestones: LSPs

## v1.0 MVP — SHIPPED 2026-03-05

**Phases:** 9 (1-8 + 7.1 inserted) | **Plans:** 19 | **Requirements:** 34/34

**Delivered:** Professional npm publishing infrastructure for the @chillwhales/* monorepo — from fragile duplicated configs to a fully automated build/test/lint/release pipeline with 11 publishable packages.

**Key Accomplishments:**
1. Centralized build/test/lint infrastructure with shared @chillwhales/config package and pnpm catalogs
2. Comprehensive 4-layer CI pipeline (11 jobs) with 94%+ coverage baseline, Biome linting, and publint/attw verification
3. Publish-ready ESM-only packages with complete metadata (LICENSE, README, exports maps, peer deps)
4. Automated release pipeline via changesets (version PRs, npm publish, changelogs) + pkg-pr-new snapshot previews
5. External code extraction growing monorepo from 8 to 11 packages (731 tests) — utils, lsp1, erc725 from marketplace/lsp-indexer

**Stats:**
- Commits: 191
- Files modified: 327
- Lines of code: 15,544 TypeScript
- Timeline: 7 days (2026-02-26 → 2026-03-05)
- Tests: 731 passing across 11 packages

**Archives:**
- [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)
- [v1.0-MILESTONE-AUDIT.md](milestones/v1.0-MILESTONE-AUDIT.md)

---
*Milestones log created: 2026-03-05*
