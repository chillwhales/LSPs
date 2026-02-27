/**
 * LSP30 Multi-Storage URI Decoding
 *
 * Parses and verifies LSP30 on-chain hex values back into structured data.
 * Mirrors the LSP2 parseVerifiableUri/decodeVerifiableUri pattern.
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

import { type Hex, hexToString, keccak256, slice } from "viem";

import {
	KECCAK256_BYTES_METHOD_ID,
	LSP30_RESERVED_PREFIX,
	MIN_LSP30_URI_LENGTH,
} from "./constants";
import { lsp30EntriesSchema } from "./schemas";
import type { Lsp30Entry, ParsedLsp30Uri } from "./types";

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parses an LSP30 Multi-Storage URI hex value into its components.
 *
 * Format: 0x + reserved (2 bytes) + method (4 bytes) + length (2 bytes) + hash (N bytes) + entries JSON
 *
 * @param value - The raw hex value from ERC725Y getData
 * @returns Parsed components (verificationMethod, verificationData, entries)
 * @throws Error if the value is malformed, wrong prefix, or invalid JSON
 *
 * @example
 * ```typescript
 * const { verificationMethod, verificationData, entries } = parseLsp30Uri(rawValue);
 * entries.forEach(entry => console.log(entry.backend));
 * ```
 */
export function parseLsp30Uri(value: Hex): ParsedLsp30Uri {
	// Check minimum length
	if (value.length < MIN_LSP30_URI_LENGTH) {
		throw new Error(
			`Invalid LSP30 URI: value too short (${value.length} chars, minimum ${MIN_LSP30_URI_LENGTH})`,
		);
	}

	// Validate reserved prefix at bytes 0-1
	const reservedPrefix = slice(value, 0, 2);
	if (reservedPrefix !== LSP30_RESERVED_PREFIX) {
		throw new Error(
			`Invalid LSP30 URI: expected prefix ${LSP30_RESERVED_PREFIX}, got ${reservedPrefix}`,
		);
	}

	// Extract verification method at bytes 2-5
	const verificationMethod = slice(value, 2, 6);

	// Extract hash length at bytes 6-7
	const hashLengthHex = slice(value, 6, 8);
	const hashLength = parseInt(hashLengthHex.slice(2), 16);

	// Extract verification data (hash) at bytes 8 to 8+hashLength
	const verificationData = slice(value, 8, 8 + hashLength);

	// Extract remaining bytes → entries JSON
	const entriesHex = slice(value, 8 + hashLength);
	let entries: Lsp30Entry[];

	try {
		const entriesJson = hexToString(entriesHex);
		entries = JSON.parse(entriesJson);
	} catch {
		throw new Error("Invalid LSP30 URI: entries portion contains invalid JSON");
	}

	return {
		verificationMethod,
		verificationData,
		entries,
	};
}

// ============================================================================
// Decoding Functions
// ============================================================================

/**
 * Decodes and verifies an LSP30 Multi-Storage URI against its content bytes.
 *
 * 1. Parses the URI structure
 * 2. Verifies the verification method is keccak256(bytes)
 * 3. Computes keccak256 of the provided content and checks against the embedded hash
 * 4. Validates entries through Zod schema
 *
 * @param value - The raw hex value from ERC725Y getData
 * @param content - The actual content bytes (used to verify the hash)
 * @returns Validated entries and verification data
 * @throws Error if hash doesn't match, method is unsupported, or entries are invalid
 *
 * @example
 * ```typescript
 * const contentBytes = await fetchFromBackend(entry);
 * const { entries, verificationData } = decodeLsp30Uri(rawValue, contentBytes);
 * ```
 */
export function decodeLsp30Uri(
	value: Hex,
	content: Uint8Array,
): { entries: Lsp30Entry[]; verificationData: Hex } {
	// 1. Parse the URI structure
	const parsed = parseLsp30Uri(value);

	// 2. Verify verification method
	if (parsed.verificationMethod !== KECCAK256_BYTES_METHOD_ID) {
		throw new Error(
			`Unsupported verification method: ${parsed.verificationMethod}. Expected ${KECCAK256_BYTES_METHOD_ID} (keccak256(bytes))`,
		);
	}

	// 3. Compute hash of provided content and verify
	const computedHash = keccak256(content);
	if (computedHash.toLowerCase() !== parsed.verificationData.toLowerCase()) {
		throw new Error(
			`LSP30 hash mismatch: content hash ${computedHash} does not match verification data ${parsed.verificationData}`,
		);
	}

	// 4. Validate entries through Zod schema
	const validatedEntries = lsp30EntriesSchema.parse(parsed.entries);

	return {
		entries: validatedEntries,
		verificationData: parsed.verificationData,
	};
}
