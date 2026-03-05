# Phase 1: Build Hardening & Shared Configs - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

All 8 packages build from shared configurations with zero warnings, and dependency versions are centralized. This phase delivers: a shared config package, pnpm catalogs, `failOnWarn: true` with zero warnings, and a unified test runner setup.

</domain>

<decisions>
## Implementation Decisions

### Shared config location
- Create an internal workspace package: `@chillwhales/config` under `packages/config`
- Marked `"private": true` — never published to npm
- Houses all shared configs (build, vitest, tsconfig now; biome, commitlint in later phases)
- Preset factory pattern for JS/TS configs: `createBuildConfig()`, `createVitestConfig()`
- Native `"extends"` for tsconfig: `"extends": "@chillwhales/config/tsconfig.base.json"`
- Subpath exports for each config type: `@chillwhales/config/build`, `@chillwhales/config/vitest`, `@chillwhales/config/tsconfig`
- Each package's `build.config.ts` and `vitest.config.ts` become thin 2-liners calling the preset factory

### Catalog organization
- Single default catalog in `pnpm-workspace.yaml` (no named catalogs)
- Threshold: any dependency shared by 2+ packages goes in the catalog
- Includes all shared devDependencies: `typescript`, `unbuild`, `vitest`
- Includes shared runtime dependencies: `zod`, `viem`
- Includes blockchain ecosystem deps: `@erc725/erc725.js`, `@lukso/*` packages
- `@chillwhales/config` itself uses `catalog:` for its own dependencies (catalog is the version source of truth)

### Warning resolution strategy
- Fix all existing warnings first, then flip `failOnWarn: true` — the commit that enables the flag must result in a green build
- Validate in dependency order: leaf packages first (`utils`, `lsp2`, `lsp30`), then dependents (`lsp3`, `lsp4`, `lsp6`, `lsp23`, `lsp29`)
- If a warning can't be fixed (e.g., third-party dep), suppress explicitly in the shared config with a comment explaining why and a link to the upstream issue
- No extra tooling to prevent warning regression — `failOnWarn: true` is the guard. CI (Phase 5) will be the automated safety net.

### Test runner setup
- Vitest workspace config at root (`vitest.workspace.ts`) using glob pattern `['packages/*']` for auto-discovery
- Per-package test scripts retained — developers can `cd packages/lsp4 && pnpm test` during development
- Per-package `vitest.config.ts` calls `createVitestConfig()` from `@chillwhales/config/vitest`
- Minimal preset: `globals: true`, `environment: "node"` — no speculative additions. Coverage config added in Phase 4.

### Claude's Discretion
- Exact subpath export configuration in config package's `package.json`
- Preset factory function signatures and default values
- Order of operations within the implementation (as long as dependency order is respected for warning fixes)
- How to handle the inconsistent quote style across existing configs (lsp29/lsp30 use single quotes, others use double)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-build-hardening-shared-configs*
*Context gathered: 2026-02-27*
