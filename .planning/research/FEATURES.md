# Feature Research

**Domain:** TypeScript library monorepo infrastructure
**Researched:** 2026-02-27
**Confidence:** HIGH

Evidence base: viem (wevm), Effect-TS, tRPC, drizzle-orm, changesets — all active pnpm/yarn monorepos publishing multiple npm packages. Direct inspection of package.json, CI workflows, changeset configs, biome configs, and git hooks.

## Feature Landscape

### Table Stakes (Consumers/Contributors Expect These)

Features that every published npm library monorepo must have. Missing any of these makes the project look amateur or causes real integration pain for consumers.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| T1 | **Conditional exports map** (`exports` in package.json) | Consumers using ESM, CJS, or TypeScript need correct resolution. Wrong exports = broken imports. | LOW | Already have this. `types` condition must come first. viem, effect, drizzle all use it. |
| T2 | **Dual ESM/CJS output with declarations** | Library consumers use both module systems. CJS-only or ESM-only limits adoption. | LOW | Already have this via unbuild. Keep `.mjs`/`.cjs`/`.d.ts` triple. |
| T3 | **Shared base tsconfig** | Consistency across packages. Divergent TS settings cause subtle type incompatibilities between packages. | LOW | Already have `tsconfig.base.json`. Each package extends it. Standard pattern (viem, effect, trpc all do this). |
| T4 | **Shared build config** | 8 identical `build.config.ts` files. Changes require editing all 8. | LOW | Create `packages/config` or root-level shared config. Effect uses `@effect/build-utils`. Keep it simple — a shared `defineBuildConfig` preset. |
| T5 | **Shared vitest config** | 8 identical `vitest.config.ts` files with same settings. | LOW | Export a base config from shared package. Override only when needed. |
| T6 | **Linting** | Contributors expect consistent code style enforcement. PRs without lint checks accumulate inconsistencies. | LOW | Biome is the right choice — viem uses biome, single tool for lint+format. Effect and trpc use eslint (heavier). |
| T7 | **Formatting** | Same as linting — contributors expect auto-formatting. | LOW | Biome handles this too. Single `biome.json` at root. viem's config is a good reference. |
| T8 | **CI pipeline on PRs** | Contributors expect automated checks before merge. Maintainers need confidence in PRs. | MEDIUM | Every reference repo has this. Minimum jobs: install → typecheck → lint → build → test. |
| T9 | **Typecheck as separate CI step** | Catches type errors that tests don't exercise. Essential for a types-heavy library. | LOW | `tsc --noEmit` or `tsc -b`. All reference repos run typecheck separately from build and test. Effect tests against multiple TS versions. |
| T10 | **Automated release workflow** (changesets) | Manual npm publishing is error-prone and doesn't scale to 8 packages. | MEDIUM | Changesets is the standard. viem and effect both use `@changesets/action` with GitHub Actions. Pattern: push to main → create version PR → merge PR → publish to npm. |
| T11 | **Per-package CHANGELOG** | Consumers want to know what changed before upgrading. Changesets generates these automatically. | LOW | Free with changesets. Use `@changesets/changelog-github` for PR/author attribution (viem, effect both use this). |
| T12 | **Independent versioning** | Packages evolve at different rates. Consumers pin specific package versions. | LOW | Changesets default. Already decided in PROJECT.md. viem is single-package but effect uses independent versioning. |
| T13 | **LICENSE file** (per-package and root) | npm warns without it. Legal requirement for OSS. Consumers check before adopting. | LOW | Already have `"license": "MIT"` in package.json. Add actual LICENSE file at root and in each package's `files` array. |
| T14 | **README per package** | npm shows the README on the package page. Empty README = nobody installs. | LOW | Minimum: what it does, install command, basic usage example, link to main repo. |
| T15 | **`files` field in package.json** | Without it, npm publishes everything (tests, configs, source). Bloats install size. | LOW | Already have `"files": ["dist", "package.json"]`. Add LICENSE and README to the list. |
| T16 | **`engines` field** | Consumers need to know minimum Node version. Prevents cryptic runtime errors. | LOW | Root has `"engines": {"node": ">=18"}`. Add to each package too. |
| T17 | **`repository` field in package.json** | npm links to source. Without it, consumers can't find the repo. | LOW | Add `"repository": {"type": "git", "url": "...", "directory": "packages/lsp2"}` to each package. |
| T18 | **`peerDependencies` declared correctly** | viem is a peer dep for blockchain packages. Wrong peer deps = duplicate installations and runtime bugs. | LOW | Already correct for lsp2. Verify all packages with viem usage declare it as peer. |
| T19 | **Public access for scoped packages** | `@chillwhales/*` scope requires `--access public` on first publish or `"access": "public"` in changeset config. Without it, publish fails. | LOW | Set in `.changeset/config.json`: `"access": "public"`. |
| T20 | **Concurrency control in CI** | Prevents duplicate CI runs on rapid pushes. Wastes minutes without it. | LOW | Every reference repo uses `concurrency: group/cancel-in-progress`. |

