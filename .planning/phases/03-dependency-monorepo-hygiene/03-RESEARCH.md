# Phase 3: Dependency & Monorepo Hygiene - Research

**Researched:** 2026-02-27
**Domain:** Monorepo dependency analysis & consistency tooling
**Confidence:** HIGH

## Summary

This phase adds four tools (knip, sherif, madge, only-allow) to enforce dependency hygiene in a pnpm workspace monorepo with 9 packages. Research confirms all four tools are mature, well-documented, and compatible with pnpm workspaces including the `catalog:` protocol. Knip has native monorepo/workspace support and auto-detects vitest and unbuild plugins. Sherif is purpose-built for monorepo consistency and works zero-config. Madge supports TypeScript out of the box but requires careful configuration to detect only inter-package cycles. Only-allow is a trivial preinstall hook.

The main complexity is in knip configuration — specifically getting entry points right so public API exports aren't flagged as unused, test files are recognized, and the `@chillwhales/config` package (which has unconventional exports) is handled correctly. The other three tools are straightforward.

**Primary recommendation:** Start with knip (most complex config), then add sherif, madge, and only-allow. Run all tools against the existing codebase to discover and fix violations before committing any configuration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fix all existing violations before merging — clean slate from day one
- Strict zero-tolerance going forward — every tool exits non-zero on any finding
- Exceptions use inline ignore comments (not central config)
- Every ignore comment must include a reason explaining why the exception exists
- Package entry points (main export files) mark public API as "used" — knip won't flag intentional public API without internal consumers
- Full scope detection: unused dependencies, devDependencies, exports, files, and types
- Test files (*.test.ts, *.spec.ts, test helpers) configured as separate entry points — test-only utilities are considered "used"
- Config checks enabled — knip validates tsconfig references, tooling configuration alongside code
- Dedicated pnpm scripts for each tool: `pnpm knip`, `pnpm sherif`, etc.
- Combined `pnpm check` umbrella script that runs all hygiene tools together
- No pre-commit hooks — these tools run via CI and manual invocation only (pre-commit stays fast with Biome only)
- pnpm enforcement via standard `"preinstall": "npx only-allow pnpm"` in root package.json
- madge for circular dependency detection
- Inter-package cycles only — ignore intra-package circular imports
- Full cycle path in output (exact file-level import chain, not just package names)
- On-demand visual dependency graph via `pnpm deps:graph` script (not committed or CI-generated)

### Claude's Discretion
- Exact knip entry point glob patterns
- sherif rule selection and strictness configuration
- madge CLI flags and TypeScript config
- Script naming beyond the ones specified above
- Whether `pnpm check` runs tools in parallel or sequential

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| knip | ^5.85.0 | Unused deps, exports, files, types detection | Industry standard for TypeScript dead code detection; 137 plugins; native monorepo support |
| sherif | ^1.10.0 | Monorepo package consistency linting | Purpose-built for monorepos; zero-config; written in Rust (fast); pnpm-aware |
| madge | ^8.0.0 | Circular dependency detection & visualization | De facto standard for module dependency graphs; TypeScript support via dependency-tree |
| only-allow | ^1.2.2 | Package manager enforcement | Official pnpm team project; trivial preinstall hook |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | catalog: (^5.9.3) | Already installed | Required as peer dep by knip and madge |
| graphviz | system package | DOT graph rendering | Only needed for `pnpm deps:graph` visual output |

### Alternatives Considered

Not applicable — all four tools are locked decisions.

**Installation:**
```bash
pnpm add -D knip sherif madge only-allow
```

Note: `typescript` and `@types/node` are knip peer dependencies — typescript is already in the workspace catalog. `@types/node` may need to be added if not already present (knip uses it for Node.js built-in module resolution).

## Architecture Patterns

### Configuration File Placement

```
./ (root)
├── knip.json              # Root knip configuration (workspace-aware)
├── .madgerc               # madge configuration (shared across all packages)
├── package.json           # Scripts: knip, sherif, madge, deps:graph, check + preinstall
└── packages/
    ├── config/            # @chillwhales/config (private, unconventional exports)
    ├── utils/             # @chillwhales/utils
    ├── lsp2/              # @chillwhales/lsp2
    ├── lsp3/              # ... (all follow identical structure)
    └── ...
```

