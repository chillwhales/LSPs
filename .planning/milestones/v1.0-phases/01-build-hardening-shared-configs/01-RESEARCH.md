# Phase 1: Build Hardening & Shared Configs - Research

**Researched:** 2026-02-27
**Domain:** unbuild shared configs, vitest workspace, pnpm catalogs, monorepo build tooling
**Confidence:** HIGH

## Summary

This research covers the five key technical areas needed to plan Phase 1: unbuild preset/factory patterns, Vitest 4.x project configuration (replacing deprecated workspace), pnpm catalog syntax, unbuild warning types and `failOnWarn` behavior, and internal workspace package structuring with subpath exports.

The current codebase has 8 packages with identical `build.config.ts` and `vitest.config.ts` files — perfect candidates for extraction into a shared config package. All 8 build configs use `failOnWarn: false`, which must be flipped to `true` after warnings are resolved. The Vitest version (^4.0.17) uses `projects` instead of the deprecated `workspace` — this is a critical finding that changes the planned approach from `vitest.workspace.ts` to `vitest.config.ts` with `test.projects`.

**Primary recommendation:** Create `packages/config` with a `createBuildConfig()` factory using unbuild's `definePreset`/`defineBuildConfig` and a `createVitestConfig()` factory using Vitest's `defineProject`. Use `vitest.config.ts` (NOT `vitest.workspace.ts`) at the root with `test.projects: ['packages/*']` since the project uses Vitest 4.x where `workspace` is deprecated.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Create an internal workspace package: `@chillwhales/config` under `packages/config`
- Marked `"private": true` — never published to npm
- Houses all shared configs (build, vitest, tsconfig now; biome, commitlint in later phases)
- Preset factory pattern for JS/TS configs: `createBuildConfig()`, `createVitestConfig()`
- Native `"extends"` for tsconfig: `"extends": "@chillwhales/config/tsconfig.base.json"`
- Subpath exports for each config type: `@chillwhales/config/build`, `@chillwhales/config/vitest`, `@chillwhales/config/tsconfig`
- Each package's `build.config.ts` and `vitest.config.ts` become thin 2-liners calling the preset factory
- Single default catalog in `pnpm-workspace.yaml` (no named catalogs)
- Threshold: any dependency shared by 2+ packages goes in the catalog
- Includes all shared devDependencies: `typescript`, `unbuild`, `vitest`
- Includes shared runtime dependencies: `zod`, `viem`
- Includes blockchain ecosystem deps: `@erc725/erc725.js`, `@lukso/*` packages
- `@chillwhales/config` itself uses `catalog:` for its own dependencies
- Fix all existing warnings first, then flip `failOnWarn: true`
- Validate in dependency order: leaf packages first (`utils`, `lsp2`, `lsp30`), then dependents
- If a warning can't be fixed, suppress explicitly with a comment and upstream issue link
- Vitest workspace config at root using glob pattern `['packages/*']` for auto-discovery
- Per-package test scripts retained
- Per-package `vitest.config.ts` calls `createVitestConfig()` from `@chillwhales/config/vitest`
- Minimal preset: `globals: true`, `environment: "node"`

### Claude's Discretion
- Exact subpath export configuration in config package's `package.json`
- Preset factory function signatures and default values
- Order of operations within the implementation (as long as dependency order is respected for warning fixes)
- How to handle the inconsistent quote style across existing configs (lsp29/lsp30 use single quotes, others use double)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| unbuild | ^3.6.1 | Build tool | Already in use; `defineBuildConfig` and `definePreset` are the official config APIs |
| vitest | ^4.0.17 | Test runner | Already in use; v4 uses `projects` instead of deprecated `workspace` |
| pnpm | 10.30.2 | Package manager | Already in use; catalogs are a first-class pnpm 10.x feature |
| typescript | ^5.9.3 | Type system | Already in use across all packages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest/config | (from vitest) | `defineConfig`, `defineProject`, `mergeConfig` | Root config and per-package configs |
| unbuild (types) | (from unbuild) | `BuildConfig`, `BuildPreset`, `definePreset` | Shared build config factory |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `vitest.workspace.ts` | `vitest.config.ts` with `test.projects` | **Must use `projects`** — `workspace` is deprecated since Vitest 3.2, removed path in 4.0 |

