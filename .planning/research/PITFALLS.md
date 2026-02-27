# Pitfalls Research

**Domain:** TypeScript library monorepo infrastructure (build, lint, format, CI, release)
**Researched:** 2026-02-27
**Confidence:** HIGH — based on project codebase analysis, official documentation, and verified ecosystem patterns

## Critical Pitfalls

### Pitfall 1: workspace:* protocol not replaced before npm publish

**What goes wrong:**
pnpm's `workspace:*` protocol (used in `@chillwhales/lsp4` depending on `@chillwhales/utils`) is a local-only specifier. If packages are published to npm with `workspace:*` still in `dependencies`, consumers get unresolvable dependency references — `npm install` fails completely.

**Why it happens:**
Changesets' `changeset version` command replaces `workspace:*` with the actual version range, but only if the dependency package has a changeset or is configured for `updateInternalDependencies`. If you run `npm publish` manually or skip `changeset version`, the protocol leaks into the published `package.json`. Also, pnpm 10 changed default behavior for `workspace:` protocol handling.

**How to avoid:**
- Always publish through `changeset publish`, never `pnpm publish` directly
- Set `"updateInternalDependencies": "patch"` in `.changeset/config.json` so internal dep versions are always updated
- Add a CI check that greps published tarballs for `workspace:` before publishing: `pnpm pack --dry-run | grep "workspace:"` should return nothing
- Use `pnpm publish --dry-run` in CI to verify package contents before actual publish

**Warning signs:**
- `pnpm pack` output still contains `workspace:` in `package.json`
- `changeset version` doesn't bump internal dependency versions
- Consumer `npm install` fails with "No matching version found for @chillwhales/utils@workspace:*"

**Phase to address:**
Release system setup (changesets configuration phase)

---

### Pitfall 2: ESM/CJS dual output with mismatched module resolution

**What goes wrong:**
The packages use `moduleResolution: "bundler"` in tsconfig but publish dual ESM/CJS output. Consumers using `moduleResolution: "node"` or `"node16"` can't resolve the packages because `"bundler"` resolution allows bare specifiers without extensions, which don't work under Node.js native ESM resolution. The `.mjs` files may import from internal paths that work during build but fail at runtime.

**Why it happens:**
`moduleResolution: "bundler"` is the most permissive — it skips validation that Node.js requires (file extensions in imports, `package.json` exports alignment). unbuild handles bundling so imports work within the built output, but the generated `.d.ts` files may reference paths that TypeScript in `"node16"` mode can't resolve.

**How to avoid:**
- Keep `moduleResolution: "bundler"` for development (it works with unbuild)
- Test published packages with a consumer project using `moduleResolution: "node16"` — this is the strictest validator
- The current `declaration: "compatible"` setting in build.config.ts is correct — it generates `.d.ts` (not `.d.mts`/`.d.cts`) which works across resolution modes
- Ensure `exports` map in package.json has `types` condition listed FIRST (current config is correct)
- Verify that `main` field points to CJS entry and `module` field points to ESM entry

**Warning signs:**
- Consumer TypeScript projects using `"node16"` resolution report "Cannot find module" errors
- IDE autocomplete works in the monorepo but breaks in consumer projects
- `tsc --noEmit` passes locally but fails in consumer projects

**Phase to address:**
Build system validation phase — add a consumer smoke test

---

### Pitfall 3: unbuild failOnWarn: false hiding broken builds

**What goes wrong:**
All 8 packages set `failOnWarn: false` in build.config.ts. This suppresses unbuild warnings about missing externals, circular dependencies, unresolved imports, and CJS/ESM interop issues. The build appears to succeed but produces broken output — missing exports, runtime crashes when importing, or incorrect CJS interop.

**Why it happens:**
unbuild (via rollup) generates warnings for legitimate issues: unresolved dependencies, circular refs, and potential CJS default export problems. Setting `failOnWarn: false` is a common "make it build" shortcut that hides real problems.

**How to avoid:**
- Set `failOnWarn: true` in build.config.ts and fix each warning
- Common warnings to expect and fix:
  - "Unresolved dependencies" — add to `externals` in build config
  - "Circular dependency" — refactor the circular import chain
  - "`default` is not exported by module" — fix CJS interop