### Differentiators (Competitive Advantage for Adoption)

Features that signal a professionally-maintained library. Not expected, but valued by consumers and contributors.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D1 | **Package publish validation** (`publint` + `attw`) | Catches broken exports maps, missing types, ESM/CJS resolution issues before publish. Prevents "it works locally but not when installed" bugs. | LOW | viem uses both `publint --strict` and `@arethetypeswrong/cli`. Drizzle runs `attw` per-package in CI. Run as `test:build` script. |
| D2 | **Pre-commit hooks** (simple-git-hooks + biome) | Fast feedback. Catches lint/format issues before CI. Reduces CI failures. | LOW | viem uses `simple-git-hooks` with pre-commit running `pnpm check` (biome). Lighter than husky. Add `"prepare": "pnpm simple-git-hooks"` to root package.json. |
| D3 | **Coverage reporting** | Demonstrates test quality. Consumers check coverage before adopting a library. | LOW | trpc uploads to Codecov. viem uses `@vitest/coverage-v8`. Add coverage thresholds in vitest config. 80% is standard floor for libraries. |
| D4 | **GitHub changelog attribution** | Changelogs that credit PR authors and link to PRs. Makes contributors feel valued, makes changelogs more useful. | LOW | `@changesets/changelog-github` — used by both viem and effect. Drop-in config. |
| D5 | **Snapshot/canary releases** | Let consumers test unreleased changes without waiting for a release. Useful for bug reports ("does this fix your issue?"). | MEDIUM | viem uses `pkg-pr-new` for PR-based preview packages. Effect has snapshot workflow. Start with `pkg-pr-new` — zero config, comments on PRs. |
| D6 | **`preinstall` enforcement** (package manager) | Prevents accidental `npm install` or `yarn install` in a pnpm monorepo. Avoids corrupted lockfiles. | LOW | viem uses `"preinstall": "pnpx only-allow pnpm"`. One line. |
| D7 | **Unused dependency detection** (`knip`) | Catches dead code, unused deps, missing exports. Keeps packages lean. | LOW | viem uses `knip` in CI. Run `knip --production` to check only published code. Drizzle doesn't use it but should. |
| D8 | **Bundle size tracking** (`size-limit`) | Demonstrates commitment to lightweight packages. Catches accidental size regressions. | MEDIUM | viem tracks granular import sizes with `@size-limit/preset-big-lib`. PR comments show size diffs. More relevant for large packages. |
| D9 | **Multi-version TypeScript testing** | Proves types work across TS versions consumers actually use. | MEDIUM | viem tests against TS 5.8, 5.9, and latest. Effect uses `tstyche` for type testing. Start with current + latest. |
| D10 | **Monorepo consistency checks** (`sherif` or `manypkg`) | Catches version mismatches, missing fields, inconsistent deps across packages. | LOW | viem uses `sherif`. trpc uses `@manypkg/cli`. Both catch "package A uses dep@1, package B uses dep@2" issues. |
| D11 | **`keywords` in package.json** | Improves npm discoverability. Consumers find packages through search. | LOW | Add relevant keywords: `lukso`, `lsp`, `blockchain`, `erc725`, etc. |
| D12 | **Circular dependency detection** | Catches import cycles that cause runtime issues in CJS or confuse bundlers. | LOW | Effect runs `pnpm circular` (uses `madge`). Important for a monorepo where packages cross-import. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a library monorepo of this size.

