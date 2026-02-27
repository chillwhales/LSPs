# LSPs — LUKSO Standards Packages

## What This Is

A TypeScript monorepo of LUKSO Standard Proposal implementations published as `@chillwhales/*` npm packages. Each package provides schemas, types, guards, encoders/decoders for a specific LSP standard (LSP2, LSP3, LSP4, LSP6, LSP23, LSP29, LSP30) plus a shared utils package. These packages are consumed across multiple projects (marketplace, lsp-indexer, and more) and by external developers.

## Core Value

Every `@chillwhales/*` package installs cleanly, works in any JS/TS environment (ESM and CJS), and ships with correct types — consumers never think about compatibility.

## Requirements

### Validated

- ✓ Zod-based schema validation with inferred TypeScript types — existing
- ✓ Runtime type guards for all schemas — existing
- ✓ VerifiableURI encode/decode (LSP2) — existing
- ✓ Key Manager permission key building and parsing (LSP6) — existing
- ✓ Universal Profile deployment param encoding (LSP23) — existing
- ✓ Encrypted asset metadata encode/decode (LSP29) — existing
- ✓ Multi-storage URI encode/decode/resolve (LSP30) — existing
- ✓ Profile and asset metadata validation (LSP3, LSP4) — existing
- ✓ Dual ESM/CJS output with TypeScript declarations — existing
- ✓ Co-located tests with Vitest — existing
- ✓ pnpm workspace monorepo structure — existing

### Active

- [ ] Shared config package (tsconfig, build config, test config)
- [ ] Optimal build system — evaluate whether unbuild is best for compatibility + lightweight output
- [ ] Biome setup for linting and formatting
- [ ] Test coverage reporting
- [ ] CI pipeline (install, lint, format, build, test, coverage)
- [ ] Changesets-based release system with independent versioning
- [ ] Automated npm publishing on release PR merge
- [ ] Changelog generation per package
- [ ] Extract reusable utilities from chillwhales/marketplace
- [ ] Extract reusable utilities from chillwhales/lsp-indexer

### Out of Scope

- Browser-specific builds — library targets Node >= 18, bundlers handle browser compat
- Documentation site — README per package is sufficient for now
- Monorepo migration tool (nx, turborepo) — pnpm workspaces is enough
- GitHub releases — npm is the primary distribution channel (revisit if needed)

## Context

This is a brownfield monorepo with 8 packages already implemented. The code and tests work, but the infrastructure around them is minimal — no linting, no formatting, no CI, no release automation, no shared configs. Each package duplicates its build.config.ts, vitest.config.ts, and tsconfig.json.

Two other repos (chillwhales/marketplace and chillwhales/lsp-indexer) contain utilities that should be extracted into this monorepo. Those repos will then become consumers of these packages. Neither repo currently uses @chillwhales/* packages yet.

No packages have been published to npm yet. This is the first publish.

## Constraints

- **Package manager**: pnpm 10.30.2 — already in use, enforced via packageManager field
- **Node**: >= 18 — declared in engines
- **TypeScript**: ^5.9.3 — already in use
- **npm scope**: @chillwhales — established naming convention
- **Build output**: Must produce ESM (.mjs) + CJS (.cjs) + declarations (.d.ts) — consumers need all three
- **Versioning**: Independent per package — packages evolve at different rates
- **Peer deps**: viem ^2.0.0 must remain a peer dependency for blockchain packages

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Biome over eslint+prettier | Faster, simpler, single tool — no existing eslint/prettier config to migrate | — Pending |
| Changesets over release-please | Simpler workflow for monorepo independent versioning — release-please felt complicated | — Pending |
| Independent versioning | Packages evolve at different rates, consumers pin specific versions | — Pending |
| pnpm workspaces (no nx/turborepo) | Already working, adds no overhead for a monorepo of this size | ✓ Good |

---
*Last updated: 2026-02-27 after initialization*
