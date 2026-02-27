# Project Research Summary

**Project:** @chillwhales/* LSP Library Monorepo Infrastructure
**Domain:** TypeScript library monorepo (build, lint, format, CI, release automation)
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

This project is a TypeScript library monorepo implementing LUKSO Standard Proposals across 8 packages (`@chillwhales/*` scope). The code works today — dual ESM/CJS output via unbuild, tests via Vitest, shared tsconfig — but lacks the professional infrastructure needed for public npm publishing: no linting/formatting, no CI pipeline, no release automation, and duplicated configs across all 8 packages. The good news: expert consensus on how to build this is strong. The reference architecture is clear from inspecting viem, Effect-TS, tRPC, and drizzle-orm — all mature pnpm monorepos publishing multiple npm packages. There are no novel technical challenges here; this is well-trodden ground.

The recommended approach is: keep unbuild (already working, no reason to switch), adopt Biome v2.4 for linting+formatting (single Rust binary replacing ESLint+Prettier, 10-30x faster, monorepo-native), implement Changesets for independent versioning and automated npm releases, and add V8 coverage via Vitest. Root-level shared configs eliminate duplication without the overhead of a config package. pnpm catalogs centralize dependency versions. The CI pipeline follows the universal pattern: install → typecheck → lint → build → validate → test, with changesets handling release automation on merge to main.

The primary risks are: (1) `workspace:*` protocol leaking into published packages if publishing bypasses changesets (recovery: HIGH cost — npm unpublish within 72h), (2) `failOnWarn: false` in all 8 build configs hiding real issues like missing externals and circular deps (must fix before anything else), and (3) first npm publish failing due to wrong scope access or missing package metadata. All three are preventable with the right phase ordering — fix builds first, validate tarballs in CI, and dry-run the first publish manually.

## Key Findings

### Recommended Stack

The stack is settled with high confidence. All four tools are industry-standard for TypeScript library monorepos, verified against multiple production repos.

**Core technologies:**
- **unbuild ^3.6.1**: Library bundler (ESM + CJS + .d.ts) — already in use, convention-over-config, auto-externals from package.json. No migration needed.
- **Biome ^2.4.x**: Linting + formatting — single Rust binary, 10-30x faster than ESLint+Prettier, monorepo-native config with `"extends": "//"`, import organization built-in. Clean-slate adoption (no existing ESLint to migrate).
- **@changesets/cli ^2.29.x**: Versioning + changelogs + npm publish — industry standard for independent versioning. Used by viem, Effect, Remix, pnpm. GitHub Action automates release PRs and publish.
- **@vitest/coverage-v8 ^4.0.x**: Code coverage — native V8 provider for Vitest. AST-based remapping (since Vitest 3.2) equals Istanbul accuracy at V8 speed.

**What NOT to adopt:** Turborepo/Nx (overkill for 8 packages), tsdown (pre-1.0), semantic-release (over-automates versioning), ESLint+Prettier (two tools where one suffices).

### Expected Features

**Must have (table stakes for first publish):**
- T4: Shared build config — eliminate 8 duplicate `build.config.ts` files
- T5: Shared vitest config — root `projects` config + thin per-package overrides
- T6+T7: Biome lint+format — single `biome.json` at root
- T8: CI pipeline — install, typecheck, lint, build, validate, test
- T10: Changesets with independent versioning and `access: "public"`
- T13–T17: Package metadata completeness (LICENSE, README, engines, repository, files)
- D1: Publish validation with `publint --strict` + `@arethetypeswrong/cli`
- D2: Pre-commit hooks via simple-git-hooks + biome check

**Should have (add after first publish):**
- D3: Coverage reporting + Codecov integration
- D5: Snapshot/canary releases via `pkg-pr-new`
- D7: Unused dependency detection via `knip`
- D10: Monorepo consistency checks via `sherif`

**Defer (v2+):**
- D8: Bundle size tracking
- D9: Multi-version TypeScript testing
- A5: GitHub Releases
- A3: Documentation site

### Architecture Approach

The architecture follows root-level config sharing without a config package. All 8 packages are small and homogeneous — a shared config *package* adds workspace dependency complexity and build ordering concerns that aren't justified until ~20+ packages. Instead: root `tsconfig.base.json` (extends), root `build.config.shared.ts` (re-export), root `vitest.config.ts` with `projects: ['packages/*']` (auto-discovery), and a single root `biome.json` (monorepo-native). pnpm catalogs centralize dependency versions while keeping declarations explicit in each package.json.

**Major components:**
1. **Root configuration layer** — biome.json, tsconfig.base.json, vitest.config.ts, build.config.shared.ts, pnpm-workspace.yaml with catalogs
2. **Per-package thin configs** — build.config.ts (re-exports shared), vitest.config.ts (defineProject), tsconfig.json (extends base)
3. **Build tier system** — Tier 0 (utils, lsp2, lsp30), Tier 1 (lsp3, lsp6, lsp23, lsp29), Tier 2 (lsp4). pnpm handles topological ordering.
4. **CI pipeline** — PR checks (lint, typecheck, build+validate, test), main branch (changesets version/publish)
5. **Release automation** — changesets creates version PR on main, merge triggers npm publish with `NPM_TOKEN`

### Critical Pitfalls

1. **`workspace:*` leaking to npm** — Always publish through `changeset publish`, never `pnpm publish` directly. Set `updateInternalDependencies: "patch"`. Add CI check that greps tarballs for `workspace:`. Recovery cost: HIGH.
2. **`failOnWarn: false` hiding broken builds** — All 8 packages suppress unbuild warnings. Must enable `failOnWarn: true` and fix each warning before any other infrastructure work. This is the single most dangerous existing technical debt.
3. **First npm publish with wrong access** — Scoped packages default to restricted. Must set `access: "public"` in changeset config, claim `@chillwhales` npm scope, use `automation`-type npm token for CI. Dry-run first publish manually.
4. **Changesets not cascading internal dependency bumps** — lsp2 changes must cascade to lsp3, lsp4, lsp23, lsp29. Set `updateInternalDependencies: "patch"` and verify with `changeset status`.
5. **ESM/CJS resolution mismatch for consumers** — `moduleResolution: "bundler"` is permissive; consumers using `"node16"` may fail. Add consumer smoke test with strict resolution. `declaration: "compatible"` (already set) helps.

## Implications for Roadmap

Based on combined research findings, dependency analysis, and pitfall-to-phase mapping:

### Phase 1: Foundation — Build System Hardening & Shared Configs
**Rationale:** `failOnWarn: false` is the most dangerous existing debt. Must fix before adding any infrastructure that depends on correct builds. Shared configs reduce duplication before adding more config layers (biome, coverage, etc.).
**Delivers:** Clean builds with `failOnWarn: true`, shared build.config.shared.ts, root vitest.config.ts with projects, pnpm catalogs for dependency versions.
**Addresses:** T4 (shared build config), T5 (shared vitest config), build correctness
**Avoids:** Pitfall 3 (failOnWarn hiding issues), Pitfall 7 (build order), Pitfall 11 (config package trap)

### Phase 2: Code Quality — Biome Lint + Format + Pre-commit Hooks
**Rationale:** Biome must be configured before CI can enforce it. Format-all creates a large diff — do this in a dedicated phase before any feature work is in-flight. Pre-commit hooks depend on biome being configured.
**Delivers:** Root biome.json, initial format-all commit, pre-commit hooks via simple-git-hooks.
**Addresses:** T6 (linting), T7 (formatting), D2 (pre-commit hooks)
**Avoids:** Pitfall 8 (Biome v2 config mistakes), Pitfall 9 (missing ESLint rules — document Biome vs tsc coverage)

### Phase 3: CI Pipeline
**Rationale:** Depends on linting and build being correct (Phases 1-2). CI is prerequisite for release automation (Phase 4). Must cache pnpm store correctly and use `biome ci` (not `biome check`).
**Delivers:** GitHub Actions workflow: install → typecheck → biome ci → build → publint+attw → test. Concurrency control, pnpm caching, `--frozen-lockfile`.
**Addresses:** T8 (CI pipeline), T9 (typecheck as CI step), D1 (publish validation)
**Avoids:** Pitfall 10 (CI caching), Pitfall 2 (ESM/CJS mismatch — consumer smoke test)

### Phase 4: Package Metadata & Release Automation
**Rationale:** Changesets requires complete package metadata (LICENSE, README, repository field, engines). Publishing requires npm scope access and correct changeset config. This phase gates on CI being operational (Phase 3).
**Delivers:** Complete package.json fields across all 8 packages, LICENSE files, minimal READMEs, `.changeset/config.json`, GitHub Actions release workflow, verified dry-run publish.
**Addresses:** T10 (changesets), T11 (changelogs), T12 (independent versioning), T13–T17 (package metadata), T19 (public access), D4 (GitHub changelog attribution)
**Avoids:** Pitfall 1 (workspace:* leaking), Pitfall 4 (wrong npm access), Pitfall 5 (missing files), Pitfall 6 (cascading bumps), Pitfall 13 (pnpm 10 workspace protocol)

### Phase 5: Post-Launch Polish
**Rationale:** These features add value but aren't blockers for first publish. Each is independent and low-risk.
**Delivers:** Coverage reporting, `knip` unused dep detection, `sherif` consistency checks, `pkg-pr-new` snapshot releases, `preinstall` only-allow-pnpm enforcement.
**Addresses:** D3 (coverage), D5 (snapshot releases), D6 (pnpm enforcement), D7 (knip), D10 (consistency checks), D12 (circular dep detection)
**Avoids:** Over-engineering before validation with real consumers

### Phase 6: External Code Extraction
**Rationale:** Must be last — packages need to be published and stable before consumer repos can switch to `@chillwhales/*` imports. Requires coordinated PRs across 3 repos.
**Delivers:** Utilities extracted from marketplace and lsp-indexer repos into appropriate LSP packages, consumer repos updated to use published packages.
**Addresses:** External repo consolidation (PROJECT.md scope item)
**Avoids:** Pitfall 12 (extraction breaking consumer repos — identical API first, refactor later)

### Phase Ordering Rationale

- **Phases 1→2:** Build correctness must precede code quality enforcement. No point linting code that doesn't build cleanly.
- **Phases 2→3:** CI must be able to run biome and builds. Configure tools first, then automate.
- **Phases 3→4:** Release automation depends on CI passing. Don't automate publishing if the pipeline isn't validated.
- **Phase 4 is the milestone:** After Phase 4, packages are publishable to npm. Everything after is enhancement.
- **Phase 6 is last by design:** External extraction has the highest coordination cost and the most external dependencies. Do it when the library is stable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Release Automation):** npm scope claim process, `NPM_TOKEN` granular permissions, first-publish dry-run procedure, pnpm 10 + changesets interaction specifics. Worth a `/gsd-research-phase` to verify the exact publish flow end-to-end.
- **Phase 6 (External Extraction):** Requires cataloging specific utilities in marketplace and lsp-indexer repos. Can't plan extraction without knowing what to extract. Definitely needs phase-specific research.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Build Hardening):** Well-documented unbuild patterns, pnpm catalogs have official docs. Fix warnings one by one.
- **Phase 2 (Biome):** `biome init` + configure. Clean-slate adoption. Official docs are excellent for v2.
- **Phase 3 (CI):** Standard GitHub Actions patterns, well-documented by every reference repo (viem's workflow is a good template).
- **Phase 5 (Post-Launch):** Each tool (knip, sherif, pkg-pr-new, coverage) has straightforward setup docs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All tools verified against official releases, docs, and production repos (viem, Effect, tRPC, drizzle). Versions confirmed current as of Feb 2026. |
| Features | HIGH | Feature landscape built from direct inspection of 5 reference repos' package.json, CI workflows, and changeset configs. Prioritization based on ecosystem consensus. |
| Architecture | HIGH | Root-config-sharing pattern verified across pnpm docs, Vitest docs, Biome docs, and multiple production monorepos. Anti-patterns identified from real failure modes. |
| Pitfalls | HIGH | Pitfalls derived from project codebase analysis (e.g., `failOnWarn: false` found in actual build.config.ts) combined with documented ecosystem gotchas. Recovery strategies included. |

**Overall confidence:** HIGH

### Gaps to Address

- **npm scope `@chillwhales` availability:** Not verified whether the scope is claimed on npm. Must check before Phase 4 planning. If unclaimed, claim it. If taken, need a different scope.
- **Exact utilities to extract from external repos:** Phase 6 can't be planned in detail without auditing marketplace and lsp-indexer codebases. Defer to phase-specific research.
- **Consumer compatibility testing:** No existing consumer test harness. Phase 3 should include a minimal consumer smoke test (CJS + ESM + node16 resolution), but the exact setup needs design during planning.
- **pnpm 10 + changesets publish interaction:** pnpm 10 is relatively new. While research indicates `workspace:*` handling works, the exact publish flow should be dry-run tested before automating.
- **`failOnWarn: true` impact:** Unknown how many warnings exist across 8 packages. Phase 1 may be quick (few warnings) or slow (many circular deps to untangle). Investigate during phase planning.

## Sources

### Primary (HIGH confidence)
- unbuild releases (GitHub): v3.6.1 (Aug 2025) — build system capabilities, declaration generation
- Biome v2 blog + v2.4 release notes (biomejs.dev): monorepo support, type-aware linting, import organization
- Biome 2026 roadmap (biomejs.dev): upcoming features, current limitations
- Changesets repo + docs (GitHub, 11.5k stars): config options, action integration, workspace protocol handling
- Vitest v4 coverage docs (vitest.dev): V8 provider, AST-based remapping, projects config
- pnpm workspaces + catalogs docs (pnpm.io): workspace protocol, catalog feature, pnpm 10 behavior
- viem monorepo (wevm/viem): biome.json, CI workflows, changesets config, publint+attw, sherif, simple-git-hooks
- Effect-TS monorepo (Effect-TS/effect): changesets config, independent versioning, CI workflows
- tRPC monorepo (trpc/trpc): CI workflows, coverage, manypkg
- drizzle-orm monorepo (drizzle-team/drizzle-orm): attw per-package, release workflow

### Secondary (MEDIUM confidence)
- unbuild documentation (GitHub README) — less formal docs than other tools, but source code is clear
- Node.js ESM/CJS dual package docs (nodejs.org) — verified but edge cases exist

### Tertiary (LOW confidence)
- None — all findings verified against multiple sources

---
*Research completed: 2026-02-27*
*Ready for roadmap: yes*