| # | Feature | Why Requested | Why Problematic | Alternative |
|---|---------|---------------|-----------------|-------------|
| A1 | **Turborepo/Nx** | "It's what big monorepos use" | Adds complexity, build cache config, learning curve. 8 packages with simple builds don't need task orchestration. pnpm `--filter` and `-r` are sufficient. viem doesn't use turbo for the library itself. | Use `pnpm -r build` and `pnpm -r test`. Add turbo only if builds take >2 minutes. trpc uses turbo but has 20+ packages + a website + examples. |
| A2 | **Conventional commits enforcement** | "Professional repos require it" | Changesets already track what changed and why. Conventional commits add friction for contributors without adding value when changesets handle versioning. | Use changesets for versioning. Let commit messages be freeform. trpc has semantic-pr checks but that's for PR titles, not commits. |
| A3 | **Documentation site** | "Every library needs docs" | Premature for first publish. READMEs are sufficient until there's adoption. Doc sites need maintenance. | README per package with usage examples. Revisit after packages have users. PROJECT.md already marks this out of scope. |
| A4 | **Browser-specific builds** | "What about browser users?" | Library targets Node >=18. Bundlers (webpack, vite, esbuild) handle browser compat from ESM source. Browser builds add testing burden. | Ship ESM + CJS. Let bundlers do their job. PROJECT.md already marks this out of scope. |
| A5 | **GitHub Releases** | "Professional repos have releases" | Adds manual step or extra CI complexity. npm is the distribution channel. Changelogs are generated per-package. | Changesets can auto-create GitHub releases if desired later (`createGithubReleases: true` in the action). Not needed for first publish. |
| A6 | **Renovate/Dependabot** | "Keep deps updated automatically" | Noisy. Creates many PRs. For a library, you want deliberate dep updates after testing. | Update deps manually on a schedule. Add later if maintenance burden grows. |
| A7 | **Monorepo-wide vitest** (single root config) | "Run all tests from root with one config" | Packages have different deps and may need different test setups. Root-level vitest config gets complex. | Keep per-package vitest configs (extending shared base). Run via `pnpm -r test`. Effect does root-level vitest but they have a much more homogeneous package set. |
| A8 | **Custom ESLint rules/plugin** | "Enforce domain-specific patterns" | Drizzle has `eslint-plugin-drizzle-internal`. Way too complex for 8 packages. Biome rules cover standard cases. | Use biome's built-in rules. Add custom lint only if you find repeated code review comments about the same issue. |
| A9 | **JSR publishing** | "JSR is the future" | Adds another publishing target. npm is where consumers are. JSR adoption is still early. | Publish to npm only. viem publishes to JSR but they're a massive project. Revisit if JSR adoption grows. |

## Feature Dependencies

```
[T6 Biome lint] ─────────────────┐
[T7 Biome format] ───────────────┤
                                  ├──> [T8 CI pipeline]
[T9 Typecheck] ──────────────────┤
[T2 Dual output + T1 Exports] ───┤
                                  │
[T4 Shared build config] ────────┤
[T5 Shared vitest config] ───────┘

[T10 Changesets release] ──requires──> [T19 Public access]
[T10 Changesets release] ──requires──> [T8 CI pipeline]
[T10 Changesets release] ──requires──> [T13 LICENSE]
[T10 Changesets release] ──requires──> [T14 README per package]
[T10 Changesets release] ──requires──> [T17 Repository field]
[T11 Changelog] ──────────requires──> [T10 Changesets release]

[D1 Publish validation] ──requires──> [T2 Dual output]
[D1 Publish validation] ──enhances──> [T10 Changesets release]

[D2 Pre-commit hooks] ──requires──> [T6 Biome lint]
[D2 Pre-commit hooks] ──requires──> [T7 Biome format]

[D3 Coverage] ──enhances──> [T8 CI pipeline]
[D5 Snapshot releases] ──requires──> [T8 CI pipeline]
[D7 Knip] ──enhances──> [T8 CI pipeline]
[D10 Consistency checks] ──enhances──> [T8 CI pipeline]
[D12 Circular dep detection] ──enhances──> [T8 CI pipeline]
```

