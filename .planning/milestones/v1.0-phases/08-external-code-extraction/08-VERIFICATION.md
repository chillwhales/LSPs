---
phase: 08-external-code-extraction
verified: 2026-03-01T19:05:05Z
status: passed
score: 7/7 must-haves verified
---

# Phase 8: External Code Extraction Verification Report

**Phase Goal:** Reusable utilities from chillwhales/marketplace and chillwhales/lsp-indexer live in the monorepo and those repos consume the published packages.
**Verified:** 2026-03-01T19:05:05Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | General utilities from marketplace extracted into @chillwhales/utils | ✓ VERIFIED | 15 modules in packages/utils/src/index.ts barrel (address, blockchain, collections, constants, currency, files, images, ipfs, links, numbers, pagination, strings, time, transformers, validation); viem in peerDependencies |
| 2 | LSP-specific utilities merged into respective @chillwhales/lspX packages | ✓ VERIFIED | lsp2: 6 new image functions (findSmallestImage, findBiggestImage, findOptimalImage, findClosestImageByArea, findClosestImageByAspectRatio, getPreviewImageUrl); lsp4: 3 new functions (getAssetImageUrl, getNftImageUrl, getNftDisplayName) + NftMetadata type; lsp6: erc725y.ts with LSP17 key builders + getData + isHexEqual |
| 3 | @chillwhales/lsp1 package exists with LSP1 UniversalReceiver constants and type guards | ✓ VERIFIED | packages/lsp1/ with constants.ts (6 typeIds, UNIVERSAL_RECEIVER_EVENT_SIGNATURE), guards.ts (isLsp1TypeId, isTokenRecipientNotification, isTokenSenderNotification, isOwnershipNotification), schemas.ts, types.ts; standard monorepo pattern (createBuildConfig, createVitestConfig) |
| 4 | @chillwhales/erc725 package exists with ERC725Y data-key building utilities | ✓ VERIFIED | packages/erc725/ with data-keys.ts (7 functions: computeSingletonKey, computeArrayKey, computeArrayElementKey, computeMappingKey, computeMappingWithGroupingKey, extractArrayPrefix, extractArrayIndex); 125 lines of substantive implementation, schemas.ts, types.ts |
| 5 | All 11 packages build with zero warnings | ✓ VERIFIED | `pnpm build` exits 0 — config, utils, lsp1, lsp2, lsp3, lsp4, lsp6, lsp23, lsp29, lsp31, erc725 all build successfully |
| 6 | All tests pass (731 tests across 42 test files) | ✓ VERIFIED | `pnpm test` exits 0 — 731 passed across 42 test files; utils: 15 test files, lsp1: 2 test files, erc725: 1 test file |
| 7 | pnpm check passes (lint + sherif + knip + madge) | ✓ VERIFIED | `pnpm check` exits 0 — biome: 162 files checked, sherif: no issues, knip: clean, madge: no circular dependencies |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/utils/src/address.ts` | Address formatting/comparison functions | ✓ VERIFIED | 279 lines, 11 exported functions (normalizeAddress, safeNormalizeAddress, isValidAddress, truncateAddress, formatAddress, formatAddressWithLabel, compareAddresses, isAddressInList, findAddress, uniqueAddresses, sortAddresses) |
| `packages/utils/src/blockchain.ts` | ERC725Y uint128 encode/decode | ✓ VERIFIED | 49 lines, parseUint128 + encodeUint128 with viem Hex type |
| `packages/utils/src/ipfs.ts` | IPFS URL parsing and CID extraction | ✓ VERIFIED | 116 lines, 5 functions (extractCidFromIpfsUrl, parseIpfsUrl, isIpfsUrl, cidToIpfsUrl, cidToGatewayUrl) |
| `packages/utils/src/index.ts` | Barrel exports for all modules | ✓ VERIFIED | 15 `export * from` statements covering all utility modules |
| `packages/utils/package.json` | viem peer dependency | ✓ VERIFIED | `"viem": "catalog:"` in both peerDependencies and devDependencies |
| `packages/lsp2/src/image-utils.ts` | Extended image utilities | ✓ VERIFIED | 297 lines, 6 new functions added (findSmallestImage, findBiggestImage, findOptimalImage, findClosestImageByArea, findClosestImageByAspectRatio, getPreviewImageUrl) |
| `packages/lsp4/src/asset-utils.ts` | Extended asset utilities | ✓ VERIFIED | 168 lines, 3 new functions (getAssetImageUrl, getNftImageUrl, getNftDisplayName) |
| `packages/lsp4/src/types.ts` | NftMetadata type | ✓ VERIFIED | NftMetadata interface extending LSP4Metadata with tokenName, tokenIdFormat, formattedTokenId |
| `packages/lsp6/src/erc725y.ts` | LSP17 key builders + getData | ✓ VERIFIED | 209 lines, 5 exported functions (buildLsp17ExtensionKey, extractSelectorFromLsp17ExtensionKey, extractLsp17ExtensionKeys, isHexEqual, getData with overloads) |
| `packages/lsp6/src/index.ts` | Barrel exports including erc725y | ✓ VERIFIED | `export * from "./erc725y"` present |
| `packages/lsp1/package.json` | LSP1 package manifest | ✓ VERIFIED | Standard monorepo pattern, zod + viem dependencies |
| `packages/lsp1/src/index.ts` | LSP1 barrel exports | ✓ VERIFIED | 13 lines, exports constants, guards, schemas, types |
| `packages/lsp1/src/constants.ts` | LSP1 typeId constants | ✓ VERIFIED | 52 lines, 6 typeIds + event signature + LSP1TypeId type |
| `packages/lsp1/build.config.ts` | Shared build config | ✓ VERIFIED | `createBuildConfig` import from @chillwhales/config/build |
| `packages/erc725/package.json` | ERC725 package manifest | ✓ VERIFIED | Standard monorepo pattern, zod + viem dependencies |
| `packages/erc725/src/index.ts` | ERC725 barrel exports | ✓ VERIFIED | 12 lines, exports data-keys, schemas, types |
| `packages/erc725/src/data-keys.ts` | ERC725Y data-key building utilities | ✓ VERIFIED | 125 lines, 7 exported functions following LSP2 spec |
| `packages/erc725/build.config.ts` | Shared build config | ✓ VERIFIED | `createBuildConfig` import from @chillwhales/config/build |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/utils/src/index.ts` | new utility modules | `export * from` | ✓ WIRED | 15 export statements covering all extracted modules |
| `packages/utils/package.json` | viem | peerDependencies | ✓ WIRED | `"viem": "catalog:"` in peerDependencies |
| `packages/lsp4/src/asset-utils.ts` | @chillwhales/lsp2 | findBestImage import | ✓ WIRED | `import { findBestImage, type Image, type ImageSize } from "@chillwhales/lsp2"` on line 7 |
| `packages/lsp6/src/index.ts` | erc725y.ts | barrel export | ✓ WIRED | `export * from "./erc725y"` on line 10 |
| `packages/lsp1/build.config.ts` | @chillwhales/config/build | createBuildConfig | ✓ WIRED | Standard monorepo pattern confirmed |
| `packages/erc725/build.config.ts` | @chillwhales/config/build | createBuildConfig | ✓ WIRED | Standard monorepo pattern confirmed |
| pnpm build (root) | all 11 packages | pnpm -r build | ✓ WIRED | All 11 packages build successfully |
| pnpm test (root) | all packages | vitest auto-discovery | ✓ WIRED | 42 test files discovered and executed, 731 tests pass |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|
| EXT-01 | 08-01, 08-02, 08-03 | Reusable utilities from chillwhales/marketplace are identified and extracted | ✓ SATISFIED | 15 general utility modules in @chillwhales/utils + LSP-specific functions in lsp2/lsp4/lsp6; no @chillpass imports remain |
| EXT-02 | 08-03 | Reusable utilities from chillwhales/lsp-indexer are identified and extracted | ✓ SATISFIED | lsp-indexer investigated; LSP1 constants/guards extracted as @chillwhales/lsp1; ERC725Y key derivation patterns implemented as @chillwhales/erc725; metadata parsing overlap documented in 08-03-SUMMARY |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODO/FIXME/PLACEHOLDER found | ℹ️ Info | Clean |
| — | — | No @chillpass imports found | ℹ️ Info | Clean |
| — | — | No stubs or empty implementations | ℹ️ Info | All `return null` entries are legitimate edge-case handling |

