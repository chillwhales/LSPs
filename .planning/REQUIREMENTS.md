# Requirements: LSPs

**Defined:** 2026-02-27
**Core Value:** Every @chillwhales/* package installs cleanly, works in any JS/TS environment (ESM and CJS), and ships with correct types — consumers never think about compatibility.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Build & Shared Configs

- [x] **BUILD-01**: All packages share a single build configuration source, eliminating duplicate build.config.ts files
- [x] **BUILD-02**: All packages share a single test configuration source, eliminating duplicate vitest.config.ts files
- [x] **BUILD-03**: Build process fails on warnings (failOnWarn: true) to surface hidden issues
- [x] **BUILD-04**: Dependency versions are centralized via pnpm catalogs in pnpm-workspace.yaml
- [x] **BUILD-05**: Circular dependencies between packages are detected and reported

### Code Quality

- [x] **QUAL-01**: All packages are linted by Biome from a single root configuration
- [x] **QUAL-02**: All packages are formatted by Biome from a single root configuration
- [x] **QUAL-03**: Pre-commit hook runs biome check before every commit
- [x] **QUAL-04**: Unused dependencies and exports are detected via knip
- [x] **QUAL-05**: Monorepo package consistency is validated via sherif
- [x] **QUAL-06**: Only pnpm can be used as package manager (enforced via preinstall)
- [x] **QUAL-07**: All commits follow conventional commit format, enforced via commitlint

### CI Pipeline

- [ ] **CI-01**: Every PR runs install, typecheck, lint, format check, build, and test
- [ ] **CI-02**: In-progress CI runs are cancelled when new commits are pushed
- [ ] **CI-03**: Package exports and types are validated via publint and attw before merge
- [ ] **CI-04**: Test coverage is reported and uploaded to Codecov on every PR

### Release Automation

- [ ] **REL-01**: Changesets is configured for independent versioning of all packages
- [ ] **REL-02**: Changelogs are auto-generated per package with GitHub PR attribution
- [ ] **REL-03**: Scoped packages are configured for public npm access
- [ ] **REL-04**: After a PR merges to main, a version PR is automatically created or updated
- [ ] **REL-05**: When the version PR merges, changed packages are automatically published to npm
- [ ] **REL-06**: PR-based snapshot releases are available via pkg-pr-new
- [ ] **REL-07**: GitHub Releases are created when packages are published

### Package Metadata

- [ ] **PKG-01**: LICENSE file exists at root and is included in each published package
- [ ] **PKG-02**: Each package has a README with description, install command, and basic usage example
- [ ] **PKG-03**: Each package.json has complete fields: files, engines, repository, keywords
- [ ] **PKG-04**: All viem-using packages correctly declare viem as a peer dependency

### Testing & Coverage

- [ ] **TEST-01**: Test coverage is measured via @vitest/coverage-v8
- [ ] **TEST-02**: Minimum coverage thresholds are enforced (70-80%)

### External Extraction

- [ ] **EXT-01**: Reusable utilities from chillwhales/marketplace are identified and extracted into this monorepo
- [ ] **EXT-02**: Reusable utilities from chillwhales/lsp-indexer are identified and extracted into this monorepo

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Testing Enhancements

- **TEST-03**: Types are tested against multiple TypeScript versions (current + latest)
- **TEST-04**: Bundle size is tracked and regressions are caught via size-limit

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Browser-specific builds | Library targets Node >= 18, bundlers handle browser compat |
| Documentation site | README per package is sufficient until there's adoption |
| Turborepo/Nx | pnpm scripts sufficient at 8 packages, adds unnecessary complexity |
| JSR publishing | npm is where consumers are, JSR adoption still early |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 1 | Complete |
| BUILD-02 | Phase 1 | Complete |
| BUILD-03 | Phase 1 | Complete |
| BUILD-04 | Phase 1 | Complete |
| BUILD-05 | Phase 3 | Complete |
| QUAL-01 | Phase 2 | Complete |
| QUAL-02 | Phase 2 | Complete |
| QUAL-03 | Phase 2 | Complete |
| QUAL-04 | Phase 3 | Complete |
| QUAL-05 | Phase 3 | Complete |
| QUAL-06 | Phase 3 | Complete |
| QUAL-07 | Phase 2 | Complete |
| CI-01 | Phase 5 | Pending |
| CI-02 | Phase 5 | Pending |
| CI-03 | Phase 5 | Pending |
| CI-04 | Phase 5 | Pending |
| REL-01 | Phase 7 | Pending |
| REL-02 | Phase 7 | Pending |
| REL-03 | Phase 7 | Pending |
| REL-04 | Phase 7 | Pending |
| REL-05 | Phase 7 | Pending |
| REL-06 | Phase 7 | Pending |
| REL-07 | Phase 7 | Pending |
| PKG-01 | Phase 6 | Pending |
| PKG-02 | Phase 6 | Pending |
| PKG-03 | Phase 6 | Pending |
| PKG-04 | Phase 6 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| EXT-01 | Phase 8 | Pending |
| EXT-02 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 — Phase 3 complete (BUILD-05, QUAL-04, QUAL-05, QUAL-06 done)*