### Pattern 1: knip Workspace Configuration

**What:** Single root `knip.json` with workspace-level overrides.
**When to use:** Always — knip auto-reads `pnpm-workspace.yaml`.

Knip auto-discovers workspaces from `pnpm-workspace.yaml`. The `packages/*` glob pattern maps to workspace configs. Each workspace gets the same entry/project config unless overridden.

**Critical insight:** By default, knip does NOT report unused exports in entry files (`src/index.ts`). This is the desired behavior for library packages — their public API is intentionally exported for external consumers. The `includeEntryExports` option should NOT be set for library packages. However, the root workspace (`.`) and the private `config` package can safely use `includeEntryExports: true` since they're not published.

**Configuration:**
```jsonc
// knip.json — Source: https://knip.dev/features/monorepos-and-workspaces
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    ".": {
      "entry": ["packages/*/src/index.ts"],
      "project": ["packages/*/src/**/*.ts"],
      "ignoreDependencies": ["simple-git-hooks"]
    },
    "packages/*": {
      "entry": [
        "src/index.ts",
        "src/**/*.test.ts"
      ],
      "project": ["src/**/*.ts"],
      "includeEntryExports": false
    },
    "packages/config": {
      "entry": [
        "src/build.ts",
        "src/vitest.ts"
      ],
      "project": ["src/**/*.ts"],
      "includeEntryExports": true
    }
  }
}
```

**Key rationale:**
- `"src/index.ts"` as entry for `packages/*` — matches the barrel export pattern every package uses
- `"src/**/*.test.ts"` as additional entry — marks test files as entry points so test-only helpers are considered "used"
- `packages/config` overridden separately because it has non-standard exports (`./build`, `./vitest`, `./tsconfig`) and no `src/index.ts` barrel
- `includeEntryExports: false` for library packages — their barrel exports ARE the public API
- `includeEntryExports: true` for config package — it's private, unused exports should be flagged
- Root workspace `ignoreDependencies: ["simple-git-hooks"]` — simple-git-hooks is used via the `prepare` script and `simple-git-hooks` config key in package.json, but may not be detected as a code import

### Pattern 2: sherif Configuration

**What:** sherif rules configured in root `package.json` or CLI args.
**When to use:** Always — sherif is zero-config by default, rules can be ignored if needed.

sherif supports configuration in root `package.json` under a `"sherif"` key, or via CLI arguments. Default rules that are relevant for this monorepo:

