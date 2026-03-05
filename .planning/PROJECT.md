# LSPs — LUKSO Standards Packages

## What This Is

A TypeScript monorepo of LUKSO Standard Proposal implementations published as `@chillwhales/*` npm packages. 11 packages provide schemas, types, guards, encoders/decoders for LSP standards (LSP1, LSP2, LSP3, LSP4, LSP6, LSP23, LSP29, LSP31) plus ERC725 utilities and a shared utils package. These packages are consumed across multiple projects (marketplace, lsp-indexer, and more) and by external developers.

## Core Value

Every `@chillwhales/*` package installs cleanly, works in any JS/TS environment, and ships with correct types — consumers never think about compatibility.

## Current State

**Shipped:** v1.0 MVP (2026-03-05)
**Packages:** 11 publishable (@chillwhales/utils, lsp1, lsp2, lsp3, lsp4, lsp6, lsp23, lsp29, lsp31, erc725 + config private)
**Tests:** 731 passing across all packages
**Coverage:** 94%+ baseline (80% threshold enforced)
**Codebase:** 15,544 LOC TypeScript
**Stack:** TypeScript 5.9, unbuild (ESM-only), Vitest 4, Biome v2, pnpm 10, changesets

## Requirements

### Validated

- ✓ Shared config package (tsconfig, build config, test config) — v1.0
- ✓ Biome setup for linting and formatting — v1.0
- ✓ Test coverage reporting with 80% thresholds — v1.0
- ✓ CI pipeline (install, lint, format, build, test, coverage) — v1.0
- ✓ Changesets-based release system with independent versioning — v1.0
- ✓ Automated npm publishing on release PR merge — v1.0
- ✓ Changelog generation per package with PR attribution — v1.0
- ✓ Extract reusable utilities from chillwhales/marketplace — v1.0
- ✓ Extract reusable utilities from chillwhales/lsp-indexer — v1.0
- ✓ Zod-based schema validation with inferred TypeScript types — existing
- ✓ Runtime type guards for all schemas — existing
- ✓ VerifiableURI encode/decode (LSP2) — existing
- ✓ Key Manager permission key building and parsing (LSP6) — existing
- ✓ Universal Profile deployment param encoding (LSP23) — existing
- ✓ Encrypted asset metadata encode/decode (LSP29) — existing
- ✓ Multi-storage URI encode/decode/resolve (LSP31) — existing
- ✓ Profile and asset metadata validation (LSP3, LSP4) — existing
- ✓ ESM-only output with TypeScript declarations — v1.0 (switched from dual ESM/CJS to ESM-only)
- ✓ Co-located tests with Vitest — existing
- ✓ pnpm workspace monorepo structure — existing

### Active

(None — next milestone not yet planned. Run `/gsd-new-milestone` to define v1.1 scope.)

### Out of Scope

- Browser-specific builds — library targets Node >= 18, bundlers handle browser compat
- Documentation site — README per package is sufficient until there's adoption
- Monorepo migration tool (nx, turborepo) — pnpm workspaces is enough at 11 packages
- JSR publishing — npm is where consumers are, JSR adoption still early
- Offline mode — packages are build-time dependencies, no runtime server needed

## Context

Shipped v1.0 MVP with 15,544 LOC TypeScript across 11 packages.
Tech stack: TypeScript 5.9, unbuild (ESM-only), Vitest 4, Biome v2, pnpm 10, changesets.
Monorepo grew from 8 original packages to 11 after marketplace/lsp-indexer extraction.
All packages pass publint --strict and attw --pack. CI validates every PR automatically.
No packages have been published to npm yet — release automation is in place, awaiting first changeset merge.

Two consumer repos (marketplace, lsp-indexer) are documented as migration candidates for @chillwhales/* packages.

## Constraints

- **Package manager**: pnpm 10.30.2 — enforced via preinstall + only-allow
- **Node**: >= 18 — declared in engines (tests require Node 22+ for Vitest 4 ESM compat)
- **TypeScript**: ^5.9.3
- **npm scope**: @chillwhales — established naming convention
- **Build output**: ESM-only (.mjs) + declarations (.d.ts) — CJS removed in v1.0
- **Versioning**: Independent per package via changesets
- **Peer deps**: viem ^2.0.0 for blockchain packages

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Biome over eslint+prettier | Faster, simpler, single tool — no existing config to migrate | ✓ Good — zero config, formatted 92 files instantly |
| Changesets over release-please | Simpler workflow for monorepo independent versioning | ✓ Good — clean PR-based workflow |
| Independent versioning | Packages evolve at different rates | ✓ Good — standard for diverse monorepos |
| pnpm workspaces (no nx/turborepo) | Already working, no overhead at this size | ✓ Good — sufficient for 11 packages |
| ESM-only (removed CJS) | Consumers use modern bundlers, CJS caused attw errors | ✓ Good — simplified build, clean publint/attw |
| simple-git-hooks over husky | Simpler config, package.json-based, zero boilerplate | ✓ Good — auto-installs on pnpm install |
| @chillwhales/config as private package | Shared factory functions, direct .ts exports (no build) | ✓ Good — clean wrapper pattern |
| pnpm catalogs (single default) | All shared deps meet 2+ package threshold | ✓ Good — 25 centralized versions |
| vitest-coverage-report-action | PR coverage comments without Codecov dependency | ✓ Good — simpler than Codecov integration |
| pkg-pr-new for snapshot releases | PR preview without publishing to npm | ✓ Good — with fork security guard |
| LSP17 prefix inlined | Avoided @lukso/lsp17contractextension-contracts dep | ✓ Good — fewer dependencies |
| ERC725Y keys from spec | Created fresh vs extracting coupled lsp-indexer code | ✓ Good — clean implementation |

---
*Last updated: 2026-03-05 after v1.0 milestone*