## Architecture Patterns

### Recommended Config Package Structure
```
packages/config/
├── package.json          # private, subpath exports
├── src/
│   ├── build.ts          # createBuildConfig() factory
│   └── vitest.ts         # createVitestConfig() factory
└── tsconfig.base.json    # shared tsconfig (copied from root)
```

### Pattern 1: unbuild Preset Factory (`createBuildConfig`)

**What:** A factory function that returns a `BuildConfig` array using unbuild's `defineBuildConfig`. The factory uses `definePreset` internally to define shared defaults and accepts per-package overrides via `defu`-style merging.

**When to use:** Every package's `build.config.ts`

**How it works (from unbuild source):**

unbuild's `definePreset` is a simple identity function:
```typescript
// Source: https://github.com/unjs/unbuild/blob/main/src/types.ts
export function definePreset(preset: BuildPreset): BuildPreset {
  return preset;
}
```

A `BuildPreset` is either a `BuildConfig` object or a function that returns one:
```typescript
export type BuildPreset = BuildConfig | (() => BuildConfig);
```

The preset is resolved and merged using `defu` (deep defaults) in the build pipeline. The merge order is:
```
buildConfig > pkg.unbuild > inputConfig > preset > hardcoded defaults
```

This means values set in the per-package `build.config.ts` override preset values (earlier = higher priority with defu).

**CRITICAL FINDING:** unbuild's hardcoded defaults include `failOnWarn: true` (as of current source). This means the current `failOnWarn: false` in each package is actively overriding the default. When creating the shared preset with `failOnWarn: true`, we are simply restoring the default behavior.

**Recommended factory implementation:**

```typescript
// packages/config/src/build.ts
import { defineBuildConfig } from "unbuild";
import type { BuildConfig } from "unbuild";

export function createBuildConfig(overrides: BuildConfig = {}): BuildConfig[] {
  return defineBuildConfig({
    entries: ["src/index"],
    declaration: "compatible",
    clean: true,
    failOnWarn: true,
    rollup: {
      emitCJS: true,
    },
    ...overrides,
  });
}
```

**Per-package consumer (2-liner):**
```typescript
// packages/lsp2/build.config.ts
import { createBuildConfig } from "@chillwhales/config/build";

export default createBuildConfig();
```

**Confidence:** HIGH — verified from unbuild source code at `src/types.ts`, `src/build.ts`

### Pattern 2: Vitest Project Config Factory (`createVitestConfig`)

**What:** A factory function that returns a Vitest project configuration using `defineProject` (NOT `defineConfig`).

**CRITICAL FINDING — Vitest 4.x migration:**
- `vitest.workspace.ts` is **deprecated** since Vitest 3.2 and functionally replaced in 4.0
- The new API uses `test.projects` in `vitest.config.ts`
- Per-package configs should use `defineProject` (NOT `defineConfig`) for proper type safety — `defineProject` excludes unsupported options like `reporters` and `coverage`
- Configuration is NOT inherited from root config by default; each project is independent unless `extends: true` is used

**Root config (vitest.config.ts, NOT vitest.workspace.ts):**
```typescript
// vitest.config.ts (root)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
  },
});
```

When using `projects: ['packages/*']`, Vitest treats every folder in `packages` as a separate project. It auto-discovers `vitest.config.ts` or `vite.config.ts` files in each folder. Project names default to the `"name"` field in the nearest `package.json`.

**Recommended factory implementation:**
```typescript
// packages/config/src/vitest.ts
import { defineProject } from "vitest/config";
import type { UserProjectConfigExport } from "vitest/config";

export function createVitestConfig(overrides: Record<string, unknown> = {}): UserProjectConfigExport {
  return defineProject({
    test: {
      globals: true,
      environment: "node",
      ...overrides,
    },
  });
}
```