### Dependency Notes

- **CI pipeline requires lint+format+typecheck**: These must be configured before CI can run them. Build and test already work.
- **Changesets requires package metadata**: LICENSE, README, repository field, public access must all be set before first publish.
- **Pre-commit hooks require biome**: Hooks need something to run. Biome must be configured first.
- **Publish validation enhances release**: Run `publint` and `attw` as a CI check before publish, not during publish.
- **Shared configs should come first**: Reduces duplication before adding more config (biome, coverage, etc.).

## MVP Definition

### Launch With (v1 — First Publish)

Minimum infrastructure needed to publish professional packages to npm.

- [x] Dual ESM/CJS output with declarations — already working
- [x] Conditional exports map — already working
- [x] Shared base tsconfig — already working
- [ ] T4: Shared build config — eliminate 8 duplicate `build.config.ts`
- [ ] T5: Shared vitest config — eliminate 8 duplicate `vitest.config.ts`
- [ ] T6+T7: Biome lint+format setup — single `biome.json` at root
- [ ] T8: CI pipeline (install, typecheck, lint, format-check, build, test)
- [ ] T9: Typecheck as CI step
- [ ] T10: Changesets init with config
- [ ] T11: Changelog generation per package
- [ ] T13: LICENSE file at root + in package `files`
- [ ] T14: README per package (minimal: description, install, basic usage)
- [ ] T15+T16+T17: Package.json completeness (files, engines, repository)
- [ ] T19: Public access in changeset config
- [ ] D1: Publish validation (`publint` + `attw`) — catches broken packages before they hit npm
- [ ] D2: Pre-commit hooks (simple-git-hooks + biome check)

### Add After First Publish (v1.x)

- [ ] D3: Coverage reporting + Codecov — after tests are stable in CI
- [ ] D5: Snapshot releases via `pkg-pr-new` — when external contributors start submitting PRs
- [ ] D6: `preinstall` only-allow pnpm — when more contributors join
- [ ] D7: Knip unused dep detection — after all packages are published and deps stabilize
- [ ] D10: Sherif/manypkg consistency checks — after shared configs are settled
- [ ] D12: Circular dependency detection — after utility extractions from marketplace/indexer

### Future Consideration (v2+)

- [ ] D8: Bundle size tracking — when packages grow large enough to matter
- [ ] D9: Multi-version TS testing — when consumers report TS version issues
- [ ] D11: Keywords in package.json — low priority, add during any package.json update
- [ ] A5: GitHub Releases — when there's demand from consumers who don't use npm directly

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| T4 Shared build config | HIGH | LOW | P1 |
| T5 Shared vitest config | HIGH | LOW | P1 |
| T6+T7 Biome lint+format | HIGH | LOW | P1 |
| T8 CI pipeline | HIGH | MEDIUM | P1 |
| T9 Typecheck CI step | HIGH | LOW | P1 |
| T10 Changesets release | HIGH | MEDIUM | P1 |
| T13+T14+T15+T16+T17 Pkg metadata | HIGH | LOW | P1 |
| T19 Public access | HIGH | LOW | P1 |
| D1 Publish validation | HIGH | LOW | P1 |
| D2 Pre-commit hooks | MEDIUM | LOW | P1 |
| D3 Coverage reporting | MEDIUM | LOW | P2 |
| D4 GitHub changelog attribution | MEDIUM | LOW | P1 (free with changesets) |
| D5 Snapshot releases | MEDIUM | MEDIUM | P2 |
| D6 Only-allow pnpm | LOW | LOW | P2 |
| D7 Knip | MEDIUM | LOW | P2 |
| D10 Consistency checks | MEDIUM | LOW | P2 |
| D12 Circular dep detection | LOW | LOW | P2 |
| D8 Bundle size tracking | LOW | MEDIUM | P3 |
| D9 Multi-TS version testing | LOW | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | viem | Effect-TS | tRPC | drizzle-orm | Our Plan |
|---------|------|-----------|------|-------------|----------|
| **Lint/Format tool** | Biome | ESLint + Prettier | ESLint + Prettier | dprint + ESLint | Biome (follows viem, simplest) |
| **Build system** | tsc (custom scripts) | tsc + custom build-utils | Turbo + custom | tsup + Turbo | unbuild (already working, simpler than tsc scripts) |
| **Test framework** | Vitest | Vitest | Vitest | Vitest | Vitest (already working) |
| **Release system** | Changesets | Changesets | Lerna (publish) | Custom version check | Changesets (standard for independent versioning) |
| **CI checks** | Biome check, build, publint, knip, size-limit, typecheck (multi-TS), test (sharded) | tsc, lint, circular, test (sharded), type testing | Build, typecheck, test+coverage, lint+autofix, semantic PR | Build, test, attw, lint | Typecheck, biome check, build, publint+attw, test |
| **Pre-commit hooks** | simple-git-hooks → biome | None visible | None visible | None visible | simple-git-hooks → biome check |
| **Package validation** | publint + attw + knip + size-limit | None visible | None visible | attw per-package | publint + attw (start lean) |
| **Snapshot releases** | pkg-pr-new on PRs | Snapshot workflow | pkg-pr-new | None visible | pkg-pr-new (add post-v1) |
| **Coverage** | Codecov (v8) | @vitest/coverage-v8 | Codecov | None visible | @vitest/coverage-v8 + Codecov (post-v1) |
| **Monorepo consistency** | sherif | None visible | manypkg | None visible | sherif or manypkg (post-v1) |
| **Task runner** | None (pnpm scripts) | None (pnpm scripts) | Turbo | Turbo | None (pnpm -r, matches viem/effect) |

