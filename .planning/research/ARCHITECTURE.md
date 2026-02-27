# Architecture Research

**Domain:** TypeScript library monorepo infrastructure
**Researched:** 2026-02-27
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Root Configuration Layer                     │
│  biome.json  tsconfig.base.json  vitest.config.ts  pnpm-ws.yaml│
├─────────────────────────────────────────────────────────────────┤
│                     Workspace Orchestration                      │
│  pnpm-workspace.yaml (catalogs, workspace protocol)             │
│  Root package.json (scripts: build, test, lint, format, release)│
├──────────────┬──────────────┬───────────────┬───────────────────┤
│   Tier 0     │    Tier 1    │    Tier 2     │                   │
│  (no deps)   │  (Tier 0)    │  (Tier 0+1)   │                   │
│ ┌──────────┐ │ ┌──────────┐ │ ┌───────────┐ │                   │
│ │  utils   │ │ │   lsp3   │ │ │   lsp4    │ │                   │
│ │  lsp2    │ │ │  lsp23   │ │ └───────────┘ │                   │
│ │  lsp30   │ │ │  lsp29   │ │               │                   │
│ └──────────┘ │ │   lsp6   │ │               │                   │
│              │ └──────────┘ │               │                   │
└──────────────┴──────────────┴───────────────┴───────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `tsconfig.base.json` (root) | Base TypeScript compiler options shared by all packages | Every package tsconfig extends it |
| `vitest.config.ts` (root) | Root-level vitest projects config; defines global test settings (reporters, coverage) | Vitest auto-discovers per-package configs via `projects: ['packages/*']` |
| `biome.json` (root) | Single linter/formatter config for the entire monorepo | All source files; no per-package overrides needed |
| `pnpm-workspace.yaml` | Workspace package globs + pnpm catalog for shared dependency versions | All package.json files reference `catalog:` protocol |
| Root `package.json` | Orchestration scripts (`pnpm -r build`, `pnpm test`, etc.) | Delegates to per-package scripts |
| Per-package `build.config.ts` | Unbuild configuration (entries, declaration, CJS emit) | Reads package.json exports; outputs to dist/ |
| Per-package `tsconfig.json` | Extends base; sets outDir/rootDir/include for that package | Extends `../../tsconfig.base.json` |
| Per-package `vitest.config.ts` | Per-project test settings (environment, globals) | Discovered by root vitest projects config |

## Recommended Project Structure

```
/
├── biome.json                      # Single root biome config (whole monorepo)
├── tsconfig.base.json              # Shared TS compiler options
├── vitest.config.ts                # Root: projects + coverage + reporters
├── pnpm-workspace.yaml             # packages/* + catalog definitions
├── package.json                    # Root scripts, devDeps for shared tools
├── packages/
│   ├── lsp2/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   ├── guards.ts
│   │   │   ├── guards.test.ts
│   │   │   └── ...
│   │   ├── build.config.ts         # Minimal: import shared preset
│   │   ├── vitest.config.ts        # Minimal: package-level overrides only
│   │   ├── tsconfig.json           # Extends ../../tsconfig.base.json
│   │   └── package.json
│   ├── lsp3/
│   │   └── ... (identical structure)
│   ├── utils/
│   │   └── ... (identical structure)
│   └── ... (6 more packages)
└── .changeset/                     # Changesets config
```

### Structure Rationale