**Per-package consumer (2-liner):**
```typescript
// packages/lsp2/vitest.config.ts
import { createVitestConfig } from "@chillwhales/config/vitest";

export default createVitestConfig();
```

**Confidence:** HIGH — verified from Vitest 4.x official docs (vitest.dev/guide/projects, vitest.dev/guide/migration)

### Pattern 3: Subpath Exports for Config Package

**What:** Node.js subpath exports in the config package's `package.json` to enable clean imports.

**Recommended `package.json` for `@chillwhales/config`:**
```json
{
  "name": "@chillwhales/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./build": "./src/build.ts",
    "./vitest": "./src/vitest.ts",
    "./tsconfig": "./tsconfig.base.json"
  }
}
```

**Key design decisions:**
1. **Point directly to `.ts` source files** — Since this is a private workspace package consumed only by `unbuild` and `vitest` (both of which handle TypeScript natively via `jiti` and Vite respectively), there's no need to build the config package itself. Pointing exports to `.ts` source avoids a build step for the config package.
2. **No `"."` root export** — Each config type has its own subpath; there's no need for a barrel export.
3. **`"type": "module"`** — Consistent with ESM-first approach.
4. **The `./tsconfig` export** requires a different pattern since tsconfig uses `"extends"` which resolves file paths, not Node.js exports. Use: `"extends": "@chillwhales/config/tsconfig.base.json"` — this works because pnpm creates a symlink in `node_modules/@chillwhales/config` that points to `packages/config`. The tsconfig `extends` resolves the path through this symlink, not through Node.js subpath exports.

**tsconfig export alternative:** Since tsconfig `extends` resolves via filesystem (not Node.js module resolution), the `./tsconfig` subpath export in `package.json` won't be used by tsconfig. Instead, per-package tsconfigs should reference:
```json
{
  "extends": "@chillwhales/config/tsconfig.base.json"
}
```
This resolves via `node_modules/@chillwhales/config/tsconfig.base.json` directly. The file must exist at the package root, not under `src/`.