### Human Verification Required

### 1. External Repo Consumption

**Test:** Verify that chillwhales/marketplace and chillwhales/lsp-indexer can install and import the published @chillwhales/* packages
**Expected:** External repos install packages successfully and their existing code can be replaced with imports from @chillwhales/*
**Why human:** Phase goal states "those repos consume the published packages" — this requires actual migration PRs against external repos which are out of scope per 08-CONTEXT.md ("Migration PRs for external repos to consume these packages are OUT OF SCOPE")

> **Note:** The phase CONTEXT.md explicitly scopes migration PRs out: "Migration PRs for marketplace and lsp-indexer to consume @chillwhales/* packages — separate phase after extraction and publishing." The phase goal's second clause ("those repos consume the published packages") is aspirational — the extractable code now lives in the monorepo and is publish-ready. The actual consumption will happen after Phase 7 publishes to npm.

### Gaps Summary

No gaps found. All 7 observable truths verified. All artifacts exist, are substantive (no stubs), and are properly wired. All key links confirmed. Both requirements (EXT-01, EXT-02) satisfied. Zero anti-patterns detected. Full quality pipeline passes (build, test, lint, sherif, knip, madge).

The phase goal is achieved within its documented scope: reusable utilities from both external repos have been extracted into the monorepo as 11 packages that build, test, and lint cleanly. External repo consumption is deferred per the phase context.

---

_Verified: 2026-03-01T19:05:05Z_
_Verifier: Claude (gsd-verifier)_