- If specific warnings are genuinely safe, use rollup's `onwarn` handler to filter only those specific codes rather than suppressing all warnings

**Warning signs:**
- Build succeeds but `dist/` files have `require()` calls for packages that should be external
- Runtime "Cannot read properties of undefined (reading 'default')" errors
- Bundle size unexpectedly large (bundled something that should be external)

**Phase to address:**
Build system phase — enable `failOnWarn: true` and fix warnings before any other infrastructure work

---

### Pitfall 4: First npm publish with wrong access / missing scope config

**What goes wrong:**
`npm publish` for scoped packages (`@chillwhales/*`) defaults to `access: "restricted"` (private/paid). The first publish fails silently or publishes as restricted, making packages invisible to consumers. Changesets also defaults to `"access": "restricted"` in its config.

**Why it happens:**
npm's default for scoped packages is restricted access, requiring a paid organization. Changesets inherits this default. The `.changeset/config.json` must explicitly set `"access": "public"`. Additionally, the npm account must be logged in with 2FA configured, and the `@chillwhales` scope must be claimed on npm.

**How to avoid:**
- Set `"access": "public"` in `.changeset/config.json`
- Claim the `@chillwhales` npm scope before attempting any publish
- Set `NPM_TOKEN` in GitHub Actions secrets with a granular access token that has publish permissions
- Do a dry-run first publish manually: `changeset publish --dry-run`
- Verify npm scope: `npm org ls @chillwhales` or check that the scope is available

**Warning signs:**
- `npm publish` returns 402 (payment required) or 403 (forbidden)
- Package publishes but `npm info @chillwhales/lsp2` shows nothing
- Changesets PR merges but no packages appear on npm

**Phase to address:**
Release system setup — configure changesets and verify npm access before automating

---

### Pitfall 5: Missing package.json files field excludes critical files

**What goes wrong:**
The current `files` field is `["dist", "package.json"]`. Note: `package.json` is always included automatically, so listing it is harmless but redundant. The real risk is forgetting to include `README.md`, `LICENSE`, or `CHANGELOG.md`. More critically, if the build output structure changes (e.g., declarations move to `dist/types/`), consumers get packages without type definitions.

**Why it happens:**
The `files` field is an allowlist — only listed paths are included in the published tarball. If build output restructuring moves files outside `dist/`, they're silently excluded. npm won't error; the package just ships incomplete.

**How to avoid:**
- Always run `pnpm pack --dry-run` or `npm pack --dry-run` and inspect the file list before publishing
- Add `LICENSE` to the `files` array (npm includes it automatically only if at the package root)
- After any build config change, verify the tarball contents
- Add a CI step that checks tarball contents: ensure `.d.ts` files exist, `.mjs` and `.cjs` entry points exist

**Warning signs:**
- `pnpm pack` tarball is suspiciously small
- Consumer TypeScript errors: "Could not find a declaration file for module '@chillwhales/lsp2'"
- `npm info @chillwhales/lsp2` shows the package but `types` field resolves to nothing

**Phase to address:**
Build system phase — add tarball validation to CI

---

### Pitfall 6: Changesets ignoring internal dependency cascading bumps

**What goes wrong:**
When `@chillwhales/lsp2` gets a patch bump, packages that depend on it (`lsp3`, `lsp4`, `lsp23`, `lsp29`) also need version bumps so consumers get the updated dependency. If `updateInternalDependencies` is not set to `"patch"`, downstream packages won't be bumped, meaning consumers pinning `@chillwhales/lsp4@0.1.0` won't get the `lsp2` fix.

**Why it happens:**
Changesets' `updateInternalDependencies` defaults to `"patch"`, which is correct — but if set to `"minor"`, only minor/major bumps cascade. The deeper issue: the dependency graph for this monorepo is 2+ levels deep (lsp2 → lsp4 → utils has shared deps). Changeset authors may forget to include all affected packages in a changeset.

