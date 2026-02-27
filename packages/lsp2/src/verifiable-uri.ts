/**
 * LSP2 VerifiableURI Encoding/Decoding Utilities
 *
 * Pure functions for encoding and decoding VerifiableURI values according to
 * the LSP2 ERC725Y JSON Schema specification.
 *
 * @see https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md
 */

import {
	concat,
	type Hex,
	hexToString,
	keccak256,
	slice,
	stringToHex,
} from "viem";
import type { z } from "zod";
import {
	HASH_LENGTH_PREFIX,
	KECCAK256_BYTES_METHOD_ID,
	MIN_VERIFIABLE_URI_LENGTH,
	RESERVED_PREFIX,
} from "./constants";

/**
 * Parsed components of a VerifiableURI
 */
export interface ParsedVerifiableUri {
	/** Verification method ID (e.g., 0x6f357c6a for keccak256(bytes)) */
	verificationMethod: Hex;
	/** Verification hash (32 bytes) */
	verificationData: Hex;
	/** The URL pointing to the content (e.g., ipfs://Qm...) */
	url: string;
}

/**
 * Result of decoding a VerifiableURI
 */
export interface DecodedVerifiableUri<T> {
	/** The parsed and validated data */
	data: T;
	/** The URL extracted from the VerifiableURI */
	url: string;
}

/**
 * Encodes data as a VerifiableURI value
 *
 * Creates an ERC725Y-compatible VerifiableURI encoding with:
 * - 2 bytes reserved (0x0000)
 * - 4 bytes verification method ID (keccak256(bytes)) = 0x8019f9b1
 * - 2 bytes verification data length (0x0020 = 32)
 * - 32 bytes verification hash
 * - UTF-8 encoded URL
 *
 * @param data - Any JSON-serializable object to encode
 * @param ipfsUrl - IPFS URL where the JSON will be stored (e.g., "ipfs://Qm...")
 * @returns Hex-encoded VerifiableURI value
 *
 * @example
 * ```typescript
 * import { encodeVerifiableUri } from '@chillwhales/lsp2';
 *
 * const metadata = { LSP4Metadata: { name: 'My Token', description: 'A token' } };
 * const value = encodeVerifiableUri(metadata, 'ipfs://QmXyz...');
 * // Use with setData operation
 * ```
 */
