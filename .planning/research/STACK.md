# Stack Research

**Domain:** TypeScript library monorepo infrastructure (build, lint, format, release, coverage)
**Researched:** 2026-02-27
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| unbuild | ^3.6.1 (keep) | Library bundler (ESM + CJS + .d.ts) | Already in use, best fit for pure TS libraries. Convention-over-config, auto-externals from package.json, `declaration: "compatible"` generates both .d.ts and .d.cts. Rollup-based with mkdist for declarations. Maintained by UnJS (Nuxt ecosystem). |
| @biomejs/biome | ^2.4.x | Linting + Formatting | Single binary, 10-30x faster than ESLint+Prettier. v2 (June 2025) added type-aware rules, monorepo support with nested configs, import organizer, plugins via GritQL. v2.4 (Feb 2026) is latest stable. Replaces ESLint + Prettier for this project. |
| @changesets/cli | ^2.29.x | Versioning + Changelogs + npm publishing | Industry standard for monorepo independent versioning. Used by Astro, Remix, Biome, pnpm, SvelteKit, Apollo Client. GitHub Action for automated release PRs. 11.5k GitHub stars, 182 contributors. |
| @vitest/coverage-v8 | ^4.0.x | Code coverage | Native V8 coverage provider for Vitest. Since Vitest 3.2, uses AST-based remapping producing identical reports to Istanbul. Faster than Istanbul, lower memory, no pre-instrumentation. Recommended by Vitest docs. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @changesets/changelog-github | ^0.5.x | Changelog format with GitHub PR/author links | Always — enriches changelogs with contributor attribution |
| changesets/action (GH Action) | v1 | Automated release PRs and npm publish | CI — creates "Version Packages" PR, optionally publishes on merge |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome CLI | `biome check --write` replaces lint+format | Configure via `biome.json` at root. Use `"extends": "//"` in package-level overrides. |
| Biome VS Code Extension | Editor integration | v3 released May 2025, supports multi-workspace monorepos |
| GitHub Actions | CI pipeline | Lint, test, build, coverage, changesets release |

## Detailed Analysis

### 1. Build System: Keep unbuild

**Confidence: HIGH** (verified via GitHub releases, current project usage)

**Why unbuild wins for this project:**

- **Convention-over-config**: Reads `package.json` exports field to determine entry points and output formats. Minimal `build.config.ts` needed (the project already has 11-line configs).
- **Dual format just works**: `rollup.emitCJS: true` + default ESM output = `.mjs` + `.cjs` files. No manual output configuration.
- **Declaration generation**: `declaration: "compatible"` generates `.d.ts` (ESM) + `.d.cts` (CJS) — important for consumers using different `moduleResolution` settings.
- **Auto-externalization**: Automatically externalizes dependencies and peerDependencies from `package.json`. Critical for library packages.
- **Stub mode**: `unbuild --stub` creates JIT-compiled entry points for development — faster inner-loop than watch mode for library development.
- **Active maintenance**: v3.6.1 (Aug 2025) is latest. Steady release cadence throughout 2025. Part of UnJS ecosystem (same team as Nuxt).

**What about switching costs?** Zero. Already using unbuild with working configs. No reason to change.

#### Build Tool Comparison Matrix

| Feature | unbuild ^3.6.1 | tsup ^8.5.1 | tsdown ^0.20.3 |
|---------|----------------|-------------|----------------|
| **Engine** | Rollup | esbuild | Rolldown (Rust) |
| **ESM + CJS** | Built-in (`emitCJS`) | Built-in (`format`) | Built-in |
| **Declarations** | mkdist (own) | `--dts` (experimental, uses rollup-plugin-dts) | Oxc-based (own) |
| **.d.cts generation** | Yes (`declaration: "compatible"`) | Yes (v8.5+) | Yes |
| **Auto externals** | From package.json | Manual or `--external` | From package.json |
| **Config complexity** | Low (11 lines) | Low-Medium | Low |
| **Stability** | Stable (v3, production) | Stable (v8, production) | **Pre-1.0 (v0.20.3)** |
| **Speed** | Good (Rollup) | Fast (esbuild) | Fastest (Rust) |
| **Monorepo support** | Good | Good | Good |
| **Stars** | 2.7k | 11.1k | 3.5k |
| **Ecosystem** | UnJS/Nuxt | Independent (egoist/sxzz) | VoidZero (Vite/Vitest team) |

**Why NOT tsdown (yet):**
- Still pre-1.0 (v0.20.3 as of Feb 2026). API surface is not stable.
- Impressive adopters (Vite, Vitest, Vercel, ESLint, Prettier) but still rapid-iteration phase with 168 releases in ~1 year.
- Worth watching. When tsdown hits 1.0, it will likely become the default recommendation due to Rolldown speed + Oxc declarations.
- For now: unnecessary migration risk for a working unbuild setup.