**How to avoid:**
- Explicitly set `"updateInternalDependencies": "patch"` in `.changeset/config.json`
- Map the dependency graph clearly:
  - lsp2 ← lsp3, lsp4, lsp23, lsp29
  - utils ← lsp4, lsp6
  - lsp2 ← lsp4 (lsp4 depends on BOTH lsp2 and utils)
- Use `changeset status` in CI to verify all expected packages are being bumped
- Consider using changesets' `linked` config if LSP packages should share major versions

**Warning signs:**
- `changeset version` bumps only 1 package when 4 should be bumped
- Consumer gets version conflict: `@chillwhales/lsp4@0.1.1` depends on `@chillwhales/lsp2@^0.1.1` but only `0.1.0` is published
- `changeset status` shows fewer packages than expected

**Phase to address:**
Release system setup — configure and validate cascading behavior

---

### Pitfall 7: Build order not respecting dependency graph

**What goes wrong:**
`pnpm -r build` runs builds in topological order by default, but only if the dependency relationships are correctly declared in `package.json`. If a package imports from a workspace sibling without declaring it as a dependency (relying on hoisted `node_modules`), the build may succeed locally but fail in CI with clean installs, or produce output with unresolved imports.

**Why it happens:**
pnpm's strict isolation means packages can only access declared dependencies. But during development with `node_modules` hoisting, undeclared dependencies can accidentally work. In CI with `--frozen-lockfile`, these phantom dependencies surface. Additionally, unbuild's bundling mode may inline code from undeclared dependencies without error.

**How to avoid:**
- Verify every cross-package import has a corresponding `dependencies` entry in `package.json`
- Use `pnpm -r build` (not parallel) — it respects topological order
- In CI, always use `pnpm install --frozen-lockfile`
- Consider adding `pnpm --filter` commands for selective builds during development
- Current declared dependencies look correct: lsp3→lsp2, lsp4→lsp2+utils, lsp6→utils, lsp23→lsp2, lsp29→lsp2

**Warning signs:**
- CI build fails but local build passes
- Build output references `require('@chillwhales/lsp2')` inside the bundle (should be external)
- `pnpm why @chillwhales/lsp2` from lsp3 package shows it coming from hoisting, not direct dependency

**Phase to address:**
CI pipeline phase — enforce strict dependency resolution

---

## Moderate Pitfalls

### Pitfall 8: Biome v2 major breaking changes from v1 documentation

**What goes wrong:**
Biome v2 (current latest) restructured its configuration significantly from v1. Online tutorials, Stack Overflow answers, and even some official docs may reference v1 config shape. Using v1 config in v2 causes silent config ignoring or unexpected lint behavior.

**Why it happens:**
Biome v2 introduced "domains" for rule categorization, changed how overrides work, and restructured rule groups. The migration path is well-documented but the internet is full of v1 examples.

**How to avoid:**
- Always reference `biomejs.dev` docs with the version selector set to "v2.x"
- Use `biome migrate` when upgrading — it handles config transformation
- Start fresh with `biome init` rather than copying config from other projects (unless verified v2)
- Since this project has no existing eslint/prettier config, just use `biome init` for a clean v2 config

**Warning signs:**
- `biome check` runs but catches fewer issues than expected
- Config keys like `"linter.rules.nursery"` that don't exist in v2
- Biome warns about unknown configuration keys

**Phase to address:**
Linting/formatting setup phase

---

### Pitfall 9: Biome lacking specific ESLint rules for TypeScript libraries

**What goes wrong:**
Biome doesn't implement every ESLint rule. For TypeScript library authoring, some important rules are missing or behave differently:
- No equivalent to `@typescript-eslint/explicit-module-boundary-types` (enforce return types on public API)
- No equivalent to `@typescript-eslint/no-explicit-any` strict mode variations
- Import sorting behaves differently from `eslint-plugin-import`

**Why it happens:**
Biome implements rules from scratch in Rust. Coverage is good (~300+ rules) but not 1:1 with ESLint ecosystem. Library authors have stricter needs around public API types than app developers.

**How to avoid:**
- Accept that Biome won't cover every TypeScript-specific rule
- For critical library-authoring rules not in Biome, rely on `tsc --strict` (already enabled) to catch type issues
- Use Biome for what it does well: formatting, import organization, correctness rules, suspicious code detection
- Don't try to replicate every eslint-typescript rule — diminishing returns

