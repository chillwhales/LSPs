/**
 * Blockchain Utilities
 *
 * Pure functions for encoding and decoding blockchain data types.
 * Used for ERC725Y array lengths, mapping indices, and other uint128 values.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp2-json-schema
 */

import { type Hex, hexToBigInt, toHex } from "viem";

/**
 * Parse a uint128 value from hex
 *
 * Used for reading ERC725Y array lengths and mapping indices which are
 * stored as uint128 (16 bytes).
 *
 * @param value - Hex-encoded uint128
 * @returns Parsed bigint
 *
 * @example
 * ```typescript
 * const length = parseUint128('0x00000000000000000000000000000005');
 * // 5n
 * ```
 */
export function parseUint128(value: Hex): bigint {
	if (!value || value === "0x" || value === "0x0") return BigInt(0);
	return hexToBigInt(value);
}

/**
 * Encode a number as uint128 hex
 *
 * Used for encoding ERC725Y array lengths and mapping indices which are
 * stored as uint128 (16 bytes).
 *
 * @param value - Number to encode
 * @returns Hex-encoded uint128 (16 bytes)
 *
 * @example
 * ```typescript
 * const encoded = encodeUint128(5);
 * // '0x00000000000000000000000000000005'
 * ```
 */
export function encodeUint128(value: number | bigint | string): Hex {
	return toHex(BigInt(value), { size: 16 });
}