**Confidence:** HIGH — verified from Node.js official docs (nodejs.org/api/packages.html#subpath-exports) and TypeScript tsconfig extends behavior

### Anti-Patterns to Avoid
- **Don't use `vitest.workspace.ts`**: Deprecated in Vitest 3.2, functionally replaced in 4.0. Use `vitest.config.ts` with `test.projects` instead.
- **Don't use `defineConfig` in per-package vitest configs**: Use `defineProject` for proper type safety — it prevents setting unsupported options like `reporters` or `coverage` at the project level.
- **Don't build the config package**: Since it's private and consumed by tools that handle TypeScript natively, exporting `.ts` files directly is simpler and avoids circular build dependencies.
- **Don't use `defineWorkspace`**: This function is deprecated alongside `vitest.workspace.ts`.
- **Don't use `mergeConfig` when the factory handles merging**: The factory pattern with spread/defu handles overrides; `mergeConfig` is for when you need to merge two independent Vite configs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build config merging | Custom deep merge | unbuild's built-in `defu` merge | unbuild already merges preset → buildConfig → inputConfig |
| Vitest project discovery | Custom glob/file scanning | `projects: ['packages/*']` in root config | Vitest auto-discovers configs per-folder |
| Dependency version sync | Custom scripts or renovate config | pnpm `catalog:` protocol | First-class pnpm feature, resolved at install time |
| Type declarations | Custom tsc scripts | unbuild's `declaration: "compatible"` | Generates `.d.ts`, `.d.mts`, `.d.cts` automatically |
| CJS/ESM dual output | Separate build steps | unbuild's `rollup.emitCJS: true` | Single config produces both formats |

## Common Pitfalls

### Pitfall 1: Using vitest.workspace.ts with Vitest 4.x
**What goes wrong:** `vitest.workspace.ts` and `defineWorkspace` are deprecated since Vitest 3.2 and the workspace file approach is removed in 4.0. Using them produces deprecation warnings or errors.
**Why it happens:** The CONTEXT.md mentions `vitest.workspace.ts` because the decision was likely made before verifying Vitest 4.x API changes.
**How to avoid:** Use `vitest.config.ts` at the root with `test.projects: ['packages/*']`. This is functionally identical but uses the current API.
**Warning signs:** Deprecation warnings when running `vitest`, or `defineWorkspace is not a function` errors.

### Pitfall 2: Config Package Needs to Exclude Itself from Projects
**What goes wrong:** If `packages/config` contains a `vitest.config.ts`, Vitest will try to discover tests in it. Since `config` is a config-only package with no tests, this is wasteful (though harmless). More critically, if it doesn't have a vitest config, Vitest will still treat it as a project with defaults.
**How to avoid:** Either (a) don't create a `vitest.config.ts` in `packages/config` and accept it as a no-op project, or (b) use exclusion in root config: `projects: ['packages/*', '!packages/config']`.
**Recommendation:** Use `projects: ['packages/*', '!packages/config']` to be explicit.

### Pitfall 3: unbuild Warning Types — What Triggers Them
**What goes wrong:** Enabling `failOnWarn: true` causes builds to fail with exit code 1 if ANY warning is emitted.
**Why it happens:** unbuild's `validateDependencies` and `validatePackage` functions check for:
1. **Potential unused dependencies** — packages listed in `dependencies` but not imported in source code
2. **Potential implicit dependencies** — modules used in source but not in `dependencies` or `peerDependencies` (and not externalized)
3. **Potential missing package.json files** — files referenced in `exports`, `bin`, `main`, `module`, `types` that don't exist in the output directory after build
4. **Auto-infer warnings** — if using auto-detection and entry points can't be inferred from package.json

**Resolution patterns:**
- *Unused dep*: Remove from `dependencies` or verify it's actually used (may be re-exported)
- *Implicit dep*: Add to `dependencies` or `peerDependencies`, or add to `externals` in build config
- *Missing output*: Fix paths in `package.json` `exports`/`main`/`module`/`types` fields
- *Unfixable third-party*: The shared config can suppress specific warnings via the `hooks` API (e.g., filtering warnings in `build:done`)

**Source:** Verified from unbuild source (`src/validate.ts`, `src/build.ts`, `src/auto.ts`)

### Pitfall 4: Catalog Protocol Only Works for External Packages
**What goes wrong:** Using `catalog:` for workspace packages (internal `@chillwhales/*` packages) doesn't make sense.
**Why it happens:** Internal workspace deps use `workspace:*` protocol which resolves to the local package. Catalogs are for versioned external dependencies.
**How to avoid:** Only use `catalog:` for external dependencies (`zod`, `viem`, `typescript`, `unbuild`, `vitest`, `@erc725/*`, `@lukso/*`). Keep `workspace:*` for internal deps.

### Pitfall 5: Subpath Exports and tsconfig extends Use Different Resolution
**What goes wrong:** Expecting `"extends": "@chillwhales/config/tsconfig"` to resolve via the subpath export in `package.json`.
**Why it happens:** TypeScript's `extends` in tsconfig resolves files differently from Node.js module resolution. It looks for the actual file, not through `package.json` exports.
**How to avoid:** Place `tsconfig.base.json` at the root of the config package and reference it with the full filename: `"extends": "@chillwhales/config/tsconfig.base.json"`. The pnpm workspace symlink makes this work.

### Pitfall 6: Quote Style Inconsistency
**What goes wrong:** lsp29 and lsp30 use single quotes while the other 6 packages use double quotes in their config files.
**Why it happens:** Different authoring sessions with different editor defaults.
**How to avoid:** Since the configs become 2-liners importing from `@chillwhales/config`, the quote style issue largely disappears. Use double quotes (matching the majority — 6 out of 8 packages) for the new config package source files and the consumer 2-liners. This is a natural cleanup when replacing the files.

### Pitfall 7: Build Order for Warning Resolution
**What goes wrong:** Building a dependent package before its dependency can produce spurious warnings about missing types or modules.
**Why it happens:** unbuild checks that files referenced in `exports`/`main`/`types` exist after build. Workspace dependencies resolved via `workspace:*` may reference built artifacts.
**How to avoid:** Follow the dependency order established in CONTEXT.md:
1. First: `utils`, `lsp2`, `lsp30` (leaf packages, no internal deps or only standalone)
2. Then: `lsp3`, `lsp4`, `lsp6`, `lsp23`, `lsp29` (packages with internal deps)
The root `pnpm build` (which runs `pnpm -r build`) already respects topological order for workspace deps.

## Code Examples

### Example 1: Complete Config Package `package.json`
```json
{
  "name": "@chillwhales/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./build": "./src/build.ts",
    "./vitest": "./src/vitest.ts"
  },
  "devDependencies": {
    "unbuild": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```

### Example 2: Complete `createBuildConfig` Factory
```typescript
// packages/config/src/build.ts
import { defineBuildConfig } from "unbuild";
import type { BuildConfig } from "unbuild";

type BuildConfigOverrides = Partial<Omit<BuildConfig, "preset" | "hooks">>;

export function createBuildConfig(overrides: BuildConfigOverrides = {}): BuildConfig[] {
  return defineBuildConfig({
    entries: ["src/index"],
    declaration: "compatible",
    clean: true,
    failOnWarn: true,
    rollup: {
      emitCJS: true,
    },
    ...overrides,
  });
}
```

### Example 3: Complete `createVitestConfig` Factory
```typescript
// packages/config/src/vitest.ts
import { defineProject } from "vitest/config";

interface VitestConfigOverrides {
  globals?: boolean;
  environment?: string;
  [key: string]: unknown;
}

export function createVitestConfig(overrides: VitestConfigOverrides = {}) {
  return defineProject({
    test: {
      globals: true,
      environment: "node",
      ...overrides,
    },
  });
}
```

### Example 4: Root `vitest.config.ts` (replaces `vitest.workspace.ts`)
```typescript
// vitest.config.ts (root)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*",
      "!packages/config",
    ],
  },
});
```

### Example 5: Complete `pnpm-workspace.yaml` with Catalog
```yaml
packages:
  - packages/*

catalog:
  # Shared devDependencies
  typescript: ^5.9.3
  unbuild: ^3.6.1
  vitest: ^4.0.17
  # Shared runtime dependencies
  zod: ^3.24.1
  viem: ^2.0.0
  # Blockchain ecosystem
  "@erc725/erc725.js": ^0.28.2
  "@lukso/lsp6-contracts": ^0.15.5
  "@lukso/universalprofile-contracts": ^0.15.5
```

### Example 6: Per-Package `package.json` Migration (Before/After)
```json
// BEFORE (lsp2/package.json)
{
  "dependencies": {
    "zod": "^3.24.1"
  },
  "peerDependencies": {
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "unbuild": "^3.6.1",
    "vitest": "^4.0.17",
    "viem": "^2.0.0"
  }
}

// AFTER (lsp2/package.json)
{
  "dependencies": {
    "zod": "catalog:"
  },
  "peerDependencies": {
    "viem": "catalog:"
  },
  "devDependencies": {
    "@chillwhales/config": "workspace:*",
    "typescript": "catalog:",
    "unbuild": "catalog:",
    "vitest": "catalog:",
    "viem": "catalog:"
  }
}
```

### Example 7: Per-Package Thin Config Files
```typescript
// packages/lsp2/build.config.ts (2 lines)
import { createBuildConfig } from "@chillwhales/config/build";
export default createBuildConfig();

// packages/lsp2/vitest.config.ts (2 lines)
import { createVitestConfig } from "@chillwhales/config/vitest";
export default createVitestConfig();
```

### Example 8: Per-Package tsconfig.json Migration
```json
// BEFORE
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}

// AFTER
{
  "extends": "@chillwhales/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vitest.workspace.ts` | `vitest.config.ts` with `test.projects` | Vitest 3.2 (deprecated), 4.0 (replaced) | **CRITICAL** — must use `projects` not `workspace` |
| `defineWorkspace()` | `defineConfig()` with `test.projects` array | Vitest 3.2+ | Import and API change |
| Per-package `defineConfig` | Per-package `defineProject` | Vitest 3.0+ | Better type safety, prevents setting unsupported options |
| unbuild `failOnWarn: false` default | unbuild `failOnWarn: true` default | Current unbuild main | The codebase explicitly sets `false`; shared config will set `true` |

**Deprecated/outdated:**
- `vitest.workspace.ts` / `defineWorkspace` — replaced by `test.projects` in `vitest.config.ts`
- `workspace` config key — renamed to `projects`

## Open Questions

1. **Exact warnings currently produced by the build**
   - What we know: unbuild checks for unused deps, implicit deps, and missing output files
   - What's unclear: Which specific warnings each package currently produces (can't run builds in this research environment)
   - Recommendation: The implementation should start by running `pnpm build` with `failOnWarn: false` (current state), capturing all warnings, then fixing them one by one before flipping the flag. This should be a task in the plan.

2. **Whether `@chillwhales/config` needs to be built or can export raw `.ts`**
   - What we know: Both unbuild (via jiti) and vitest (via Vite) natively handle `.ts` imports. Private workspace packages don't need to be built for consumption by other workspace packages' build tools.
   - What's unclear: Whether `pnpm -r build` will try to build `packages/config` and fail (it has `unbuild` as a devDep via catalog but no `build` script or `build.config.ts`)
   - Recommendation: Do NOT add a build script to the config package. If `pnpm -r build` tries to run it, it will simply skip (no `build` script). Alternatively, add `"build": "true"` as a no-op script.

3. **Whether `catalog:` works for `peerDependencies`**
   - What we know: pnpm docs explicitly list `peerDependencies` as a supported field for `catalog:` protocol
   - Recommendation: Use `catalog:` for `viem` in `peerDependencies` fields (confirmed supported)

## Sources

### Primary (HIGH confidence)
- unbuild source: `src/types.ts` — `defineBuildConfig`, `definePreset`, `BuildConfig`, `BuildPreset` types
- unbuild source: `src/build.ts` — build pipeline, preset resolution via `defu`, default `failOnWarn: true`
- unbuild source: `src/validate.ts` — `validateDependencies`, `validatePackage` warning types
- unbuild source: `src/auto.ts` — auto-infer entry points and warnings
- unbuild source: `src/utils.ts` — `warn()` function, `extractExportFilenames`
- Vitest 4.x docs: https://vitest.dev/guide/projects — `projects` replaces `workspace`
- Vitest 4.x docs: https://vitest.dev/guide/migration — `workspace` → `projects` migration guide
- pnpm 10.x docs: https://pnpm.io/catalogs — catalog syntax, `catalog:` protocol, supported fields
- Node.js docs: https://nodejs.org/api/packages.html#subpath-exports — subpath exports specification

### Secondary (MEDIUM confidence)
- unbuild README (GitHub) — configuration examples, `defineBuildConfig` usage

### Tertiary (LOW confidence)
- None — all findings verified from primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already in use, versions verified from package.json files
- Architecture (build config factory): HIGH — verified from unbuild source code types and build pipeline
- Architecture (vitest projects): HIGH — verified from Vitest 4.x official docs, critical migration finding
- Architecture (pnpm catalogs): HIGH — verified from pnpm 10.x official docs
- Architecture (subpath exports): HIGH — verified from Node.js official docs
- Pitfalls: HIGH — derived from source code analysis of warning mechanisms
- Warning types: MEDIUM — identified from source but can't test without running builds

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — stable ecosystem, no major releases expected)