**Warning signs:**
- Public API functions shipping without return type annotations (reduces consumer DX)
- `any` types leaking into public `.d.ts` files
- Import order inconsistencies between packages

**Phase to address:**
Linting/formatting setup phase — document which checks Biome handles vs TypeScript compiler

---

### Pitfall 10: CI not caching pnpm store correctly

**What goes wrong:**
GitHub Actions CI runs take 3-5+ minutes because pnpm re-downloads all dependencies on every run. The default `actions/cache` setup for pnpm requires knowing the store path, which differs between pnpm versions and OS. Incorrect cache keys cause cache misses on every run.

**Why it happens:**
pnpm's global store path changed in different versions. Using `actions/setup-node` with `cache: 'pnpm'` handles this automatically, but only if `pnpm-lock.yaml` is committed and the `corepack enable` step runs before `setup-node`. Missing any of these steps breaks caching silently — CI still works but is slow.

**How to avoid:**
- Use `pnpm/action-setup` to install pnpm, then `actions/setup-node` with `cache: 'pnpm'`
- Always commit `pnpm-lock.yaml` (already done)
- Use `pnpm install --frozen-lockfile` in CI (never `pnpm install` alone)
- Cache Biome binary separately — it's a single binary download, not part of node_modules
- Consider caching `dist/` build output between CI steps if using matrix builds

**Warning signs:**
- CI install step consistently takes >60 seconds
- "Cache not found" messages in CI logs
- pnpm store is in an unexpected location

**Phase to address:**
CI pipeline phase

---

### Pitfall 11: Shared config package creating circular dependency trap

**What goes wrong:**
Creating a shared config package (e.g., `@chillwhales/config`) that exports tsconfig, build config, and vitest config creates a new dependency that all packages must depend on. If the config package itself needs to be built, it must be built first. If it has any runtime dependencies, those cascade to every package. Changes to shared config force rebuilding all packages.

**Why it happens:**
Over-abstraction. The impulse is to DRY up 8 identical `build.config.ts` files. But config files are inert — they're read at build time, not shipped to consumers. Sharing them via a package adds publishing complexity for zero consumer benefit.

**How to avoid:**
- For tsconfig: use `extends` with a path reference to `../../tsconfig.base.json` (already works, no package needed)
- For build.config.ts: keep copies in each package — they're 10 lines and rarely change. If you must share, use a file-copy script, not a published package
- For vitest.config.ts: use a shared vitest workspace config at the root, or keep simple per-package configs
- If creating a shared config package, mark it `"private": true` so it's never published to npm

**Warning signs:**
- Shared config package appears in the dependency graph of published packages
- Changing a lint rule requires a version bump of the config package and all consumers
- Build fails because shared config package isn't built yet

**Phase to address:**
Shared config phase — prefer file references over package dependencies

---

### Pitfall 12: Extracting code from external repos breaking their build

**What goes wrong:**
Extracting utilities from `chillwhales/marketplace` and `chillwhales/lsp-indexer` into this monorepo means those repos must be updated to import from `@chillwhales/*` packages instead. If the extraction and consumer migration aren't coordinated, the external repos break. If the extracted API doesn't exactly match what consumers expect, refactoring cascades through the consumer codebase.

**Why it happens:**
Code in consumer repos was written for that specific context — it may use internal types, framework-specific patterns, or rely on ambient type declarations. Extracting it into a standalone library requires making it context-independent, which often means API changes.

**How to avoid:**
- Before extracting, catalog every function/type used in the consumer repos and their call signatures
- Extract with identical API first — refactor later in a separate PR
- Use TypeScript's `--declaration` output from the consumer repo to verify API compatibility
- Publish the new packages before updating consumers (consumers can install from npm)
- Keep extraction PRs small: one utility group per PR, not everything at once
- Have both consumer repos' CI passing before considering extraction complete

**Warning signs:**
- Extracted function has different parameter types than consumer expects
- Consumer repo tests fail after switching to `@chillwhales/*` import
- Functions that work in extraction repo rely on ambient types (e.g., `viem` globals) not available to all consumers

