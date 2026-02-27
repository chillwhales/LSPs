/**
 * LSP29 Metadata Decoding
 *
 * Parses and validates LSP29 encrypted asset metadata JSON.
 *
 * @see LSP-29-EncryptedAssets.md for full specification
 */

import { lsp29EncryptedAssetSchema } from "./schemas";
import type { LSP29EncryptedAsset } from "./types";

// ============================================================================
// Decoding Functions
// ============================================================================

/**
 * Parses an LSP29 metadata JSON string and validates it against the v2.0.0 schema.
 *
 * @param json - JSON string containing LSP29 encrypted asset metadata
 * @returns Parsed and validated LSP29EncryptedAsset
 * @throws Error if JSON is invalid or doesn't match the v2.0.0 schema
 *
 * @example
 * ```typescript
 * const metadata = decodeLsp29Metadata(jsonString);
 * console.log(metadata.LSP29EncryptedAsset.title);
 * console.log(metadata.LSP29EncryptedAsset.encryption.provider);
 * ```
 */
export function decodeLsp29Metadata(json: string): LSP29EncryptedAsset {
	let parsed: unknown;

	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error("Invalid LSP29 metadata: failed to parse JSON");
	}

	return lsp29EncryptedAssetSchema.parse(parsed);
}