- **Root-level configs only (no packages/config):** With 8 identical packages, a shared config *package* adds workspace dependency complexity, build ordering concerns, and the `workspace:` resolution overhead — all for configs that are static files. Root-level files with `extends`/`import` patterns achieve the same DRY goal with zero overhead. A config package becomes worthwhile at ~20+ packages or when configs diverge significantly. This monorepo is not there.
- **biome.json at root only:** Biome v2 supports monorepos natively. A single root config covers the entire repo. Per-package biome.json files are unnecessary unless packages need different rules (they don't here).
- **vitest.config.ts at root:** Vitest v4 `projects` feature auto-discovers `packages/*` as projects. Root config owns global settings (reporters, coverage). Per-package configs are thin and only define project-specific test options.
- **tsconfig.base.json stays at root:** Already correct. Packages extend via relative path. This is the universal TypeScript monorepo pattern.
- **build.config.ts stays per-package:** Unbuild has no built-in config inheritance. But since all 8 configs are identical, the DRY solution is a shared function imported from a local file — not a separate package.

## Architectural Patterns

### Pattern 1: Root tsconfig.base.json + Package Extends

**What:** A single `tsconfig.base.json` at the repo root contains all shared compiler options. Each package's `tsconfig.json` extends it and only adds `outDir`, `rootDir`, `include`.
**When to use:** Always in TypeScript monorepos. This is the standard pattern.
**Trade-offs:** Simple and well-understood. The relative path `../../tsconfig.base.json` is slightly fragile if packages move, but packages don't move in a well-structured monorepo.
**Confidence:** HIGH — universal TypeScript monorepo pattern (Vue, Vite, Next.js, Prisma all do this).

**Current state — already correct:**
```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
    // ... shared options
  },
  "exclude": ["node_modules", "dist"]
}

// packages/lsp2/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Pattern 2: Root Vitest Projects Config + Per-Package Thin Configs

**What:** A root `vitest.config.ts` uses the `projects` feature (Vitest v3.2+ / v4) to auto-discover `packages/*`. Global options (reporters, coverage) live at root. Per-package `vitest.config.ts` files remain thin — only package-specific test settings.
**When to use:** Monorepos where all packages have tests and you want unified coverage/reporting.
**Trade-offs:** Requires Vitest v3.2+ (this project uses v4, so fine). Eliminates duplicated test config. Per-package files can be removed entirely if no package needs custom test settings.
**Confidence:** HIGH — official Vitest documentation recommends this pattern for monorepos.

**Target state:**
```typescript
// vitest.config.ts (root) — NEW
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
```

```typescript
// packages/lsp2/vitest.config.ts — SIMPLIFIED
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Alternative — eliminate per-package configs entirely:** If every package uses `globals: true` and `environment: 'node'`, these can be set in the root config's inline project definition, and per-package vitest.config.ts files can be deleted. However, keeping thin per-package files provides a clear override point if any package later needs different settings (e.g., jsdom for a future browser-related package).

**Recommendation:** Keep per-package vitest.config.ts files but switch to `defineProject`. They're 5 lines each and provide future flexibility.

### Pattern 3: Shared Build Preset via Root Helper

**What:** A single TypeScript file at root exports the shared unbuild config. Each package's `build.config.ts` imports and re-exports it, optionally merging overrides.
**When to use:** When all packages use identical build config (this monorepo).
**Trade-offs:** Simpler than a config package. No workspace dependency. One-line change to update all packages.
**Confidence:** HIGH — this is how unjs ecosystem handles it (unbuild itself uses this pattern).

**Target state:**
```typescript
// build.config.shared.ts (root) — NEW
import { defineBuildConfig } from 'unbuild';

export const sharedBuildConfig = defineBuildConfig({
  entries: ['src/index'],
  declaration: 'compatible',
  rollup: {
    emitCJS: true,
  },
  clean: true,
  failOnWarn: false,
});
```

```typescript
// packages/lsp2/build.config.ts — SIMPLIFIED
export { sharedBuildConfig as default } from '../../build.config.shared';
```

**Note on unbuild config resolution:** unbuild resolves `build.config.ts` from the package directory. It does *not* support `extends` or a built-in inheritance mechanism. Re-exporting from root is the correct pattern.

### Pattern 4: pnpm Catalogs for Shared Dependency Versions

**What:** Define shared dependency version ranges in `pnpm-workspace.yaml` under the `catalog` key. Reference them in package.json as `"zod": "catalog:"`.
**When to use:** When multiple packages depend on the same versions of the same libraries (this monorepo: zod, viem, typescript, unbuild, vitest all repeated 8 times).
**Trade-offs:** Centralizes version management. Fewer merge conflicts. On publish, `catalog:` is resolved to actual version ranges automatically. Requires pnpm 9.5+ (this project uses 10.30.2, so fine).
**Confidence:** HIGH — official pnpm feature, documented and stable.

**Target state:**
```yaml
# pnpm-workspace.yaml
packages:
  - packages/*

catalog:
  zod: ^3.24.1
  viem: ^2.0.0
  typescript: ^5.9.3
  unbuild: ^3.6.1
  vitest: ^4.0.17
```

```jsonc
// packages/lsp2/package.json
{
  "dependencies": {
    "zod": "catalog:"
  },
  "peerDependencies": {
    "viem": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "unbuild": "catalog:",
    "vitest": "catalog:"
  }
}
```

### Pattern 5: Hoist Shared devDependencies to Root

**What:** Move devDependencies used by every package (typescript, unbuild, vitest) to the root package.json. pnpm's strict node_modules structure makes these available to packages via hoisting.
**When to use:** When all packages use identical dev tool versions.
**Trade-offs:** Cleaner per-package package.json. Potential confusion about what's available. The `catalog:` approach (Pattern 4) is safer because it keeps declarations explicit in each package.json while centralizing version control.
**Confidence:** MEDIUM — both patterns work, but catalogs are more explicit.

**Recommendation:** Use catalogs (Pattern 4) rather than root hoisting. Keep devDependencies declared in each package.json but use `catalog:` for version management. This is more explicit and works correctly with `pnpm publish`.

## Data Flow

### Configuration Flow

```
tsconfig.base.json (root)
    ↓ extends (relative path)
packages/*/tsconfig.json
    ↓ consumed by
unbuild (reads tsconfig for declaration generation)
    ↓ outputs
packages/*/dist/ (.mjs, .cjs, .d.ts, .d.mts, .d.cts)
```

```
build.config.shared.ts (root)
    ↓ re-exported from
packages/*/build.config.ts
    ↓ consumed by
unbuild CLI (`pnpm build` in each package)
    ↓ outputs
packages/*/dist/
```

```
vitest.config.ts (root)
    ↓ projects: ['packages/*'] auto-discovers
packages/*/vitest.config.ts
    ↓ vitest resolves per-project settings
Test execution with unified coverage/reporters
```

```
biome.json (root)
    ↓ applies to entire repo (no per-package config needed)
All .ts files in packages/*/src/
```

```
pnpm-workspace.yaml
    ├── packages: ['packages/*'] → workspace membership
    └── catalog: { zod, viem, ... } → version constants
            ↓ referenced via catalog: protocol
        packages/*/package.json dependencies
```

### Build Order (Dependency Tiers)

Internal dependency graph:
```
utils ← lsp4, lsp6
lsp2  ← lsp3, lsp4, lsp23, lsp29
lsp30 (no internal deps)
```

**Tier 0 — No internal dependencies (build first, in parallel):**
- `@chillwhales/utils`
- `@chillwhales/lsp2`
- `@chillwhales/lsp30`

**Tier 1 — Depends on Tier 0 only (build second, in parallel):**
- `@chillwhales/lsp3` (depends on lsp2)
- `@chillwhales/lsp6` (depends on utils)
- `@chillwhales/lsp23` (depends on lsp2)
- `@chillwhales/lsp29` (depends on lsp2)

**Tier 2 — Depends on Tier 0 + Tier 1 (build last):**
- `@chillwhales/lsp4` (depends on utils + lsp2)

pnpm handles this automatically with `pnpm -r build` — it respects the workspace dependency graph and builds in topological order. No additional build orchestration tool (turborepo, nx) is needed for 8 packages.

### Package Exports Pattern

**Current state — already correct.** Each package uses the recommended dual-format exports map:

```jsonc
{
  "main": "./dist/index.mjs",          // Legacy main field (ESM)
  "module": "./dist/index.mjs",        // Legacy module field (bundlers)
  "types": "./dist/index.d.ts",        // Legacy types field
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",    // Types MUST be first
      "import": "./dist/index.mjs",    // ESM
      "require": "./dist/index.cjs"    // CJS
    }
  },
  "files": ["dist", "package.json"]
}
```

**Why `types` must be first in exports:** TypeScript condition matching is order-dependent. The `types` condition must appear before `import`/`require` to be resolved correctly. This is a well-documented TypeScript requirement.

**Improvement opportunity:** Add `"type": "module"` to each package.json. While unbuild handles output format regardless, `"type": "module"` signals intent and aligns with modern Node.js conventions. Currently missing from all packages.

### Internal Dependencies: workspace:* Protocol

**Current state — correct.** All internal dependencies use `workspace:*`:
```json
"@chillwhales/lsp2": "workspace:*"
```

On `pnpm publish`, this resolves to the exact version (e.g., `"@chillwhales/lsp2": "0.1.0"`). This is the intended behavior for independent versioning with changesets.

**Recommendation:** Keep `workspace:*` (not `workspace:^` or `workspace:~`). With changesets managing versions and the packages being published independently, exact version matching at publish time is correct. Consumers get the exact compatible version.

## Anti-Patterns

### Anti-Pattern 1: Shared Config as a Workspace Package

**What people do:** Create `packages/config` or `@chillwhales/config` as a workspace package that exports tsconfig, build config, vitest config, and biome config. Other packages depend on it via `workspace:*`.

**Why it's wrong for this monorepo:**
1. **Build ordering overhead:** Every package now depends on `packages/config`, adding it to Tier 0. If it fails, everything fails.
2. **Circular dependency risk:** The config package needs devDependencies on the tools it configures (unbuild, vitest) — same tools that build it.
3. **Resolution complexity:** tsconfig `extends` supports path references but not package specifiers in all contexts. `vitest.config.ts` can import from packages but needs the package built first. `biome.json` can extend from node_modules but this adds a build step for a JSON file.
4. **8 packages is small.** The overhead doesn't justify the abstraction. Root-level files with imports/extends are simpler and achieve the same result.

**When a config package IS right:** 20+ packages, divergent configs needing composition, or configs that are published for external consumption (e.g., `@vercel/style-guide`).

**Do this instead:** Root-level config files with `extends` (tsconfig), `import` (build.config, vitest), and native monorepo support (biome).

### Anti-Pattern 2: Vitest Workspace File Without projects

**What people do:** Create a separate `vitest.workspace.ts` file alongside `vitest.config.ts`.

**Why it's wrong:** The `workspace` feature is deprecated since Vitest 3.2 in favor of the `projects` config key inside `vitest.config.ts`. Using the old pattern creates unnecessary files and will need migration later.

**Do this instead:** Use `test.projects: ['packages/*']` in the root `vitest.config.ts`.

### Anti-Pattern 3: Hoisting All devDependencies to Root Only

**What people do:** Remove all devDependencies from per-package package.json files and only declare them in root.

**Why it's wrong:** When publishing, `pnpm publish` doesn't look at root devDependencies. Tools that inspect package.json (like unbuild's dependency checking) won't find the declarations. It also makes each package less self-documenting — you can't tell what a package needs by reading its package.json.

**Do this instead:** Use pnpm catalogs to centralize *versions* while keeping *declarations* in each package.json.

### Anti-Pattern 4: Per-Package biome.json

**What people do:** Put a `biome.json` in every package directory.

**Why it's wrong for this monorepo:** All packages follow identical coding standards. Per-package biome.json files are pure duplication. Biome v2 traverses upward to find the nearest config, so a single root config covers everything.

**Do this instead:** One `biome.json` at root. If a specific package ever needs different rules, add a `biome.json` with `"extends": "//"` to inherit root settings and override selectively.

## External Repo Extraction Pattern

### Identifying Extraction Candidates

From the two external repos (marketplace, lsp-indexer), utilities should be extracted when they meet ALL of these criteria:

1. **Generic to the domain:** The utility works with LSP standards, not marketplace/indexer business logic
2. **No external-repo-specific dependencies:** The utility doesn't pull in Next.js, database, or API-specific code
3. **Already duplicated or could be:** Both repos use it, or the second repo would need it
4. **Clear package home:** The utility maps to an existing LSP package (e.g., LSP2 encoding helpers go to `@chillwhales/lsp2`) or to `@chillwhales/utils`

### Extraction Flow

```
External repo (marketplace/lsp-indexer)
    ↓ identify candidate utility
    ↓ verify: no external-repo-specific deps
    ↓ determine target package (lsp2, lsp3, ..., or utils)
