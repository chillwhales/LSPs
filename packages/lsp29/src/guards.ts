/**
 * LSP29 Encrypted Assets Type Guards
 *
 * Structural validation for identifying LSP29 v2.0.0 encrypted asset objects.
 *
 * @see LSP-29-EncryptedAssets.md for full specification
 */

import { lsp29EncryptedAssetSchema } from './schemas';
import type { LSP29EncryptedAsset } from './types';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if data is a valid LSP29 Encrypted Asset (v2.0.0)
 *
 * Uses Zod schema validation to verify the structure matches the
 * LSP29EncryptedAsset specification. Does not throw on invalid data.
 *
 * @param data - Unknown data to check
 * @returns true if data is a valid LSP29EncryptedAsset
 *
 * @example
 * ```typescript
 * if (isLsp29Asset(unknownData)) {
 *   console.log(unknownData.LSP29EncryptedAsset.title);
 * }
 *
 * const lsp29Assets = decodedItems.filter(isLsp29Asset);
 * ```
 */
export function isLsp29Asset(data: unknown): data is LSP29EncryptedAsset {
  return lsp29EncryptedAssetSchema.safeParse(data).success;
}
