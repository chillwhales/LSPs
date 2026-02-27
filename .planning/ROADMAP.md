# Roadmap: LSPs

**Created:** 2026-02-27
**Depth:** Comprehensive
**Phases:** 8
**Coverage:** 31/31 v1 requirements mapped

## Overview

Transform the @chillwhales/* monorepo from working-but-fragile code into publish-ready npm packages with professional infrastructure. The roadmap follows a strict dependency chain: fix builds first (the most dangerous existing debt), establish code quality tooling, add structural validation, wire up coverage, automate CI, prepare package metadata, automate releases, and finally extract utilities from external repos. After Phase 7, packages are published on npm. Phase 8 consolidates code from consumer repos back into the monorepo.

## Phases

### Phase 1: Build Hardening & Shared Configs

**Goal:** All 8 packages build from shared configurations with zero warnings, and dependency versions are centralized.

**Dependencies:** None — this is the foundation.

**Requirements:**
- BUILD-01: All packages share a single build configuration source
- BUILD-02: All packages share a single test configuration source
- BUILD-03: Build process fails on warnings (failOnWarn: true)
- BUILD-04: Dependency versions are centralized via pnpm catalogs

**Success Criteria:**
1. Running `pnpm build` from root builds all 8 packages with `failOnWarn: true` and zero warnings
2. Each package's `build.config.ts` is a thin re-export of a shared root config (no duplicated settings)
3. Running `pnpm test` from root discovers and runs all package tests via a single root vitest config
4. All shared dependency versions are declared once in `pnpm-workspace.yaml` catalogs and referenced via `catalog:` in each package.json

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Create @chillwhales/config package, pnpm catalogs, migrate all package.json
- [x] 01-02-PLAN.md — Replace build.config.ts with shared wrappers, fix warnings, enable failOnWarn
- [x] 01-03-PLAN.md — Replace vitest/tsconfig configs with shared wrappers, create root vitest config

---

### Phase 2: Code Quality — Biome & Git Hooks

**Goal:** Every file in the monorepo is consistently linted and formatted, enforced automatically before each commit.

**Dependencies:** Phase 1 (builds must be clean before large-format diff)

**Requirements:**
- QUAL-01: All packages are linted by Biome from a single root configuration
- QUAL-02: All packages are formatted by Biome from a single root configuration
- QUAL-03: Pre-commit hook runs biome check before every commit
- QUAL-07: All commits follow conventional commit format, enforced via commitlint

**Success Criteria:**
1. Running `pnpm biome check` from root lints and format-checks all packages with zero errors
2. Attempting to commit unformatted code is blocked by the pre-commit hook
3. Attempting to commit with a non-conventional message (e.g., "fixed stuff") is rejected by the commit-msg hook
4. A single `biome.json` at root governs all packages (no per-package biome configs)

**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Biome configuration & codebase formatting (QUAL-01, QUAL-02)
- [x] 02-02-PLAN.md — Git hooks & commitlint enforcement (QUAL-03, QUAL-07)

---

### Phase 3: Dependency & Monorepo Hygiene

**Goal:** Structural problems — circular dependencies, unused code, inconsistent package metadata, and wrong package managers — are caught automatically.

**Dependencies:** Phase 1 (catalogs and shared configs must exist before validation tools can check them)

**Requirements:**
- BUILD-05: Circular dependencies between packages are detected and reported
- QUAL-04: Unused dependencies and exports are detected via knip
- QUAL-05: Monorepo package consistency is validated via sherif
- QUAL-06: Only pnpm can be used as package manager (enforced via preinstall)

**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — Install & configure knip, sherif, madge, only-allow; restructure scripts
- [ ] 03-02-PLAN.md — Run all tools, fix violations, verify clean slate

**Success Criteria:**
1. Running a circular dependency check reports any inter-package cycles (and currently finds none, or documents known exceptions)
2. Running `pnpm knip` identifies unused dependencies and unused exports across all packages
3. Running `pnpm sherif` validates consistent dependency versions and monorepo conventions
4. Running `npm install` or `yarn install` in the repo root fails with a clear error directing users to pnpm

---

### Phase 4: Testing & Coverage Infrastructure

**Goal:** Test coverage is measured across all packages with enforced minimum thresholds.

**Dependencies:** Phase 1 (shared vitest config must exist)

**Requirements:**
- TEST-01: Test coverage is measured via @vitest/coverage-v8
- TEST-02: Minimum coverage thresholds are enforced (70-80%)

**Success Criteria:**
1. Running `pnpm test --coverage` produces a coverage report showing line, branch, function, and statement coverage per package
2. If any package falls below the configured coverage threshold (70-80%), the test command exits with a non-zero code
3. Coverage output is in a CI-consumable format (lcov or similar) for later Codecov integration

---

### Phase 5: CI Pipeline

**Goal:** Every pull request is automatically validated — typecheck, lint, format, build, publish-readiness, test, and coverage — with no manual intervention.

**Dependencies:** Phase 2 (Biome must be configured), Phase 3 (hygiene tools must exist), Phase 4 (coverage must be measurable)

**Requirements:**
- CI-01: Every PR runs install, typecheck, lint, format check, build, and test
- CI-02: In-progress CI runs are cancelled when new commits are pushed
- CI-03: Package exports and types are validated via publint and attw before merge
- CI-04: Test coverage is reported and uploaded to Codecov on every PR

**Success Criteria:**
1. Opening a PR triggers a GitHub Actions workflow that runs: install → typecheck → biome ci → build → publint+attw → test+coverage → codecov upload
2. Pushing a new commit to a PR with a running workflow cancels the previous run
3. A PR that introduces a package export error (wrong types, missing entry point) fails the publint/attw check
4. Coverage results appear on the PR as a Codecov status check or comment

---

### Phase 6: Package Metadata & Publish Readiness

**Goal:** Every package has complete metadata and is ready for its first npm publish.

**Dependencies:** Phase 5 (CI must validate packages before we prepare them for publishing)

**Requirements:**
- PKG-01: LICENSE file exists at root and is included in each published package
- PKG-02: Each package has a README with description, install command, and basic usage example
- PKG-03: Each package.json has complete fields: files, engines, repository, keywords
- PKG-04: All viem-using packages correctly declare viem as a peer dependency

**Success Criteria:**
1. Running `npm pack --dry-run` on any package shows LICENSE and README included in the tarball
2. Each package's README contains at minimum: one-line description, `pnpm add @chillwhales/<pkg>` install command, and a code example
3. Each package.json includes `files`, `engines`, `repository`, and `keywords` fields (validated by publint in CI)
4. Packages that import from `viem` list it in `peerDependencies` with `^2.0.0` (not dependencies)

---

### Phase 7: Release Automation

**Goal:** Merging to main automatically versions, changelogs, and publishes changed packages to npm — no manual publish steps.

**Dependencies:** Phase 6 (packages must have complete metadata before publishing)

**Requirements:**
- REL-01: Changesets is configured for independent versioning of all packages
- REL-02: Changelogs are auto-generated per package with GitHub PR attribution
- REL-03: Scoped packages are configured for public npm access
- REL-04: After a PR merges to main, a version PR is automatically created or updated
- REL-05: When the version PR merges, changed packages are automatically published to npm
- REL-06: PR-based snapshot releases are available via pkg-pr-new
- REL-07: GitHub Releases are created when packages are published

**Success Criteria:**
1. Adding a changeset file, merging to main, and merging the resulting version PR publishes the affected packages to npm with correct versions
2. Each published package has a CHANGELOG.md entry linking to the PR that introduced the change
3. Running `npx changeset status` shows independent version tracking (packages can be at different versions)
4. Commenting a trigger on a PR (or pushing to it) creates a snapshot release installable via a temporary npm URL
5. After packages are published, corresponding GitHub Releases appear with changelogs

---

### Phase 8: External Code Extraction

**Goal:** Reusable utilities from chillwhales/marketplace and chillwhales/lsp-indexer live in the monorepo and those repos consume the published packages.

**Dependencies:** Phase 7 (packages must be published to npm before external repos can consume them)

**Requirements:**
- EXT-01: Reusable utilities from chillwhales/marketplace are identified and extracted
- EXT-02: Reusable utilities from chillwhales/lsp-indexer are identified and extracted

**Success Criteria:**
1. Utilities previously duplicated in marketplace are now importable from `@chillwhales/*` packages on npm
2. Utilities previously duplicated in lsp-indexer are now importable from `@chillwhales/*` packages on npm
3. Both marketplace and lsp-indexer repos have PRs replacing local utilities with `@chillwhales/*` imports, and their tests pass

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Build Hardening & Shared Configs | BUILD-01, BUILD-02, BUILD-03, BUILD-04 | ✅ Complete |
| 2 | Code Quality — Biome & Git Hooks | QUAL-01, QUAL-02, QUAL-03, QUAL-07 | ✅ Complete (2026-02-27) |
| 3 | Dependency & Monorepo Hygiene | BUILD-05, QUAL-04, QUAL-05, QUAL-06 | ⬚ Not Started |
| 4 | Testing & Coverage Infrastructure | TEST-01, TEST-02 | ⬚ Not Started |
| 5 | CI Pipeline | CI-01, CI-02, CI-03, CI-04 | ⬚ Not Started |
| 6 | Package Metadata & Publish Readiness | PKG-01, PKG-02, PKG-03, PKG-04 | ⬚ Not Started |
| 7 | Release Automation | REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07 | ⬚ Not Started |
| 8 | External Code Extraction | EXT-01, EXT-02 | ⬚ Not Started |

---
*Roadmap created: 2026-02-27*
*Last updated: 2026-02-27 — Phase 2 complete (Biome + Git Hooks)*