| Rule | Type | Relevant? | Notes |
|------|------|-----------|-------|
| `multiple-dependency-versions` | ❌ error | YES | Ensures consistency — partially handled by catalog: but not all deps use catalogs |
| `empty-dependencies` | ❌ error | YES | Catches empty `{}` blocks |
| `root-package-manager-field` | ❌ error | YES | Already satisfied (packageManager field exists) |
| `root-package-private-field` | ❌ error | YES | Already satisfied (root is private) |
| `types-in-dependencies` | ❌ error | YES | Ensures @types/* are in devDeps for private packages |
| `unordered-dependencies` | ❌ error | YES | Alphabetical ordering prevents noisy diffs |
| `root-package-dependencies` | ⚠️ warning | YES | Root should only use devDependencies |
| `non-existant-packages` | ⚠️ warning | YES | All workspace paths should match actual packages |
| `packages-without-package-json` | ⚠️ warning | YES | All workspace matches should have package.json |
| `unsync-similar-dependencies` | ❌ error | MAYBE | Checks react/react-dom style pairs — unlikely in this repo |

**Recommendation:** Run sherif with `--fail-on-warnings` to make it strict (zero tolerance). This is simpler than selecting individual rules. All default rules are useful for this monorepo.

**Configuration (in root package.json):**
```json
{
  "sherif": {
    "failOnWarnings": true
  }
}
```

**Known catalog: compatibility:** sherif understands pnpm workspaces and reads `pnpm-workspace.yaml`. The `catalog:` protocol versions are resolved correctly — sherif checks the resolved versions, not the protocol strings. This means `multiple-dependency-versions` works correctly even when packages use `"zod": "catalog:"`. (Confidence: MEDIUM — based on sherif reading lockfile/manifest, not source code parsing)

### Pattern 3: madge for Inter-Package Circular Detection

**What:** Run madge across all package source directories, filter to inter-package cycles only.
**When to use:** For detecting circular dependencies between packages.

**Challenge:** madge doesn't natively distinguish inter-package vs intra-package cycles. It reports ALL circular dependencies found in the file graph. The user requirement is to detect only inter-package cycles (e.g., utils → lsp4 → utils) while ignoring intra-package cycles (e.g., within lsp2's own files).

**Solution approach:** Use madge's `--circular` flag across all `packages/*/src` directories. Then post-process the output to filter only cycles that cross package boundaries. This requires a small wrapper script.

**madge TypeScript configuration:**
```json
// .madgerc
{
  "fileExtensions": ["ts"],
  "tsConfig": "./packages/utils/tsconfig.json",
  "excludeRegExp": ["\\.test\\.ts$"]
}
```

**Important:** madge needs a tsConfig that can resolve all paths. Since each package extends `@chillwhales/config/tsconfig`, any package's tsconfig will work for path resolution. The `excludeRegExp` skips test files since we only care about production import cycles.

**CLI for circular detection:**
```bash
# Detect circular dependencies across all source files
madge --circular --extensions ts --ts-config ./packages/utils/tsconfig.json packages/*/src

# Generate visual graph (on-demand)
madge --image deps-graph.svg --extensions ts --ts-config ./packages/utils/tsconfig.json packages/*/src
```

**Filtering inter-package cycles:** madge outputs cycle paths like:
```
packages/lsp4/src/foo.ts > packages/utils/src/bar.ts > packages/lsp4/src/baz.ts
```

A cycle is inter-package if the files in the cycle span more than one `packages/X` directory. A simple shell or node script can parse madge's `--json` output and filter accordingly.

### Pattern 4: only-allow preinstall Hook

**What:** Standard preinstall script pattern.
**When to use:** Always in root package.json.

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

**Note on pnpm 10 compatibility:** The `preinstall` hook runs before dependencies are installed. `npx` will download `only-allow` on first run if not cached. This works with pnpm because pnpm executes lifecycle scripts including `preinstall`. The `only-allow` package uses `which-pm-runs` to detect the running package manager — this checks the `npm_config_user_agent` environment variable which pnpm sets correctly.

**IMPORTANT:** With pnpm's `onlyBuiltDependencies` already in root `package.json`, the `preinstall` script may need the `only-allow` package to be accessible. Since `npx` handles this by downloading on-the-fly, it works even before `node_modules` exists.

### Anti-Patterns to Avoid

- **Don't use `ignore` in knip to suppress real issues:** Fix the code instead. Exceptions should use JSDoc `@public` tags or `knip:ignore` inline comments with reason.
- **Don't set `includeEntryExports: true` on library packages:** This would flag every public API export as unused since no internal code imports from sibling packages' entry files.
- **Don't run madge on `dist/` directories:** Always analyze source (`src/`) to get accurate, pre-build dependency information.
- **Don't add these tools to pre-commit hooks:** They're too slow for pre-commit. Use CI and manual `pnpm check` instead.
- **Don't ignore sherif warnings long-term:** Use `--fail-on-warnings` and fix all findings.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unused dependency detection | Custom scripts parsing imports | knip | Handles re-exports, dynamic imports, plugin configs, workspace deps |
| Circular dependency detection | Custom graph traversal | madge | Uses proven dependency-tree/filing-cabinet for AST-level resolution |
| Monorepo consistency | Custom package.json validators | sherif | Knows about workspaces, catalogs, version ranges; maintained by QuiiBz |
| Package manager enforcement | Custom scripts checking env | only-allow | Standard solution; checks npm_config_user_agent correctly |
| Inter-package cycle filtering | - | Small wrapper script around madge | madge doesn't natively filter; wrapper is ~20 lines, not a "hand-rolled" replacement |

**Key insight:** knip's plugin system (137 plugins) handles tooling config files that simple import-scanning misses. It auto-detects vitest, unbuild, typescript, and biome — all used in this monorepo.

## Common Pitfalls

### Pitfall 1: knip Flagging Public API Exports as Unused
**What goes wrong:** Setting `includeEntryExports: true` globally causes every export from `src/index.ts` barrels to be reported as unused — because in a library monorepo, downstream consumers are external, not internal workspace packages.
**Why it happens:** knip only knows about internal workspace imports by default. External consumers (npm users) aren't part of the analysis.
**How to avoid:** Leave `includeEntryExports` as `false` (default) for all library packages. Only enable it for private/internal packages like `@chillwhales/config` and the root workspace.
**Warning signs:** Dozens of "unused export" findings in `src/index.ts` files.

### Pitfall 2: knip Not Recognizing config Package Exports
**What goes wrong:** The `@chillwhales/config` package uses unconventional subpath exports (`./build`, `./vitest`, `./tsconfig`) that point directly to source files, not built output. knip may not auto-detect these as entry files.
**Why it happens:** Config package has no `src/index.ts` barrel file. Its exports are `./src/build.ts`, `./src/vitest.ts`, and `./tsconfig.base.json`.
**How to avoid:** Explicitly configure the config workspace with its actual entry files: `["src/build.ts", "src/vitest.ts"]`.
**Warning signs:** Config package exports reported as unused despite being imported by all other packages.

### Pitfall 3: knip Flagging Workspace Protocol Dependencies
**What goes wrong:** knip might not resolve `workspace:*` dependencies correctly in some edge cases.
**Why it happens:** Workspace protocol is pnpm-specific. knip v5 supports it, but configuration must be correct.
**How to avoid:** Ensure knip is run from the workspace root and picks up `pnpm-workspace.yaml`. Use `--debug` to verify workspace resolution.
**Warning signs:** Internal workspace packages reported as "unlisted" or "unused" dependencies.

### Pitfall 4: sherif Reporting catalog: Dependencies as Version Mismatches
**What goes wrong:** sherif might see different resolved versions for `catalog:` entries if the catalog resolution isn't consistent.
**Why it happens:** Potential edge case with how sherif resolves the `catalog:` protocol.
**How to avoid:** Ensure all packages using the same dependency point to the same catalog entry (they already do in this repo). If sherif reports false positives, use `--ignore-dependency` for specific packages.
**Warning signs:** `multiple-dependency-versions` errors for dependencies that are all `"catalog:"`.

### Pitfall 5: madge Reporting All Cycles (Not Just Inter-Package)
**What goes wrong:** Running `madge --circular` reports both intra-package and inter-package circular dependencies.
**Why it happens:** madge analyzes the entire file-level dependency graph without understanding package boundaries.
**How to avoid:** Post-process madge output. Use `--json` flag and filter cycles where all files share the same `packages/X` prefix. Only report cycles that cross package boundaries.
**Warning signs:** Many circular dependency reports for files within the same package.

### Pitfall 6: `pnpm check` Script Name Conflict
**What goes wrong:** The root `package.json` already has `"check": "biome check"`. Adding a new `"check"` that runs all hygiene tools would break the existing Biome-only check.
**Why it happens:** Name collision with existing script.
**How to avoid:** Either rename the existing biome check (e.g., `"check:lint": "biome check"`) or use a different name for the umbrella script (e.g., `"check:all"` or `"hygiene"`). **Recommendation:** Rename existing scripts to be more specific:
  - `"check:lint"` → `biome check`
  - `"check:lint:fix"` → `biome check --write`
  - `"check"` → umbrella for all hygiene tools
  This aligns with the user's decision that `pnpm check` is the umbrella command.
**Warning signs:** Running `pnpm check` only runs Biome and skips knip/sherif/madge.

### Pitfall 7: simple-git-hooks Reported as Unused by knip
**What goes wrong:** knip may flag `simple-git-hooks` as unused because it's referenced in package.json config (not imported in code).
**Why it happens:** knip scans imports in source files. `simple-git-hooks` is only used via `"prepare"` script and `"simple-git-hooks"` config key.
**How to avoid:** knip's script parser should detect the `prepare` script reference. If not, add to `ignoreDependencies` in the root workspace config.
**Warning signs:** `simple-git-hooks` reported as unused devDependency.

## Code Examples

### Complete knip.json Configuration
```jsonc
// Source: https://knip.dev/features/monorepos-and-workspaces + https://knip.dev/reference/configuration
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    ".": {
      "entry": [],
      "project": [],
      "ignoreDependencies": ["simple-git-hooks"]
    },
    "packages/*": {
      "entry": [
        "src/index.ts",
        "src/**/*.test.ts"
      ],
      "project": ["src/**/*.ts"]
    },
    "packages/config": {
      "entry": [
        "src/build.ts",
        "src/vitest.ts"
      ],
      "project": ["src/**/*.ts"],
      "includeEntryExports": true
    }
  }
}
```

### Root package.json Scripts
```jsonc
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "build": "pnpm -r build",
    "test": "vitest run",
    "clean": "pnpm -r clean",
    "check": "pnpm check:lint && pnpm knip && pnpm sherif && pnpm madge",
    "check:lint": "biome check",
    "check:lint:fix": "biome check --write",
    "knip": "knip",
    "sherif": "sherif",
    "madge": "madge --circular --extensions ts --ts-config ./packages/utils/tsconfig.json packages/*/src",
    "deps:graph": "madge --image deps-graph.svg --extensions ts --ts-config ./packages/utils/tsconfig.json packages/*/src",
    "prepare": "simple-git-hooks"
  }
}
```

### sherif Configuration (in package.json)
```json
{
  "sherif": {
    "failOnWarnings": true
  }
}
```

### .madgerc Configuration
```json
{
  "fileExtensions": ["ts"],
  "excludeRegExp": ["\\.test\\.ts$", "\\.spec\\.ts$"]
}
```

### Inter-Package Cycle Filtering Script (if needed)
```bash
#!/usr/bin/env bash
# scripts/check-circular.sh — Filter madge output for inter-package cycles only
set -euo pipefail

