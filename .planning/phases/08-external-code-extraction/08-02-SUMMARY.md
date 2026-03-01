---
phase: 08-external-code-extraction
plan: 02
subsystem: lsp-utilities
tags: [lsp2, lsp4, lsp6, lsp17, erc725y, image-utils, marketplace-extraction]

requires:
  - phase: 08-external-code-extraction
    provides: marketplace repo access and extraction methodology
provides:
  - 6 new image selection utilities in @chillwhales/lsp2
  - 3 new asset/NFT display utilities in @chillwhales/lsp4
  - LSP17 extension key builders and ERC725Y getData in @chillwhales/lsp6
  - NftMetadata type for token display formatting
affects: [lsp2, lsp4, lsp6, marketplace-migration]

tech-stack:
  added: []
  patterns: [marketplace-extraction-with-type-adaptation, inline-abi-definitions]

key-files:
  created:
    - packages/lsp6/src/erc725y.ts
    - packages/lsp6/src/erc725y.test.ts
  modified:
    - packages/lsp2/src/image-utils.ts
    - packages/lsp2/src/image-utils.test.ts
    - packages/lsp4/src/asset-utils.ts
    - packages/lsp4/src/asset-utils.test.ts
    - packages/lsp4/src/types.ts
    - packages/lsp6/src/index.ts

key-decisions:
  - "LSP17 prefix inlined as constant instead of adding @lukso/lsp17contractextension-contracts dependency"
  - "getData uses inline minimal ERC725Y ABI instead of importing @lukso/universalprofile-contracts"
  - "NftMetadata extends LSP4Metadata with optional token fields instead of separate type"
  - "LSP26 functions noted as candidate for future @chillwhales/lsp26 package (4 functions, substantial)"
  - "LSP23 generateDeployParams skipped as app-specific (uses marketplace-only constants)"
  - "Marketplace lsp4 constants (categories, tags) skipped as UI-specific, not part of LSP4 standard"

patterns-established:
  - "Marketplace extraction pattern: copy, adapt types, skip duplicates, test"

requirements-completed: [EXT-01]

duration: 7min
completed: 2026-03-01
---

# Phase 8 Plan 2: LSP-Specific Function Extraction Summary

**6 new image utilities, 3 NFT/asset display helpers, and LSP17/ERC725Y read utilities extracted from marketplace into @chillwhales/lsp2, lsp4, and lsp6 packages**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-01T18:38:17Z
- **Completed:** 2026-03-01T18:45:29Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Extracted 6 new image selection utilities into @chillwhales/lsp2 (findSmallestImage, findBiggestImage, findOptimalImage, findClosestImageByArea, findClosestImageByAspectRatio, getPreviewImageUrl)
- Extracted 3 new asset/NFT display utilities into @chillwhales/lsp4 (getAssetImageUrl, getNftImageUrl, getNftDisplayName) with NftMetadata type
- Created erc725y.ts in @chillwhales/lsp6 with LSP17 extension key builders (buildLsp17ExtensionKey, extractSelectorFromLsp17ExtensionKey, extractLsp17ExtensionKeys), isHexEqual, and getData overloaded function
- 45 new tests across 3 packages, all passing — lsp2: 106, lsp4: 77, lsp6: 46 total tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract new LSP-specific functions from marketplace** - `8a2f2e2` (feat)
2. **Task 2: Write tests for all extracted LSP-specific functions** - `90f3d8a` (test)

## Files Created/Modified

- `packages/lsp2/src/image-utils.ts` — Added 6 new image selection functions
- `packages/lsp2/src/image-utils.test.ts` — Added 16 new tests for image utilities
- `packages/lsp4/src/asset-utils.ts` — Added getAssetImageUrl, getNftImageUrl, getNftDisplayName
- `packages/lsp4/src/asset-utils.test.ts` — Added 12 new tests for asset utilities
- `packages/lsp4/src/types.ts` — Added NftMetadata interface extending LSP4Metadata
- `packages/lsp6/src/erc725y.ts` — Created with LSP17 key builders, isHexEqual, getData
- `packages/lsp6/src/erc725y.test.ts` — Created with 17 tests for all new functions
- `packages/lsp6/src/index.ts` — Added barrel export for erc725y module

## Decisions Made

- **Inline LSP17 prefix constant** — Avoided adding `@lukso/lsp17contractextension-contracts` as dependency by defining the well-known prefix constant inline. Reduces dependency footprint.
- **Inline minimal ERC725Y ABI** — `getData` uses a 2-function inline ABI (`getData`/`getDataBatch`) instead of importing the full Universal Profile ABI from `@lukso/universalprofile-contracts`. Keeps the package lightweight.
- **NftMetadata as interface extension** — Extended LSP4Metadata with optional `tokenName`, `tokenIdFormat`, `formattedTokenId` fields rather than creating a separate unrelated type, maintaining type compatibility.
- **Skipped marketplace files** — LSP23 `generateDeployParams` (app-specific constants), LSP26 follower functions (candidate for future `@chillwhales/lsp26`), `digital-asset.ts` (blockchain-specific), `abi.ts` (trivial one-liner), LSP4 constants (UI-specific categories/tags).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided adding @lukso/lsp17contractextension-contracts dependency**
- **Found during:** Task 1 (LSP6 erc725y.ts creation)
- **Issue:** Plan suggested adding `@lukso/lsp17contractextension-contracts` to lsp6 package.json, but the package wasn't in the pnpm catalog and would add another LUKSO contract dependency
- **Fix:** Defined the well-known LSP17ExtensionPrefix constant inline (0xcee78b4094da860110960000)
- **Files modified:** packages/lsp6/src/erc725y.ts
- **Verification:** Build succeeds, key building tests pass with correct outputs
- **Committed in:** 8a2f2e2

**2. [Rule 3 - Blocking] Replaced @lukso/universalprofile-contracts import in getData**
- **Found during:** Task 1 (LSP6 erc725y.ts creation)
- **Issue:** Marketplace's getData imported `universalProfileAbi` but lsp6 package doesn't depend on universalprofile-contracts
- **Fix:** Used inline minimal ERC725Y ABI with just getData/getDataBatch function signatures
- **Files modified:** packages/lsp6/src/erc725y.ts
- **Verification:** Build succeeds, getData tests pass with mocked client
- **Committed in:** 8a2f2e2

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to avoid adding unnecessary dependencies. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LSP-specific extraction complete for lsp2, lsp4, lsp6
- Ready for Plan 03 (lsp-indexer extraction: @chillwhales/lsp1 and @chillwhales/erc725)
- LSP26 noted as candidate for future package if needed

---
*Phase: 08-external-code-extraction*
*Completed: 2026-03-01*
