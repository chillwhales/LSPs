/**
 * LSP31 Multi-Storage URI Type Guards
 *
 * Quick structural checks for identifying LSP31 encoded values.
 *
 * @see LSP-31-MultiStorageURI.md for full specification
 */

import { type Hex, slice } from "viem";

import { LSP31_RESERVED_PREFIX, MIN_LSP31_URI_LENGTH } from "./constants";

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a hex value appears to be a valid LSP31 Multi-Storage URI format.
 *
 * This is a quick structural check based on length and prefix, not full content validation.
 * Distinguishes LSP31 (0x0031 prefix) from LSP2 VerifiableURI (0x0000 prefix).
 *
 * @param value - Hex value to check
 * @returns true if the value has valid LSP31 structure
 *
 * @example
 * ```typescript
 * if (isLsp31Uri(rawValue)) {
 *   const { entries } = parseLsp31Uri(rawValue);
 * } else if (isVerifiableUri(rawValue)) {
 *   const { url } = parseVerifiableUri(rawValue);
 * }
 * ```
 */
export function isLsp31Uri(value: Hex): boolean {
	if (value.length < MIN_LSP31_URI_LENGTH) {
		return false;
	}

	try {
		const reservedPrefix = slice(value, 0, 2);
		return reservedPrefix === LSP31_RESERVED_PREFIX;
	} catch {
		return false;
	}
}