OUTPUT=$(madge --circular --json --extensions ts --ts-config ./packages/utils/tsconfig.json packages/*/src 2>&1)

# If no circular deps, madge --json returns []
if [ "$(echo "$OUTPUT" | jq 'length')" = "0" ]; then
  echo "No circular dependencies found."
  exit 0
fi

# Filter: keep only cycles where files span multiple packages
INTER_PKG=$(echo "$OUTPUT" | jq '[.[] | select(
  ([.[] | capture("packages/(?<pkg>[^/]+)/") | .pkg] | unique | length) > 1
)]')

COUNT=$(echo "$INTER_PKG" | jq 'length')
if [ "$COUNT" = "0" ]; then
  echo "No inter-package circular dependencies found."
  exit 0
fi

echo "Found $COUNT inter-package circular dependency chain(s):"
echo "$INTER_PKG" | jq -r '.[] | "  " + join(" → ")'
exit 1
```

### knip Inline Ignore (for exceptions)
```typescript
// knip:ignore — This export is consumed by external tooling via dynamic require
export const specialConfig = { /* ... */ };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| depcheck for unused deps | knip (comprehensive: deps + exports + files) | knip v1 (2023) | Single tool replaces multiple; monorepo-native |
| Manual version sync | pnpm catalogs + sherif validation | pnpm 9+ catalogs, sherif 2024 | Catalogs declare once, sherif validates consistency |
| ESLint import/no-cycle | madge (standalone, faster) | N/A | madge is CLI-focused, faster than ESLint rule, works without ESLint |
| engines.packageManager | corepack + only-allow | pnpm 7+ packageManager field | packageManager field + only-allow = double enforcement |

