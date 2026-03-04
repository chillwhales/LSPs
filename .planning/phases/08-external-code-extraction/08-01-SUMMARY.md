---
phase: 08-external-code-extraction
plan: 01
subsystem: utilities
tags: [utils, address, ipfs, blockchain, currency, time, collections, validation, marketplace-extraction]

requires:
  - phase: 08-external-code-extraction
    provides: marketplace repo access for utility extraction
provides:
  - 15 new utility modules in @chillwhales/utils (address, blockchain, collections, constants, currency, files, images, ipfs, links, pagination, time, transformers, validation)
  - Expanded numbers.ts and strings.ts with new functions
  - viem as peerDependency for address/blockchain utilities
affects: [utils, marketplace-migration, lsp-specific-extraction]

tech-stack:
  added: [viem (peer dep)]
  patterns: [marketplace-extraction-with-type-adaptation, inline-generic-types-to-avoid-circular-deps]

key-files:
  created:
    - packages/utils/src/address.ts
    - packages/utils/src/blockchain.ts
    - packages/utils/src/collections.ts
    - packages/utils/src/constants.ts
    - packages/utils/src/currency.ts
    - packages/utils/src/files.ts
    - packages/utils/src/images.ts
    - packages/utils/src/ipfs.ts
    - packages/utils/src/links.ts
    - packages/utils/src/pagination.ts
    - packages/utils/src/time.ts
    - packages/utils/src/transformers.ts
    - packages/utils/src/validation.ts
    - packages/utils/src/address.test.ts
    - packages/utils/src/blockchain.test.ts
    - packages/utils/src/collections.test.ts
    - packages/utils/src/constants.test.ts
    - packages/utils/src/currency.test.ts
    - packages/utils/src/files.test.ts
    - packages/utils/src/images.test.ts
    - packages/utils/src/ipfs.test.ts
    - packages/utils/src/links.test.ts
    - packages/utils/src/pagination.test.ts
    - packages/utils/src/time.test.ts
    - packages/utils/src/transformers.test.ts
    - packages/utils/src/validation.test.ts
  modified:
    - packages/utils/src/numbers.ts
    - packages/utils/src/strings.ts
    - packages/utils/src/index.ts
    - packages/utils/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Monorepo isNumeric kept over marketplace version (stricter validation)"
  - "ImageEntry generic interface used instead of importing from @chillwhales/lsp2 to avoid circular deps"
  - "computeCidFromString skipped to avoid ipfs-only-hash dependency weight"
  - "getImageSize skipped — uses browser Image constructor, not suitable for Node library"
  - "Marketplace files.ts mostly skipped — only formatFileSize extracted (rest uses @chillpass/constants or browser crypto)"
  - "Marketplace mime-types.ts skipped entirely — depends on mime-types npm package and @chillpass/constants"
  - "Marketplace urls.ts skipped — app-specific with marketplace route builders"
  - "Marketplace known-addresses.ts skipped — app-specific registry, not general-purpose"
  - "viem added as peerDependency using catalog: pattern consistent with PKG-04"

patterns-established:
  - "Marketplace extraction pattern: clone, audit, classify (extract/skip/defer), adapt types, format, test"
  - "Generic interface pattern: define lightweight interfaces locally to avoid cross-package deps"

requirements-completed: [EXT-01]

duration: 8min
completed: 2026-03-01
---

# Phase 8 Plan 1: General Utility Extraction Summary

**15 general-purpose utility modules (address, blockchain, collections, constants, currency, files, images, ipfs, links, pagination, time, transformers, validation) extracted from marketplace into @chillwhales/utils with 251 tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T18:38:18Z
- **Completed:** 2026-03-01T18:49:31Z
- **Tasks:** 2
- **Files modified:** 31

## Accomplishments

- Extracted 15 new utility modules from chillwhales/marketplace into @chillwhales/utils, covering address formatting, blockchain helpers, collection operations, LUKSO constants, currency formatting, file size formatting, image selection, IPFS URL parsing, link parsing, pagination, time formatting, string/binary transformers, and validation
- Expanded existing numbers.ts with 8 new functions (formatNumber, formatCompactNumber, formatPercentage, parseNumber, clamp, round, randomNumber, isPositiveNumber) and strings.ts with truncate function
- Wrote 251 tests across 13 test files — all passing, Biome lint clean
- Added viem as peerDependency (catalog:) for address and blockchain modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Clone marketplace and extract general utility functions** - `f4ccb08` (feat)
2. **Task 2: Write tests for all extracted utilities and verify package** - `0690967` (test)

## Files Created/Modified

