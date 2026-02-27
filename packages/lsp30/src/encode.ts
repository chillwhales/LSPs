/**
 * LSP30 Multi-Storage URI Encoding
 *
 * Encodes multi-storage entries into the LSP30 on-chain format:
 * 0x0030 + method (4) + hashLength (2) + hash (32) + toUtf8Hex(JSON.stringify(entries))
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

import { concat, type Hex, keccak256, stringToHex } from "viem";

import {
	HASH_LENGTH_PREFIX,
	KECCAK256_BYTES_METHOD_ID,
	LSP30_RESERVED_PREFIX,
} from "./constants";
import { lsp30EntriesSchema } from "./schemas";
import type { Lsp30Entry } from "./types";

// ============================================================================
// Encoding Functions
// ============================================================================

/**
 * Computes the keccak256 content hash from raw bytes.
 *
 * @param content - Raw content bytes (identical across all storage backends)
 * @returns keccak256 hash as a 0x-prefixed hex string
 *
 * @example
 * ```typescript
 * const contentBytes = new Uint8Array([...]);
 * const hash = computeContentHash(contentBytes);
 * const encoded = encodeLsp30Uri(entries, hash);
 * ```
 */
export function computeContentHash(content: Uint8Array): Hex {
	return keccak256(content);
}

/**
 * Encodes storage entries and a pre-computed verification hash into the LSP30 on-chain format.
 *
 * The output is a hex string with the layout:
 * - 2 bytes: reserved prefix (0x0030)
 * - 4 bytes: verification method ID (0x8019f9b1, keccak256(bytes))
 * - 2 bytes: hash length (0x0020 = 32 bytes)
 * - 32 bytes: content verification hash
 * - variable: UTF-8 encoded JSON of entries array
 *
 * @param entries - Array of storage backend entries (minimum 2)
 * @param verificationHash - Pre-computed keccak256 hash of the content bytes (0x + 64 hex chars)
 * @returns Hex-encoded LSP30 URI value
 * @throws Error if entries fail validation or hash format is invalid
 *
 * @example
 * ```typescript
 * const entries = [
 *   { backend: 'ipfs', cid: 'QmTest...' },
 *   { backend: 's3', bucket: 'my-bucket', key: 'file.bin', region: 'us-east-1' },
 * ];
 * const hash = computeContentHash(contentBytes);
 * const encoded = encodeLsp30Uri(entries, hash);
 * ```
 */
export function encodeLsp30Uri(
	entries: Lsp30Entry[],
	verificationHash: Hex,
): Hex {
	// Validate entries (defense-in-depth — enforces min 2 + backend-specific fields)
	lsp30EntriesSchema.parse(entries);

	// Validate hash format: 0x + 64 hex chars = 66 chars total, all hex
	if (
		typeof verificationHash !== "string" ||
		!/^0x[0-9a-fA-F]{64}$/.test(verificationHash)
	) {
		throw new Error(
			`Invalid verification hash: expected 0x-prefixed 64-char hex string, got ${String(verificationHash).slice(0, 20)}...`,
		);
	}

	// Encode entries as UTF-8 JSON hex
	const entriesHex = stringToHex(JSON.stringify(entries));

	return concat([
		LSP30_RESERVED_PREFIX,
		KECCAK256_BYTES_METHOD_ID,
		HASH_LENGTH_PREFIX,
		verificationHash,
		entriesHex,
	]);
}