**Phase to address:**
External code extraction phase — last phase, after packages are published and stable

---

### Pitfall 13: pnpm 10 breaking changes for workspace protocol and publishing

**What goes wrong:**
pnpm 10 changed several defaults that affect monorepo publishing:
- `save-workspace-protocol` defaults changed
- `link-workspace-packages` behavior changed
- `publish` command handling of workspace protocol updated
- Some behaviors around `workspace:^` vs `workspace:*` vs `workspace:~` differ

**Why it happens:**
pnpm 10 is relatively new (the project explicitly uses `pnpm@10.30.2`). Many guides and tutorials reference pnpm 8 or 9 behavior.

**How to avoid:**
- Use `workspace:*` consistently (current project does this correctly)
- Verify that `changeset publish` correctly replaces `workspace:*` with actual versions by testing with `changeset version` then inspecting package.json changes
- Pin `packageManager` field (already done: `pnpm@10.30.2`)
- In CI, use `corepack enable` to ensure exact pnpm version match

**Warning signs:**
- `pnpm install` behaves differently in CI vs locally
- `workspace:*` replaced with unexpected version range after `changeset version`
- `pnpm publish` refuses to publish or publishes wrong content

**Phase to address:**
Release system setup phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `failOnWarn: false` in all build configs | Build succeeds without investigating warnings | Hides real issues — broken CJS interop, missing externals, circular deps | Never for published libraries |
| Duplicated build.config.ts across packages | No shared config dependency, simple | 8 files to update if build config needs changing | Acceptable — config files are small and stable |
| Starting all packages at `0.1.0` | Signals pre-release, allows breaking changes | Semver `0.x` allows breaking changes in any version — consumers can't rely on stability | Acceptable for initial development, plan migration to `1.0.0` |
| Using `main`/`module` fields alongside `exports` | Backward compat with older bundlers | Maintenance burden of two module resolution systems | Acceptable until `exports` is universally supported |
| Single entry point (`src/index`) per package | Simple build, simple exports | Can't tree-shake unused parts of a package | Acceptable for small packages; review if packages grow large |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Changesets + GitHub Actions | Using `GITHUB_TOKEN` for both PR creation and npm publish | Use `GITHUB_TOKEN` for changesets PR, separate `NPM_TOKEN` secret for `changeset publish` |
| Changesets + pnpm workspace | Not running `pnpm install` after `changeset version` (lockfile out of sync) | Changesets action runs `pnpm install` automatically; manual workflow must include it |
| Biome + VS Code | Installing Biome extension but editor uses project's node_modules biome | Pin Biome version in `package.json` devDependencies; extension uses it automatically |
| Biome + CI | Using `biome check` in CI instead of `biome ci` | Use `biome ci` — it disables `--write`, integrates with GitHub annotations, and respects VCS changes |
| unbuild + peer dependencies | Not marking `viem` as external — gets bundled into output | unbuild auto-externalizes `dependencies` and `peerDependencies`, but verify with bundle analysis |
| npm publish + 2FA | Automated publish fails because npm account requires OTP | Use granular access tokens with `automation` type — bypasses 2FA for CI |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running `pnpm -r build` without caching in CI | CI takes 2-3 min for builds | Cache `dist/` between workflow steps or only rebuild changed packages | At 15+ packages |
| Installing all devDependencies for every CI job | Slow install, large cache | Use `--frozen-lockfile` and cache pnpm store | At 500+ dependencies |
| Biome checking node_modules or dist | Biome scans thousands of files, takes 30+ seconds | Configure `files.ignore` in biome.json: `["**/dist", "**/node_modules"]` | At any scale |
| Running all tests when only one package changed | 8-package test suite runs for every PR | Use `pnpm -r --filter ...[HEAD~1] test` to test only changed packages and dependents | At 10+ packages or slow tests |

## "Looks Done But Isn't" Checklist