Move to: packages/{target}/src/
    ↓ add tests if missing
    ↓ export from index.ts
    ↓ build + publish new version
External repo switches to: import { util } from '@chillwhales/{target}'
    ↓ remove old copy from external repo
```

**Target package decision tree:**
- Utility works with VerifiableURI or ERC725Y JSON? → `@chillwhales/lsp2`
- Utility works with profile metadata? → `@chillwhales/lsp3`
- Utility works with asset metadata? → `@chillwhales/lsp4`
- Utility works with permissions/key manager? → `@chillwhales/lsp6`
- Utility works with deployment encoding? → `@chillwhales/lsp23`
- Utility works with encrypted assets? → `@chillwhales/lsp29`
- Utility works with multi-storage URIs? → `@chillwhales/lsp30`
- General hex/bytes/string/number utility? → `@chillwhales/utils`
- Doesn't fit any package? → Consider creating a new package, or leave in external repo

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 8 packages (current) | Root configs + pnpm -r scripts. No build orchestration tool needed. |
| 15-20 packages | Consider turborepo for cached builds. Config duplication starts to matter more — evaluate config package. |
| 20+ packages | Config package becomes worthwhile. Consider nx or turborepo for build caching and affected-package detection. |

### When to Revisit This Architecture

- **Adding a package that needs different build settings** (e.g., a CLI tool or a browser-specific bundle) — the shared build.config.ts pattern still works; just don't re-export from it for that package.
- **Adding non-TypeScript packages** (e.g., a Rust WASM module) — would need its own build pipeline, not covered by this architecture.
- **Build times exceed 30 seconds** — consider turborepo for caching. Currently unlikely with 8 small packages.

## Sources

- pnpm workspaces documentation: https://pnpm.io/workspaces (verified 2026-02-27, HIGH confidence)
- pnpm catalogs documentation: https://pnpm.io/catalogs (verified 2026-02-27, HIGH confidence)
- Vitest projects/workspace documentation: https://vitest.dev/guide/projects (verified 2026-02-27, HIGH confidence)
- Biome big projects / monorepo guide: https://biomejs.dev/guides/big-projects/ (verified 2026-02-27, HIGH confidence)
- unbuild documentation and examples: https://github.com/unjs/unbuild (verified 2026-02-27, HIGH confidence)
- TypeScript project references and monorepo patterns: standard practice verified across Vue, Vite, Next.js, Prisma monorepos listed at https://pnpm.io/workspaces

---
*Architecture research for: TypeScript library monorepo infrastructure*
*Researched: 2026-02-27*