- `packages/utils/src/address.ts` — Address normalization, truncation, comparison, formatting (uses viem Address type)
- `packages/utils/src/blockchain.ts` — ERC725Y uint128 encode/decode helpers (uses viem Hex type)
- `packages/utils/src/collections.ts` — groupBy, uniqueBy, sortBy, chunk, partition, shuffle, flatten, zip, range, etc.
- `packages/utils/src/constants.ts` — LUKSO addresses (UP, LSP7/8, Vault), network config, MIME types, upload limits
- `packages/utils/src/currency.ts` — formatPrice, microUsdToUsd, formatTokenAmount, formatCurrencyRange
- `packages/utils/src/files.ts` — formatFileSize (bytes to human-readable)
- `packages/utils/src/images.ts` — findSmallestImage, findBiggestImage, findOptimalImage, findClosestImageByArea/AspectRatio
- `packages/utils/src/ipfs.ts` — extractCid, parseIpfsUrl, isIpfsUrl, cidToIpfsUrl, cidToGatewayUrl
- `packages/utils/src/links.ts` — parseLink, getSocialPlatform, sortLinks, parseAndSortLinks
- `packages/utils/src/numbers.ts` — MODIFIED: added formatNumber, formatCompactNumber, formatPercentage, parseNumber, clamp, round, randomNumber, isPositiveNumber, isNonNegativeNumber
- `packages/utils/src/pagination.ts` — calculateTotalPages
- `packages/utils/src/strings.ts` — MODIFIED: added truncate function
- `packages/utils/src/time.ts` — formatDate, formatRelativeTime, formatDuration, formatTime, formatCountdown, isToday, isYesterday
- `packages/utils/src/transformers.ts` — base64 encoding/decoding, UTF-8, string normalization, capitalizeFirst, toTitleCase, truncateString
- `packages/utils/src/validation.ts` — isEmpty, isValidUrl, isValidEmail, isValidEthereumAddress, isHexString, sanitizeHtml, validateRequired
- `packages/utils/src/index.ts` — MODIFIED: barrel exports for all 15 modules
- `packages/utils/package.json` — MODIFIED: added viem peerDependency + devDependency
- `pnpm-lock.yaml` — MODIFIED: lockfile updated
- 13 test files — comprehensive coverage for all extracted modules

## Decisions Made

- **Monorepo isNumeric kept** — Marketplace has a simpler `isNumeric`; monorepo version is stricter (validates actual numeric strings), so it was preserved per CONTEXT.md "monorepo version wins" rule.
- **ImageEntry generic interface** — Used a local `ImageEntry` interface (`{ width: number; height: number; url: string }`) instead of importing from `@chillwhales/lsp2` to avoid circular dependencies between utils and lsp2.
- **computeCidFromString skipped** — Requires `ipfs-only-hash` npm package which adds significant weight; noted in JSDoc as "available in marketplace, omitted to keep utils lightweight."
- **getImageSize skipped** — Uses browser `Image` constructor, not suitable for a Node-compatible library.
- **Selective file extraction** — Only `formatFileSize` from marketplace's `files.ts` (rest uses `@chillpass/constants` or browser crypto). Entire `mime-types.ts` skipped (depends on `mime-types` npm lib). Entire `urls.ts` skipped (marketplace-specific route builders). `known-addresses.ts` skipped (app-specific registry).
- **viem via catalog:** — Added `"viem": "catalog:"` for both peerDependencies and devDependencies, consistent with PKG-04 pattern used by lsp2/lsp4/lsp6.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Skipped marketplace-specific modules not identified in plan**
- **Found during:** Task 1 (marketplace audit)
- **Issue:** Plan listed `urls.ts` and `mime-types.ts` for extraction, but audit revealed they depend on `@chillpass/constants` and `mime-types` npm package (marketplace-specific)
- **Fix:** Skipped both modules entirely per CONTEXT.md decision rules; documented as permanently skipped
- **Verification:** Package builds without these modules, no missing exports
- **Committed in:** f4ccb08

**2. [Rule 1 - Bug] Used generic ImageEntry interface instead of @chillwhales/lsp2 import**
- **Found during:** Task 1 (images.ts creation)
- **Issue:** Plan suggested importing Image type from `@chillwhales/lsp2`, but this would create a circular dependency (utils → lsp2, lsp2 → utils)
- **Fix:** Defined lightweight `ImageEntry` interface locally in images.ts
- **Verification:** Build succeeds, no circular dependency warnings from madge
- **Committed in:** f4ccb08

---

**Total deviations:** 2 auto-fixed (1 missing critical assessment, 1 bug prevention)
**Impact on plan:** Both fixes necessary for correctness and avoiding unwanted dependencies. No scope creep.

## Issues Encountered

None — extraction proceeded smoothly after marketplace audit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- General utility extraction complete; @chillwhales/utils expanded from 2 to 15+ modules
- Ready for Plan 02 (LSP-specific function extraction into lsp2, lsp4, lsp6)
- Marketplace extraction pattern established: clone → audit → classify → extract → adapt types → test

## Self-Check: PASSED

All 31 files from commits `f4ccb08` and `0690967` verified present on disk. Both commit hashes verified in git log.

---
*Phase: 08-external-code-extraction*
*Completed: 2026-03-01*