**Current/stable:**
- knip v5 is the current major (v5.85.0 latest as of 2026-02-27). Stable, actively maintained.
- sherif v1.10.0 is latest. Stable, zero-config approach.
- madge v8.0.0 is latest major. Stable, uses dependency-tree v11.
- only-allow v1.2.2 is latest. Minimal, rarely updated (by design).

## Open Questions

1. **madge Inter-Package Filtering Complexity**
   - What we know: madge doesn't natively distinguish inter-package vs intra-package cycles. The `--json` flag outputs cycle arrays that can be post-processed.
   - What's unclear: Whether the current codebase has any intra-package cycles that would cause false positives in a naive `madge --circular` run. If there are none, the filtering script may be unnecessary initially.
   - Recommendation: Run `madge --circular` first without filtering. If it reports only inter-package cycles (or none), skip the filtering script. Add it later if intra-package cycles appear and need to be excluded. **Planner should include a discovery step.**

2. **knip and pnpm catalog: Protocol**
   - What we know: knip v5 supports pnpm workspaces. The `catalog:` protocol is relatively new (pnpm 9+).
   - What's unclear: Whether knip fully resolves `catalog:` version specifiers or reports them as issues. Confidence: MEDIUM.
   - Recommendation: Run knip first and check for any false positives around catalog dependencies. May need `ignoreDependencies` for edge cases.