- [ ] **Build output:** `.d.ts` files exist in tarball — verify with `pnpm pack --dry-run`
- [ ] **Exports map:** CJS consumer can `require('@chillwhales/lsp2')` without error — test in a Node.js CJS script
- [ ] **Exports map:** ESM consumer can `import {} from '@chillwhales/lsp2'` without error — test in a Node.js ESM script with `"type": "module"`
- [ ] **Types:** Consumer IDE autocomplete works for all exported types — test in VS Code with a separate project
- [ ] **Peer deps:** Consumer without `viem` installed gets a clear warning, not a runtime crash
- [ ] **Changesets:** `changeset version` bumps ALL affected packages, not just the one with the changeset
- [ ] **CI:** Merging the changesets release PR triggers publish — verify the GitHub Action workflow trigger is correct
- [ ] **npm access:** Published packages are visible at `npmjs.com/package/@chillwhales/lsp2` after first publish
- [ ] **Biome:** `biome ci .` catches the same issues locally as in CI — run both and compare
- [ ] **Biome formatting:** All files are formatted consistently — initial `biome format --write .` creates a baseline

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Published with `workspace:*` in dependencies | HIGH | `npm unpublish` within 72h, fix changeset config, republish with incremented version |
| Published without `.d.ts` files | MEDIUM | Patch version bump, fix `files` field, republish |
| Wrong `access` on first publish (restricted) | LOW | `npm access public @chillwhales/lsp2` to fix, no version bump needed |
| Biome formatting creates massive diff | LOW | Single commit "format codebase with biome", do it before any feature PRs are open |
| Extracted code breaks consumer repo | MEDIUM | Revert consumer repo to old code, fix library API, re-extract |
| Build warnings hidden by `failOnWarn: false` | MEDIUM | Enable `failOnWarn: true`, fix each warning, may require refactoring circular deps |
| CI cache poisoned (wrong dependencies cached) | LOW | Delete GitHub Actions cache via API or UI, re-run CI |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| workspace:* leaking to npm | Release setup | `pnpm pack --dry-run` shows no `workspace:` in any package.json |
| ESM/CJS resolution mismatch | Build validation | Consumer smoke test passes with `moduleResolution: "node16"` |
| failOnWarn: false hiding issues | Build system (first phase) | All packages build with `failOnWarn: true` |
| npm access/scope config | Release setup | `npm access ls-packages @chillwhales` returns expected packages |
| Missing files in tarball | Build validation | CI step checks tarball contains `.d.ts`, `.mjs`, `.cjs` |
| Internal dependency cascading | Release setup | `changeset status` shows correct cascade for test changeset |
| Build order in CI | CI pipeline | Clean CI build passes with `--frozen-lockfile` |
| Biome v2 config | Lint/format setup | `biome ci .` exits 0 with expected rule set |
| Missing Biome rules | Lint/format setup | Document which checks are Biome vs `tsc --strict` |
| pnpm store caching | CI pipeline | CI install step takes <30 seconds on cache hit |
| Shared config over-abstraction | Config sharing | Config package is `private: true` or uses file refs |
| External code extraction breaks consumers | Extraction (last phase) | Consumer repo CI passes after switching to `@chillwhales/*` imports |
| pnpm 10 workspace protocol changes | Release setup | `changeset version` + `changeset publish` dry-run succeeds |

## Sources

- Changesets config documentation: https://github.com/changesets/changesets/blob/main/docs/config-file-options.md (HIGH confidence)
- Biome v2 migration guide: https://biomejs.dev/guides/upgrade-to-biome-v2 (HIGH confidence)
- Biome CI recipes: https://biomejs.dev/recipes/continuous-integration/ (HIGH confidence)
- Biome ESLint migration: https://biomejs.dev/guides/migrate-eslint-prettier/ (HIGH confidence)
- npm scoped packages access: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages (HIGH confidence)
- Node.js ESM/CJS interop: https://nodejs.org/api/packages.html#dual-commonjses-module-packages (HIGH confidence)
- pnpm workspace protocol: https://pnpm.io/workspaces (HIGH confidence)
- unbuild documentation: https://github.com/unjs/unbuild (MEDIUM confidence — less official docs)
- Project codebase analysis: all 8 package.json files, build.config.ts files, tsconfig.base.json (HIGH confidence)

---
*Pitfalls research for: TypeScript library monorepo infrastructure*
*Researched: 2026-02-27*
