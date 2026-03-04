/**
 * Blockchain Utilities
 *
 * Pure functions for encoding and decoding blockchain data types.
 * Used for ERC725Y array lengths, mapping indices, and other uint128 values.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp2-json-schema
 */

import { type Hex, hexToBigInt, toHex } from "viem";

/** Maximum value for a uint128: 2^128 - 1 */
const UINT128_MAX = 2n ** 128n - 1n;

/**
 * Parse a uint128 value from hex
 *
 * Used for reading ERC725Y array lengths and mapping indices which are
 * stored as uint128 (16 bytes).
 *
 * @param value - Hex-encoded uint128
 * @returns Parsed bigint
 * @throws {RangeError} If the parsed value exceeds uint128 max (2^128 - 1)
 *
 * @example
 * ```typescript
 * const length = parseUint128('0x00000000000000000000000000000005');
 * // 5n
 * ```
 */
export function parseUint128(value: Hex): bigint {
	if (!value || value === "0x" || value === "0x0") return BigInt(0);
	const result = hexToBigInt(value);
	if (result > UINT128_MAX) {
		throw new RangeError(
			`Value ${result} exceeds uint128 max (${UINT128_MAX})`,
		);
	}
	return result;
}

/**
 * Encode a number as uint128 hex
 *
 * Used for encoding ERC725Y array lengths and mapping indices which are
 * stored as uint128 (16 bytes).
 *
 * @param value - Number to encode (must be non-negative and fit in uint128)
 * @returns Hex-encoded uint128 (16 bytes)
 * @throws {RangeError} If the value is negative or exceeds uint128 max (2^128 - 1)
 *
 * @example
 * ```typescript
 * const encoded = encodeUint128(5);
 * // '0x00000000000000000000000000000005'
 * ```
 */
export function encodeUint128(value: number | bigint | string): Hex {
	const bigValue = BigInt(value);
	if (bigValue < 0n) {
		throw new RangeError("Value must be non-negative for uint128 encoding");
	}
	if (bigValue > UINT128_MAX) {
		throw new RangeError(
			`Value ${bigValue} exceeds uint128 max (${UINT128_MAX})`,
		);
	}
	return toHex(bigValue, { size: 16 });
}