**Why NOT tsup:**
- Would work fine but offers no advantage over unbuild for this use case.
- `--dts` has historically been problematic (experimental flag, uses rollup-plugin-dts).
- 347 open issues. Maintained primarily by sxzz (Kevin Deng, same person behind tsdown).
- esbuild-based, which means no tree-shaking of declarations.
- Switching from unbuild to tsup would be a lateral move with migration cost and no benefit.

**Why NOT pkgroll:**
- 404 on GitHub (nicolo-ribaudo/pkgroll is incorrect; it's `privatenumber/pkgroll`).
- Much smaller community (~1k stars). Less ecosystem support.
- Rollup-based like unbuild but with less convention-over-config.

### 2. Biome: Replace ESLint + Prettier

**Confidence: HIGH** (verified via biomejs.dev blog posts through Feb 2026, roadmap 2026)

**Current state (v2.4, Feb 2026):**

- **Formatting**: Handles JS/TS/JSX/TSX/JSON/CSS/GraphQL. Prettier-compatible output for JS/TS. HTML formatter experimental.
- **Linting**: 300+ rules covering ESLint core, typescript-eslint, import, a11y. Type-aware rules without requiring `tsc` (Biome's own inference engine, sponsored by Vercel).
- **Monorepo support**: Nested `biome.json` files with `"extends": "//"` to inherit from root config. Exactly what this project needs.
- **Import organization**: v2 revamped import organizer with custom groups, import merging, blank-line-aware sorting. Replaces `eslint-plugin-import/order` and `@trivago/prettier-plugin-sort-imports`.
- **Speed**: Single Rust binary. 10-30x faster than ESLint + Prettier combined. No node_modules dependency tree.
- **Plugins**: GritQL-based plugins for custom lint rules if needed.
- **15M+ monthly npm downloads** as of late 2025.

**What's missing (acceptable for this project):**

- No SCSS support (in 2026 roadmap, not relevant for TS library packages)
- Markdown formatting not yet available (in 2026 roadmap)
- Type-aware rules cover ~75% of `typescript-eslint` detection (improving rapidly)
- Some niche ESLint plugin rules may not have equivalents

**Why this is fine for @chillwhales:**
- Pure TypeScript library packages. No React/Vue/Svelte. No HTML. No SCSS.
- Core JS/TS linting and formatting is fully covered.
- The project has NO existing ESLint/Prettier config to migrate from — clean slate.

**Configuration approach:**
```json
// biome.json (root)
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "rules": { "recommended": true }
  },
  "organizeImports": { "enabled": true }
}
```

### 3. Changesets: Independent Versioning + Release Automation

**Confidence: HIGH** (verified via GitHub repo, docs, widespread adoption)

**How it works:**

1. **Developer workflow**: Run `pnpm changeset` to create a changeset file (markdown in `.changeset/` dir) describing what changed and the semver bump type (patch/minor/major).
2. **Version command**: `pnpm changeset version` consumes all changesets, bumps package.json versions, updates CHANGELOGs, handles inter-package dependency updates.
3. **Publish command**: `pnpm changeset publish` runs `npm publish` for all packages with new versions.

**Key config for independent versioning:**
```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- `"fixed": []` — empty means independent versioning (each package versions separately)
- `"linked": []` — no linked groups (packages can diverge in version)
- `"access": "public"` — needed for scoped packages (`@chillwhales/*`)
- `"updateInternalDependencies": "patch"` — when a dependency bumps, dependents get a patch bump

**GitHub Actions integration (`changesets/action`):**
- On push to main: creates/updates a "Version Packages" PR with all pending version bumps
- On merge of that PR: publishes to npm automatically
- Minimal config: ~30 lines of GitHub Actions YAML

**npm publish requires:** `NPM_TOKEN` secret in GitHub repo settings.

### 4. Coverage: Vitest V8 Provider

**Confidence: HIGH** (verified via vitest.dev/guide/coverage, Feb 2026)

**Recommendation: `@vitest/coverage-v8`**

- **Default provider** in Vitest. Just add `--coverage` flag.
- Since Vitest 3.2: **AST-based coverage remapping** produces identical reports to Istanbul. Speed of V8 + accuracy of Istanbul.
- No pre-instrumentation step. Source files execute as-is.
- Lower memory usage than Istanbul.
- Integrates with Vitest UI for visual coverage reports.

**Configuration:**
```ts
// vitest.config.ts (or in vitest workspace)
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
})
```

**Why NOT Istanbul:** Slower (requires pre-instrumentation via Babel), higher memory, no advantage since Vitest 3.2 made V8 accuracy equivalent.

**Why NOT c8:** `c8` is an older standalone V8 coverage tool. `@vitest/coverage-v8` is Vitest's native integration of the same V8 coverage APIs with better integration, AST remapping, and active maintenance.

## Installation

```bash
# Already installed (keep)
# unbuild, vitest, typescript are already devDependencies in each package

# New: Biome (root devDependency)
pnpm add -Dw @biomejs/biome

# New: Changesets (root devDependencies)
pnpm add -Dw @changesets/cli @changesets/changelog-github

# New: Coverage (root or per-package devDependency)
pnpm add -Dw @vitest/coverage-v8
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| unbuild | tsdown | When tsdown reaches 1.0 and you want Rolldown speed for large codebases. Worth re-evaluating in late 2026. |
| unbuild | tsup | If you need esbuild-specific features (e.g., JSX transform for React libraries). Not relevant here. |
| Biome | ESLint + Prettier | If you need niche ESLint plugins (e.g., eslint-plugin-react-hooks, eslint-plugin-tailwind). Not relevant for pure TS libraries. |
| Biome | oxlint | If you want only linting without formatting. Biome does both; oxlint is lint-only and less mature for configuration. |
| @changesets/cli | semantic-release | If you want fully automated versioning from commit messages. Changesets gives explicit human control which is better for libraries with public APIs. |
| @changesets/cli | lerna-lite | If you need Lerna-style commands. Changesets is simpler and more widely adopted for independent versioning. |
| @vitest/coverage-v8 | @vitest/coverage-istanbul | If targeting non-V8 runtimes (Firefox, Bun). Not relevant for Node.js library testing. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ESLint + Prettier | Two tools, complex config, plugin dependency hell, slower. No existing setup to preserve. | Biome (single tool, single config, 10-30x faster) |
| c8 (standalone) | Older tool, not integrated with Vitest's reporting/UI. Vitest's V8 provider wraps the same V8 APIs better. | @vitest/coverage-v8 |
| tsdown (today) | Pre-1.0, API not stable, unnecessary migration risk. Current unbuild works perfectly. | unbuild (already working) |
| semantic-release | Over-automates versioning via commit messages. Poor fit for libraries where humans should decide semver bumps. | @changesets/cli (explicit changeset files) |
| lerna / nx | Heavyweight monorepo orchestrators. Overkill for 8 packages with simple dependency graph. pnpm workspaces handles orchestration. | pnpm workspaces (already in use) + changesets |
| rollup (raw) | Requires extensive manual config for library output. unbuild is rollup with sane defaults. | unbuild |
| tsc (for building) | Only emits JS, no bundling, no CJS interop handling, slow. Fine for type-checking only. | unbuild (build) + tsc/biome (type-checking/linting) |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| unbuild ^3.6.1 | TypeScript ^5.9.3 | Uses mkdist for declarations, handles TS 5.x features |
| @biomejs/biome ^2.4.x | TypeScript ^5.x projects | Biome has its own parser; doesn't run tsc. Understands TS 5.x syntax. |
| @changesets/cli ^2.29.x | pnpm workspaces | Works with pnpm workspace protocol. Handles scoped packages. |
| @vitest/coverage-v8 ^4.0.x | vitest ^4.0.x | Must match Vitest major version. Both at v4. |
| Biome v2.x | Node >= 18 | Binary supports Linux/macOS/Windows. Node 18+ for CLI. |

## Sources

- https://github.com/unjs/unbuild/releases — unbuild release history through v3.6.1 (Aug 2025). **HIGH confidence.**
- https://github.com/egoist/tsup/releases — tsup release history through v8.5.1 (Nov 2025). **HIGH confidence.**
- https://github.com/rolldown/tsdown — tsdown repo (v0.20.3, Feb 2026), 3.5k stars. **HIGH confidence.**
- https://tsdown.dev/guide/ — tsdown docs, VoidZero/Rolldown official project. **HIGH confidence.**
- https://biomejs.dev/blog/biome-v2/ — Biome v2 release (Jun 2025), type-aware linting, monorepo support, plugins. **HIGH confidence.**
- https://biomejs.dev/blog/biome-v2-4/ — Biome v2.4 (Feb 2026), latest stable. **HIGH confidence.**
- https://biomejs.dev/blog/roadmap-2026/ — Biome 2026 roadmap (Jan 2026). **HIGH confidence.**
- https://github.com/changesets/changesets — Changesets repo, 11.5k stars, 756 forks, active. **HIGH confidence.**
- https://vitest.dev/guide/coverage — Vitest v4 coverage docs, V8 and Istanbul providers. **HIGH confidence.**

---
*Stack research for: TypeScript library monorepo infrastructure*
*Researched: 2026-02-27*