3. **sherif and catalog: Protocol**
   - What we know: sherif reads `pnpm-workspace.yaml` and understands pnpm workspaces.
   - What's unclear: Whether the `multiple-dependency-versions` rule correctly resolves `catalog:` as a unified version.
   - Recommendation: Run sherif and inspect output. If false positives, use `--ignore-dependency` for affected packages.

4. **@types/node as knip Peer Dependency**
   - What we know: knip lists `@types/node >= 18` as a peer dependency.
   - What's unclear: Whether this is already installed in the monorepo. Not visible in current devDependencies.
   - Recommendation: Check if `@types/node` is installed. If not, add to root devDependencies.

## Integration Notes

### `pnpm check` — Sequential vs Parallel

**Recommendation: Sequential execution.** Reasons:
1. **Failure diagnosis:** When a tool fails, sequential execution makes it clear which tool found the issue. Parallel execution with mixed output is confusing.
2. **Exit code clarity:** Sequential with `&&` short-circuits on first failure, giving immediate feedback on the first problem to fix.
3. **Resource usage:** knip is memory-intensive (creates TypeScript programs). Running it in parallel with madge (which also creates TS programs) doubles memory usage unnecessarily.
4. **Speed is not critical:** These tools are for CI and manual pre-push checks, not interactive workflows. The ~10-20 second total runtime is acceptable.

**Optimal ordering:**
1. `biome check` (fastest, catches syntax issues first)
2. `sherif` (fast — Rust binary, validates package.json structure)
3. `knip` (medium speed, most findings)
4. `madge --circular` (medium speed, specialized check)

This order goes from fastest/broadest to slowest/most-specific, maximizing early feedback.

### Tool Interactions

- **No conflicts:** The four tools analyze different things and don't interfere.
- **Complementary coverage:** sherif checks package.json structure; knip checks code usage; madge checks import graph topology; only-allow checks runtime environment.
- **knip has vitest and unbuild plugins:** These are auto-detected from `devDependencies`. Vitest plugin adds `**/*.test.ts` as entry files. Unbuild plugin recognizes `build.config.ts`. This means less manual configuration needed in `knip.json`.

## Sources

### Primary (HIGH confidence)
- knip official docs (https://knip.dev) — Configuration, monorepo support, entry files, plugins, CLI reference, handling issues, rules & filters
- NPM registry (https://registry.npmjs.org) — knip 5.85.0, sherif 1.10.0, madge 8.0.0, only-allow 1.2.2 version data
- madge GitHub README (https://github.com/pahen/madge) — CLI flags, configuration options, TypeScript support
- sherif GitHub README (https://github.com/QuiiBz/sherif) — Rules, configuration, autofix, pnpm support

### Secondary (MEDIUM confidence)
- sherif catalog: compatibility — inferred from sherif reading workspace manifests and resolved versions, not explicitly documented for `catalog:` protocol
- madge inter-package filtering — approach designed from madge's `--json` output format; not an officially documented pattern

### Tertiary (LOW confidence)
- knip catalog: protocol handling — assumed from pnpm workspace support; not explicitly tested/documented for `catalog:` specifiers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from npm registry, docs are current and comprehensive
- Architecture (knip config): HIGH — patterns directly from official knip monorepo documentation
- Architecture (madge inter-package filtering): MEDIUM — requires custom wrapper; approach is sound but untested against this specific codebase
- Architecture (sherif): HIGH — zero-config tool, well-documented rules
- Pitfalls: HIGH — documented from official sources and first-principles analysis of the monorepo structure

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — all tools are stable releases)
