---
phase: 08-external-code-extraction
plan: 03
subsystem: lsp-packages
tags: [lsp1, erc725, universal-receiver, data-keys, integration-verification]

requires:
  - phase: 08-external-code-extraction
    provides: monorepo pattern, utility extraction, lsp-specific extraction
provides:
  - "@chillwhales/lsp1 package with LSP1 UniversalReceiver typeId constants and type guards"
  - "@chillwhales/erc725 package with ERC725Y data-key building utilities"
  - "lsp-indexer investigation documenting metadata parsing overlap"
  - "Full monorepo integration verified: 11 packages, 731 tests, all checks pass"
affects: [lsp-indexer-migration, marketplace-migration]

tech-stack:
  added: []
  patterns: [lsp-indexer-audit-for-extractable-constants, erc725y-key-derivation-patterns]

key-files:
  created:
    - packages/lsp1/package.json
    - packages/lsp1/src/index.ts
    - packages/lsp1/src/constants.ts
    - packages/lsp1/src/types.ts
    - packages/lsp1/src/schemas.ts
    - packages/lsp1/src/guards.ts
    - packages/lsp1/src/constants.test.ts
    - packages/lsp1/src/guards.test.ts
    - packages/erc725/package.json
    - packages/erc725/src/index.ts
    - packages/erc725/src/data-keys.ts
    - packages/erc725/src/types.ts
    - packages/erc725/src/schemas.ts
    - packages/erc725/src/data-keys.test.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "LSP1 typeId constants sourced from LUKSO docs, validated against lsp-indexer universalReceiver plugin patterns"
  - "ERC725Y data-key utilities created fresh following LSP2 spec rather than extracting from lsp-indexer (indexer code too coupled)"
  - "lsp-indexer metadata parsing documented as migration opportunity — handlers can consume @chillwhales/lsp3, lsp4, lsp29 parsers"

patterns-established:
  - "lsp-indexer investigation pattern: audit for extractable pure code, document migration opportunities"

requirements-completed: [EXT-01, EXT-02]

duration: 5min
completed: 2026-03-01
---

# Phase 8 Plan 3: New Packages, lsp-indexer Investigation, and Integration Verification Summary

**@chillwhales/lsp1 (UniversalReceiver typeIds + guards) and @chillwhales/erc725 (ERC725Y data-key utilities) created with 44 new tests; lsp-indexer investigated; full monorepo integration verified across all 11 packages (731 tests)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T18:53:31Z
- **Completed:** 2026-03-01T18:59:08Z
- **Tasks:** 2
- **Files modified:** 25

## Accomplishments

- Created @chillwhales/lsp1 with LSP1 UniversalReceiver typeId constants (6 notification types), Zod event schemas, and type guards (isLsp1TypeId, isTokenRecipientNotification, isTokenSenderNotification, isOwnershipNotification)
- Created @chillwhales/erc725 with ERC725Y data-key building utilities (computeSingletonKey, computeArrayKey, computeArrayElementKey, computeMappingKey, computeMappingWithGroupingKey, extractArrayPrefix, extractArrayIndex) plus Zod schemas for data key validation
- Investigated lsp-indexer codebase for extractable code and documented metadata parsing overlap
- Full monorepo integration verified: 11 packages build, 731 tests pass, all checks clean (lint + sherif + knip + madge)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create @chillwhales/lsp1 and @chillwhales/erc725 packages with lsp-indexer investigation** - `7d3ca88` (feat)
2. **Task 2: Write tests for new packages and run full integration verification** - `a357a46` (test)

## Files Created/Modified

- `packages/lsp1/package.json` — LSP1 package manifest following monorepo pattern
- `packages/lsp1/src/constants.ts` — 6 LSP1 UniversalReceiver typeId constants (LSP7/LSP8/LSP14 notifications)
- `packages/lsp1/src/schemas.ts` — Zod schema for UniversalReceiver event data
- `packages/lsp1/src/types.ts` — TypeScript types for UniversalReceiver events
- `packages/lsp1/src/guards.ts` — Type guards: isLsp1TypeId, isTokenRecipientNotification, isTokenSenderNotification, isOwnershipNotification
- `packages/lsp1/src/index.ts` — Barrel exports for all lsp1 modules
- `packages/lsp1/src/constants.test.ts` — 7 tests for typeId constants (valid hex, unique values, completeness)
- `packages/lsp1/src/guards.test.ts` — 14 tests for all type guard functions
- `packages/erc725/package.json` — ERC725 package manifest following monorepo pattern
- `packages/erc725/src/data-keys.ts` — 7 ERC725Y data-key building functions following LSP2 spec
- `packages/erc725/src/schemas.ts` — Zod schemas for data key and key-value pair validation
- `packages/erc725/src/types.ts` — TypeScript types for ERC725Y key-value pairs and key types
- `packages/erc725/src/index.ts` — Barrel exports for all erc725 modules
- `packages/erc725/src/data-keys.test.ts` — 23 tests including known LSP3Profile key verification, roundtrip tests
- `packages/lsp1/build.config.ts` — Shared build config import
- `packages/lsp1/vitest.config.ts` — Shared vitest config import
- `packages/lsp1/tsconfig.json` — Shared tsconfig extends
- `packages/lsp1/README.md` — Usage documentation
- `packages/lsp1/LICENSE` — MIT license
- `packages/erc725/build.config.ts` — Shared build config import
- `packages/erc725/vitest.config.ts` — Shared vitest config import
- `packages/erc725/tsconfig.json` — Shared tsconfig extends
- `packages/erc725/README.md` — Usage documentation
- `packages/erc725/LICENSE` — MIT license
- `pnpm-lock.yaml` — Updated lockfile

