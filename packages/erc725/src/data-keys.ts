/**
 * ERC725Y Data Key Utilities
 *
 * Pure functions for building and parsing ERC725Y storage keys.
 * Implements the key derivation patterns from LSP2 ERC725Y JSON Schema.
 *
 * Key types:
 * - Singleton: keccak256(keyName) — 32 bytes
 * - Array: keccak256(keyName) for length, first16bytes + uint128(index) for elements
 * - Mapping: first10bytes(keccak256(keyName)) + 0000 + address/hash(20 bytes)
 * - MappingWithGrouping: first6bytes + first4bytes(group) + 0000 + address/hash(20 bytes)
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp2-json-schema
 */

import type { Hex } from "viem";
import { concat, keccak256, slice, stringToHex, toHex } from "viem";

/**
 * Compute a Singleton data key from a key name.
 * Result: keccak256(keyName) — full 32 bytes.
 */
export function computeSingletonKey(keyName: string): Hex {
	return keccak256(stringToHex(keyName));
}

/**
 * Compute an Array data key (the length key) from a key name.
 * Result: keccak256(keyName) — same as singleton.
 * The first 16 bytes serve as the key prefix for element keys.
 */
export function computeArrayKey(keyName: string): Hex {
	return keccak256(stringToHex(keyName));
}

/**
 * Compute an Array element key for a given index.
 * Result: first16bytes(keccak256(keyName)) + uint128(index)
 *
 * @param keyName - The array key name (e.g., "LSP5ReceivedAssets[]")
 * @param index - The array index (0-based)
 */
export function computeArrayElementKey(
	keyName: string,
	index: number | bigint,
): Hex {
	const arrayKey = computeArrayKey(keyName);
	const prefix = slice(arrayKey, 0, 16);
	const indexHex = toHex(BigInt(index), { size: 16 });
	return concat([prefix, indexHex]);
}

/**
 * Compute a Mapping data key.
 * Result: first10bytes(keccak256(keyName)) + 0000 + mapKey
 *
 * If mapKey is 20 bytes (an address), it's used directly.
 * Otherwise, the first 20 bytes of keccak256(mapKey) are used.
 *
 * @param keyName - The mapping key name (e.g., "LSP5ReceivedAssetsMap")
 * @param mapKey - The mapping key (address or string to hash)
 */
export function computeMappingKey(keyName: string, mapKey: Hex | string): Hex {
	const firstPart = slice(keccak256(stringToHex(keyName)), 0, 10);
	const padding = "0x0000" as Hex;
	// If mapKey is 20 bytes (address: 0x + 40 hex chars = 42 chars), use directly
	const secondPart =
		mapKey.length === 42
			? (mapKey as Hex)
			: slice(
					keccak256(typeof mapKey === "string" ? stringToHex(mapKey) : mapKey),
					0,
					20,
				);
	return concat([firstPart, padding, secondPart]);
}

/**
 * Compute a MappingWithGrouping data key.
 * Result: first6bytes(keccak256(keyName)) + first4bytes(keccak256(firstPart)) + 0000 + lastPart
 *
 * If lastPart is 20 bytes (an address), it's used directly.
 * Otherwise, the first 20 bytes of keccak256(lastPart) are used.
 *
 * @param keyName - The mapping key name
 * @param firstPart - The group identifier
 * @param lastPart - The final key part (address or string to hash)
 */
export function computeMappingWithGroupingKey(
	keyName: string,
	firstPart: string,
	lastPart: Hex | string,
): Hex {
	const keyPrefix = slice(keccak256(stringToHex(keyName)), 0, 6);
	const groupHash = slice(keccak256(stringToHex(firstPart)), 0, 4);
	const padding = "0x0000" as Hex;
	const lastPartHex =
		lastPart.length === 42
			? (lastPart as Hex)
			: slice(
					keccak256(
						typeof lastPart === "string" ? stringToHex(lastPart) : lastPart,
					),
					0,
					20,
				);
	return concat([keyPrefix, groupHash, padding, lastPartHex]);
}

/**
 * Extract the array key prefix (first 16 bytes) from a full data key.
 * Used to match array element keys against their parent array.
 */
export function extractArrayPrefix(dataKey: Hex): Hex {
	return slice(dataKey, 0, 16);
}

/**
 * Extract the element index from an Array element key.
 * Returns the uint128 index stored in the last 16 bytes.
 */
export function extractArrayIndex(elementKey: Hex): bigint {
	const indexHex = slice(elementKey, 16, 32);
	return BigInt(indexHex);
}
