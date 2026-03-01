# Phase 8: External Code Extraction - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract reusable utilities from `chillwhales/marketplace` and `chillwhales/lsp-indexer` into this monorepo. Publish them as `@chillwhales/*` packages. Migration PRs for external repos to consume these packages are OUT OF SCOPE — that's a later phase.

</domain>

<decisions>
## Implementation Decisions

### Extraction Scope
- Extract everything reusable from marketplace — LSP-specific, blockchain helpers, AND general utilities (address, currency, time, numbers, ipfs, etc.)
- From lsp-indexer: extract `lsp1` and `data-keys` only. `types` and `abi` packages stay in lsp-indexer
- Investigate whether lsp-indexer has LSP3/LSP4/LSP29 metadata parsing logic that could be replaced by existing `@chillwhales/lsp3`, `@chillwhales/lsp4`, `@chillwhales/lsp29` parsers
- Extract marketplace `packages/constants/` (known addresses, ABIs, config values)
- Do NOT extract marketplace `packages/zod/` — Zod schemas are app-specific and force a runtime dependency
- Marketplace `packages/lsp29/` and `packages/lsp30/` are duplicates of monorepo originals (code was copied into this repo at creation) — just swap imports in marketplace later, no merging needed

### Package Placement
- LSP-specific utility functions from marketplace merge into their existing `@chillwhales/lspX` packages (e.g., marketplace `lsp3.ts` → `@chillwhales/lsp3`)
- All non-LSP utilities (address, blockchain, ipfs, currency, time, numbers, strings, etc.) go into `@chillwhales/utils`
- LSP-specific constants from marketplace merge into their `@chillwhales/lspX` packages (e.g., `lsp4.ts` constants → `@chillwhales/lsp4`)
- General constants (known addresses, general config) go into `@chillwhales/utils`
- lsp-indexer `lsp1` → new `@chillwhales/lsp1` package
- lsp-indexer `data-keys` → new `@chillwhales/erc725` package (renamed)

### Extraction Method
- Copy and adapt in one pass — copy source files, adapt to monorepo conventions (ESM, Biome, shared build config, vitest) during extraction
- Keep external dependencies, declare properly — if extracted code uses `viem`, declare as peer dependency (consistent with existing PKG-04 pattern)
- Bring existing tests AND write new tests for all extracted code — every extracted file gets test coverage

### API Surface
- On naming conflicts: monorepo version wins. Only add marketplace functions that are genuinely new
- Flat named exports — add new functions directly to package barrel export (`index.ts`), no subpath exports
- Constants exported as individual named exports (tree-shakeable, auto-completable)

### Claude's Discretion
- `@chillwhales/erc725` API naming — keep function names that are already clean, rename anything awkwardly tied to "indexer" or "data-keys" context
- Types co-location — follow whatever export pattern existing monorepo packages already use
- Per-file dependency decisions — keep a dependency if core to the function, remove if trivial to replace

</decisions>

<specifics>
## Specific Ideas

- Marketplace `packages/lsp29/` and `packages/lsp30/` were the originals copied into this monorepo in the first commits — they are confirmed duplicates, not diverged forks
- Check lsp-indexer for metadata download/parsing logic for LSP3, LSP4, or LSP29 — if found, assess whether existing `@chillwhales/*` parsers can replace it
- The monorepo already has 9 packages (config, lsp2, lsp3, lsp4, lsp6, lsp23, lsp29, lsp31, utils) — this phase adds `@chillwhales/lsp1` and `@chillwhales/erc725` (11 total)

</specifics>

<deferred>
## Deferred Ideas

- Migration PRs for marketplace and lsp-indexer to consume `@chillwhales/*` packages — separate phase after extraction and publishing
- Zod validation schemas package — not extracted, may revisit if multiple consumers need shared validation

</deferred>

---

*Phase: 08-external-code-extraction*
*Context gathered: 2026-03-01*