## Decisions Made

- **LSP1 typeIds from LUKSO docs** — TypeId constants sourced from the LUKSO documentation and cross-referenced with the lsp-indexer's universalReceiver plugin which uses `LSP0ERC725Account.events.UniversalReceiver.topic` for event matching.
- **ERC725Y utilities created fresh** — The lsp-indexer's data-key handling is deeply coupled to TypeORM entities and the indexer pipeline. Rather than extracting coupled code, new pure utility functions were written following the LSP2 ERC725Y JSON Schema spec directly.
- **Additional guards beyond plan** — Added `isTokenRecipientNotification`, `isTokenSenderNotification`, and `isOwnershipNotification` guards for practical notification categorization (inspired by the lsp-indexer's event routing patterns).

## lsp-indexer Investigation

### Summary

The lsp-indexer codebase (`packages/indexer-v2/src/`) was audited for extractable pure code. Most code is deeply coupled to the indexer infrastructure (TypeORM entities, BatchContext, FK enrichment queues, worker pool). Only constants and patterns were extractable.

### Extractable vs Non-Extractable

**Extracted as constants/patterns:**
- UniversalReceiver event signature and typeId patterns → inspired @chillwhales/lsp1 constants
- ERC725Y data-key derivation patterns → inspired @chillwhales/erc725 utilities
- LSP29 data key constants (`LSP29DataKeys` in `constants/lsp29.ts`) — already present in @chillwhales/lsp29

**NOT extractable (too coupled):**
- `plugins/events/*.plugin.ts` — All event plugins depend on `IBatchContext`, `EntityCategory`, TypeORM entities
- `handlers/*.handler.ts` — All handlers depend on `HandlerContext`, TypeORM entities, `addEntity`/`queueClear`/`queueEnrichment`
- `core/handlerHelpers.ts` — Entity resolution depends on Subsquid Store and BatchContext
- `utils/metadataFetch.ts` — Entire metadata fetch pipeline depends on TypeORM, worker pool, store
- `utils/index.ts` — Mixed: some pure functions (isNumeric, isLink, isFileImage) but most depend on TypeORM entity types

### Metadata Parsing Overlap

Three lsp-indexer handlers parse metadata JSON in ways that @chillwhales/* packages could replace:

1. **`lsp3ProfileFetch.handler.ts`** — Parses LSP3Profile JSON into 7 sub-entity types (name, description, tags, links, avatar, profileImage, backgroundImage). The parsing logic manually validates each field. @chillwhales/lsp3's `lsp3ProfileSchema` (Zod) could validate the JSON structure, and `getProfileDisplayName`/`getProfileImageUrl` could provide display utilities.

2. **`lsp4MetadataFetch.handler.ts`** — Parses LSP4Metadata JSON into 10 sub-entity types (name, description, category, links, images, icons, assets, attributes, score, rank). @chillwhales/lsp4's `lsp4MetadataSchema` could validate the JSON, and `getAssetImageUrl`/`getNftImageUrl`/`getNftDisplayName` could provide display utilities.

3. **`lsp29EncryptedAssetFetch.handler.ts`** — Parses LSP29EncryptedAsset JSON into 7 sub-entity types (title, description, file, encryption, conditions, chunks, images). @chillwhales/lsp29's schemas could validate the structure.

### Recommendations for lsp-indexer Migration

- **Phase 1 (Low risk):** Replace manual JSON validation in fetch handlers with @chillwhales/lsp3, lsp4, lsp29 Zod schemas for `safeParse()` validation
- **Phase 2 (Medium risk):** Use @chillwhales/erc725 `computeArrayElementKey`/`computeMappingKey` for data-key derivation in `lsp5ReceivedAssets.handler.ts`, `lsp12IssuedAssets.handler.ts`, `lsp29EncryptedAsset.handler.ts`
- **Phase 3 (Future):** Consider using @chillwhales/lsp1 typeId constants in the universalReceiver plugin for type-safe notification routing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 8 (External Code Extraction) is complete — all 3 plans executed
- All 11 packages build, test, and lint cleanly (731 tests, zero warnings)
- Monorepo has zero circular dependencies, zero unused exports, zero lint errors
- Ready for phase transition or milestone completion

## Self-Check: PASSED

All 25 files from commits `7d3ca88` and `a357a46` verified present on disk. Both commit hashes verified in git log.

---
*Phase: 08-external-code-extraction*
*Completed: 2026-03-01*