## CI Pipeline Reference Architecture

Based on patterns across all reference repos, the standard CI pipeline for a library monorepo:

### PR Checks (required to merge)

```
Job: Check (fast, ~2 min)
  - Install deps (cached)
  - Biome check (lint + format)
  - Typecheck (tsc --noEmit)

Job: Build (depends on Check, ~3 min)
  - Install deps (cached)
  - Build all packages
  - Publish validation (publint + attw)

Job: Test (~3 min)
  - Install deps (cached)
  - Run all tests
  - Upload coverage (optional)
```

### Main Branch (on merge)

```
Job: Changesets
  - Run verify workflow (same as PR checks)
  - If changesets pending: create/update version PR
  - If version PR merged: publish to npm
```

### Standard Thresholds

| Metric | Floor | Target | Source |
|--------|-------|--------|--------|
| Test coverage | 70% | 80%+ | Industry standard for libraries |
| CI timeout | — | 10 min | All reference repos use 5-10 min timeouts |
| Biome lint | 0 errors | 0 warnings | viem config: errors for important rules, most recommended rules enabled |

## Changesets Release Flow Reference

Standard flow used by viem and effect:

```
1. Developer makes changes
2. Developer runs `pnpm changeset` → selects affected packages → writes change summary
3. PR includes `.changeset/*.md` file(s)
4. PR merges to main
5. GitHub Action detects changeset files
6. Action creates/updates "Version Packages" PR with:
   - Bumped versions in package.json
   - Updated CHANGELOG.md per package
   - Consumed .changeset files
7. Maintainer reviews and merges version PR
8. GitHub Action publishes changed packages to npm
9. (Optional) GitHub releases created
```

Key config (`changeset/config.json`):
```json
{
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "changelog": ["@changesets/changelog-github", { "repo": "org/repo" }],
  "commit": false
}
```

## Sources

- **viem** (wevm/viem): package.json, biome.json, .github/workflows/verify.yml, changesets.yml, pull-request.yml — HIGH confidence (direct file inspection)
- **Effect-TS** (Effect-TS/effect): package.json, .github/workflows/check.yml, release.yml, .changeset/config.json — HIGH confidence (direct file inspection)
- **tRPC** (trpc/trpc): package.json, .github/workflows/main.yml, lint.yml — HIGH confidence (direct file inspection)
- **drizzle-orm** (drizzle-team/drizzle-orm): package.json, .github/workflows/release-latest.yaml — HIGH confidence (direct file inspection)
- **changesets** (changesets/changesets): package.json — HIGH confidence (direct file inspection)

---
*Feature research for: TypeScript library monorepo infrastructure*
*Researched: 2026-02-27*
