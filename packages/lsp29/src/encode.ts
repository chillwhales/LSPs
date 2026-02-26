/**
 * LSP29 Data Key Computation Utilities
 *
 * Pure functions for computing ERC725Y data keys according to the LSP-29
 * Encrypted Assets specification. These utilities enable storage and
 * retrieval of encrypted assets on Universal Profiles.
 *
 * Ported from packages/utils/src/lsp29.ts — uses local constants (zero external imports).
 *
 * @see LSP-29-EncryptedAssets.md for full specification
 * @see https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md
 */

import { concat, encodePacked, type Hex, keccak256, slice, toHex } from "viem";

import { LSP29DataKeys, MAPPING_SEPARATOR } from "./constants";

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Computes the first 20 bytes of a keccak256 hash for use as mapping key suffix
 */
function hashToFirst20Bytes(data: Hex): Hex {
  return slice(keccak256(data), 0, 20);
}

// ============================================================================
// Array Key Computation
// ============================================================================

/**
 * Computes the data key for a specific LSP29EncryptedAssets[] array element
 *
 * According to LSP2 Array specification, element keys are formed by:
 * - First 16 bytes: First 16 bytes of the array key
 * - Last 16 bytes: uint128 index value
 *
 * @param index - Zero-based array index (must be non-negative integer or bigint)
 * @returns 32-byte data key for the array element
 * @throws Error if index is negative
 *
 * @example
 * ```typescript
 * const key0 = computeLsp29ArrayIndexKey(0);
 * // '0x1965f98377ddff08e78c93d820cc8de400000000000000000000000000000000'
 *
 * const key1 = computeLsp29ArrayIndexKey(1);
 * // '0x1965f98377ddff08e78c93d820cc8de400000000000000000000000000000001'
 *
 * // Also works with bigint
 * const keyBigInt = computeLsp29ArrayIndexKey(BigInt(5));
 * ```
 */
export function computeLsp29ArrayIndexKey(index: number | bigint): Hex {
  const indexBigInt = BigInt(index);
  if (indexBigInt < BigInt(0)) {
    throw new Error("Index must be a non-negative integer");
  }

  return concat([
    LSP29DataKeys["LSP29EncryptedAssets[]"].index,
    toHex(indexBigInt, { size: 16 }),
  ]);
}

// ============================================================================
// Mapping Key Computation
// ============================================================================

/**
 * Computes the mapping key for the latest version of encrypted content
 *
 * This key maps a content ID to the array index of its most recent revision.
 * The key is updated each time a new revision is added.
 *
 * Key format: LSP29EncryptedAssetsMap prefix + first 20 bytes of keccak256(contentId)
 *
 * @param contentId - Unique content identifier chosen by the creator
 * @returns 32-byte mapping data key
 *
 * @example
 * ```typescript
 * const key = computeLsp29MapKey('premium-content');
 * // Returns: '0x2b9a7a38a67cedc507c20000...' (32 bytes)
 * ```
 */
export function computeLsp29MapKey(contentId: string): Hex {
  return concat([
    LSP29DataKeys.LSP29EncryptedAssetsMap,
    MAPPING_SEPARATOR,
    hashToFirst20Bytes(toHex(contentId)),
  ]);
}

/**
 * Computes the mapping key for a specific revision of encrypted content
 *
 * This key maps a content ID + revision number to the array index of that
 * specific version. These keys are immutable once set.
 *
 * Key format: LSP29EncryptedAssetsMap prefix + first 20 bytes of keccak256(abi.encodePacked(contentId, uint32(revision)))
 *
 * @param contentId - Unique content identifier chosen by the creator
 * @param revision - Version number (1-based, must be positive integer)
 * @returns 32-byte mapping data key
 * @throws Error if revision is not a positive integer
 *
 * @example
 * ```typescript
 * const keyV1 = computeLsp29MapKeyVersioned('premium-content', 1);
 * const keyV2 = computeLsp29MapKeyVersioned('premium-content', 2);
 * ```
 */
export function computeLsp29MapKeyVersioned(
  contentId: string,
  revision: number,
): Hex {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new Error("Revision must be a positive integer (1 or greater)");
  }

  const packed = encodePacked(["string", "uint32"], [contentId, revision]);

  return concat([
    LSP29DataKeys.LSP29EncryptedAssetsMap,
    MAPPING_SEPARATOR,
    hashToFirst20Bytes(packed),
  ]);
}

/**
 * Computes the revision count mapping key for a content ID
 *
 * This key maps a content ID to the total number of revisions published.
 * Used to enumerate all versions and validate revision numbers.
 *
 * Key format: LSP29EncryptedAssetRevisionCount prefix + first 20 bytes of keccak256(contentId)
 *
 * @param contentId - Unique content identifier chosen by the creator
 * @returns 32-byte mapping data key
 *
 * @example
 * ```typescript
 * const key = computeLsp29RevisionCountKey('premium-content');
 * ```
 */
export function computeLsp29RevisionCountKey(contentId: string): Hex {
  return concat([
    LSP29DataKeys.LSP29EncryptedAssetRevisionCount,
    MAPPING_SEPARATOR,
    hashToFirst20Bytes(toHex(contentId)),
  ]);
}