export function encodeVerifiableUri<T>(data: T, ipfsUrl: string): Hex {
	const jsonString = JSON.stringify(data);
	const verificationHash = keccak256(stringToHex(jsonString));
	const urlHex = stringToHex(ipfsUrl);

	return concat([
		RESERVED_PREFIX,
		KECCAK256_BYTES_METHOD_ID,
		HASH_LENGTH_PREFIX,
		verificationHash,
		urlHex,
	]);
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parses a VerifiableURI hex value into its components
 *
 * Format: 0x + reserved (2 bytes) + method (4 bytes) + length (2 bytes) + hash (N bytes) + url
 *
 * @param value - The raw hex value from ERC725Y getData
 * @returns Parsed components (method, hash, url)
 * @throws Error if the value is malformed
 *
 * @example
 * ```typescript
 * import { parseVerifiableUri } from '@chillwhales/lsp2';
 *
 * const { verificationMethod, verificationData, url } = parseVerifiableUri(rawValue);
 * console.log(url); // 'ipfs://Qm...'
 * ```
 */
export function parseVerifiableUri(value: Hex): ParsedVerifiableUri {
	if (value.length < MIN_VERIFIABLE_URI_LENGTH) {
		throw new Error(
			`Invalid VerifiableURI: value too short (${value.length} chars, minimum ${MIN_VERIFIABLE_URI_LENGTH})`,
		);
	}

	const reservedPrefix = slice(value, 0, 2);
	if (reservedPrefix !== RESERVED_PREFIX) {
		throw new Error(
			`Invalid VerifiableURI: expected reserved prefix ${RESERVED_PREFIX}, got ${reservedPrefix}`,
		);
	}

	const verificationMethod = slice(value, 2, 6);

	const hashLengthHex = slice(value, 6, 8);
	const hashLength = parseInt(hashLengthHex.slice(2), 16);

	const verificationData = slice(value, 8, 8 + hashLength);

	const urlHex = slice(value, 8 + hashLength);
	const url = hexToString(urlHex);

	return {
		verificationMethod,
		verificationData,
		url,
	};
}

// ============================================================================
// Decoding Functions
// ============================================================================

/**
 * Decodes a VerifiableURI value and validates the content
 *
 * @param verifiableUriValue - The raw hex value from ERC725Y getData
 * @param jsonContent - The JSON content fetched from the URL
 * @param schema - Optional Zod schema for type validation
 * @returns Decoded data and URL
 * @throws Error if hash doesn't match or schema validation fails
 *
 * @example
 * ```typescript
 * import { decodeVerifiableUri } from '@chillwhales/lsp2';
 *
 * // Fetch JSON from IPFS first
 * const jsonContent = await fetchFromIpfs(url);
 *
 * // Decode with schema validation
 * const { data, url } = decodeVerifiableUri(
 *   rawValue,
 *   jsonContent,
 *   mySchema
 * );
 *
 * // Decode without schema (caller handles typing)
 * const { data: rawData } = decodeVerifiableUri<MyType>(rawValue, jsonContent);
 * ```
 */
export function decodeVerifiableUri<T>(
	verifiableUriValue: Hex,
	jsonContent: string,
	schema?: z.ZodSchema<T>,
): DecodedVerifiableUri<T> {
	// 1. Parse the VerifiableURI to get components
	const { verificationMethod, verificationData, url } =
		parseVerifiableUri(verifiableUriValue);

	// 2. Verify the verification method is supported
	if (verificationMethod !== KECCAK256_BYTES_METHOD_ID) {
		throw new Error(
			`Unsupported verification method: ${verificationMethod}. Expected ${KECCAK256_BYTES_METHOD_ID} (keccak256(bytes))`,
		);
	}

	// 3. Compute hash of the provided JSON content
	const computedHash = keccak256(stringToHex(jsonContent));

	// 4. Verify hash matches
	if (computedHash.toLowerCase() !== verificationData.toLowerCase()) {
		throw new Error(
			`VerifiableURI hash mismatch: content hash ${computedHash} does not match verification data ${verificationData}`,
		);
	}

	// 5. Parse JSON
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonContent);
	} catch {
		throw new Error("Invalid JSON content");
	}

	// 6. Validate against schema if provided
	if (schema) {
		const result = schema.safeParse(parsed);
		if (!result.success) {
			throw new Error(`Schema validation failed: ${result.error.message}`);
		}
		return { data: result.data, url };
	}

	// 7. Return untyped (caller's responsibility to ensure type safety)
	return { data: parsed as T, url };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Computes the verification hash for JSON data
 *
 * Useful when you need to compute the hash without encoding the full VerifiableURI.
 *
 * @param data - Any JSON-serializable object
 * @returns The keccak256 hash as a Hex string
 *
 * @example
 * ```typescript
 * import { computeVerificationHash } from '@chillwhales/lsp2';
 *
 * const hash = computeVerificationHash({ name: 'My Profile' });
 * // Use for verification or comparison
 * ```
 */
export function computeVerificationHash<T>(data: T): Hex {
	const jsonString = JSON.stringify(data);
	return keccak256(stringToHex(jsonString));
}

/**
 * Checks if a hex value appears to be a valid VerifiableURI format
 *
 * This is a quick check based on structure, not content validation.
 *
 * @param value - Hex value to check
 * @returns true if the value has valid VerifiableURI structure
 *
 * @example
 * ```typescript
 * import { isVerifiableUri } from '@chillwhales/lsp2';
 *
 * if (isVerifiableUri(rawValue)) {
 *   const { url } = parseVerifiableUri(rawValue);
 * }
 * ```
 */
export function isVerifiableUri(value: Hex): boolean {
	if (value.length < MIN_VERIFIABLE_URI_LENGTH) {
		return false;
	}

	try {
		const reservedPrefix = slice(value, 0, 2);
		return reservedPrefix === RESERVED_PREFIX;
	} catch {
		return false;
	}
}
