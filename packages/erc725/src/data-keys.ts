/**
 * ERC725Y Data Key Utilities
 *
 * Wraps `@erc725/erc725.js` for key name ↔ data key mapping, data encoding/decoding,
 * and provides additional array-key helpers not available in erc725.js.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp2-json-schema
 */

import ERC725, {
	type ERC725JSONSchema,
	encodeArrayKey as erc725EncodeArrayKey,
	getSchema as erc725GetSchema,
} from "@erc725/erc725.js";
import type { Hex } from "viem";
import { slice } from "viem";

/** A decoded dynamic part from a Mapping or MappingWithGrouping key */
export interface DynamicKeyPart {
	type: string;
	value: string | boolean | number;
}

// ============================================================================
// Key Name ↔ Data Key Mapping (delegated to erc725.js)
// ============================================================================

/**
 * Encode a human-readable key name into a 32-byte ERC725Y data key.
 *
 * Supports all LSP2 key types:
 * - Singleton: `"LSP3Profile"` → keccak256(name)
 * - Array: `"LSP5ReceivedAssets[]"` → keccak256(name)
 * - Mapping: `"LSP5ReceivedAssetsMap:<address>"` → first10(keccak256(name)) + 0000 + address
 * - MappingWithGrouping: `"AddressPermissions:Permissions:<address>"` → first6 + first4 + 0000 + address
 *
 * @param keyName - Human-readable key name following LSP2 notation
 * @param dynamicKeyParts - Dynamic parts for Mapping/MappingWithGrouping keys (addresses, etc.)
 * @returns The 32-byte data key as a hex string
 *
 * @example
 * ```typescript
 * // Singleton key
 * encodeKeyName("LSP3Profile");
 * // "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5"
 *
 * // Mapping key with address
 * encodeKeyName(
 *   "LSP5ReceivedAssetsMap:<address>",
 *   ["0x1234567890abcdef1234567890abcdef12345678"]
 * );
 *
 * // Array element key
 * encodeKeyName("LSP5ReceivedAssets[]", [5]);
 * ```
 */
export function encodeKeyName(
	keyName: string,
	dynamicKeyParts?: Array<string | number>,
): Hex {
	return ERC725.encodeKeyName(keyName, dynamicKeyParts) as Hex;
}

/**
 * Encode an Array element key from the array length key and an index.
 *
 * Takes the 32-byte array length key (from `encodeKeyName("ArrayName[]")`)
 * and produces the element key: `first16bytes(arrayKey) + uint128(index)`.
 *
 * @param arrayKey - The 32-byte array length key (keccak256 of the array name)
 * @param index - The 0-based element index
 * @returns The 32-byte array element key
 *
 * @example
 * ```typescript
 * const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
 * const element0 = encodeArrayElementKey(arrayKey, 0);
 * const element5 = encodeArrayElementKey(arrayKey, 5);
 * ```
 */
export function encodeArrayElementKey(arrayKey: string, index: number): Hex {
	return erc725EncodeArrayKey(arrayKey, index) as Hex;
}

/**
 * Decode a hashed Mapping or MappingWithGrouping data key back to its dynamic parts.
 *
 * @param keyHash - The 32-byte hashed data key
 * @param keyNameOrSchema - The key name template or full ERC725 JSON schema
 * @returns Array of decoded dynamic key parts with their types and values
 *
 * @example
 * ```typescript
 * const parts = decodeMappingKey(
 *   "0x6de85eaf5d982b4e5da00000cafecafecafecafecafecafecafecafecafecafe",
 *   "LSP5ReceivedAssetsMap:<address>"
 * );
 * // [{ type: "address", value: "0xcAfEcAfECAfECaFeCaFecaFecaFECafECafeCaFe" }]
 * ```
 */
export function decodeMappingKey(
	keyHash: string,
	keyNameOrSchema: string | ERC725JSONSchema,
): DynamicKeyPart[] {
	return ERC725.decodeMappingKey(keyHash, keyNameOrSchema);
}

// ============================================================================
// Data Encoding / Decoding (delegated to erc725.js)
// ============================================================================

/**
 * Encode structured data into ERC725Y key-value pairs.
 *
 * Takes human-readable data with schema definitions and produces
 * hashed keys and ABI-encoded values ready for `setData` / `setDataBatch`.
 *
 * @param data - Array of data items to encode, each with keyName, value, and optional dynamicKeyParts
 * @param schemas - ERC725 JSON schemas (if not provided to constructor)
 * @returns Object with `keys` (hex[]) and `values` (hex[]) arrays
 *
 * @example
 * ```typescript
 * import LSP6Schemas from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
 *
 * const encoded = encodeData(
 *   [
 *     {
 *       keyName: "AddressPermissions:Permissions:<address>",
 *       dynamicKeyParts: ["0x1234..."],
 *       value: encodePermissions({ CALL: true, SETDATA: true }),
 *     },
 *   ],
 *   LSP6Schemas,
 * );
 * // { keys: ["0x4b80742d..."], values: ["0x0000...0018"] }
 * ```
 */
export function encodeData(
	data: Array<{
		keyName: string;
		value: unknown;
		dynamicKeyParts?: string | string[];
		totalArrayLength?: number;
		startingIndex?: number;
	}>,
	schemas: ERC725JSONSchema[],
): { keys: string[]; values: string[] } {
	return ERC725.encodeData(
		data as Parameters<typeof ERC725.encodeData>[0],
		schemas,
	);
}

/**
 * Decode raw ERC725Y key-value pairs into human-readable data.
 *
 * @param data - Array of raw key-value pairs to decode
 * @param schemas - ERC725 JSON schemas
 * @returns Array of decoded data items with keyName, key, and value
 *
 * @example
 * ```typescript
 * const decoded = decodeData(
 *   [{ keyName: "LSP3Profile", value: "0x6f357c6a..." }],
 *   LSP3Schemas,
 * );
 * // [{ name: "LSP3Profile", key: "0x5ef8...", value: { url: "ipfs://...", hash: "0x..." } }]
 * ```
 */
/** Decoded data output from ERC725Y */
export interface DecodeDataOutput {
	value:
		| string
		| bigint
		| boolean
		| null
		| Array<string | bigint | boolean | null>
		| { url: string; hash: string }
		| null;
	name: string;
	key: string;
	dynamicName?: string;
}

export function decodeData(
	data: Array<{
		keyName: string;
		value: unknown;
		dynamicKeyParts?: string | string[];
	}>,
	schemas: ERC725JSONSchema[],
): DecodeDataOutput[] {
	return ERC725.decodeData(
		data as Parameters<typeof ERC725.decodeData>[0],
		schemas,
	) as DecodeDataOutput[];
}

// ============================================================================
// Permissions (delegated to erc725.js)
// ============================================================================

/**
 * Encode a permission object into a bytes32 hex value.
 *
 * @param permissions - Object mapping permission names to boolean values
 * @returns The encoded permissions as a 32-byte hex string
 *
 * @example
 * ```typescript
 * const encoded = encodePermissions({
 *   CALL: true,
 *   SETDATA: true,
 *   SUPER_TRANSFERVALUE: true,
 * });
 * // "0x0000000000000000000000000000000000000000000000000000000000040818"
 * ```
 */
export function encodePermissions(permissions: Record<string, boolean>): Hex {
	return ERC725.encodePermissions(permissions) as Hex;
}

/**
 * Decode a bytes32 permissions value into a human-readable object.
 *
 * @param permissionHex - The 32-byte permissions hex value
 * @returns Object mapping permission names to boolean values
 *
 * @example
 * ```typescript
 * const perms = decodePermissions("0x0000...0018");
 * // { CHANGEOWNER: false, CALL: true, SETDATA: true, ... }
 * ```
 */
export function decodePermissions(
	permissionHex: string,
): Record<string, boolean> {
	return ERC725.decodePermissions(permissionHex);
}

/**
 * Check if required permissions are included in granted permissions.
 *
 * @param requiredPermissions - The permissions that must be present
 * @param grantedPermissions - The permissions that are currently granted
 * @returns `true` if all required permissions are included in granted
 *
 * @example
 * ```typescript
 * checkPermissions(
 *   encodePermissions({ CALL: true }),
 *   encodePermissions({ CALL: true, SETDATA: true }),
 * ); // true
 * ```
 */
export function checkPermissions(
	requiredPermissions: string,
	grantedPermissions: string,
): boolean {
	return ERC725.checkPermissions(requiredPermissions, grantedPermissions);
}

// ============================================================================
// Value Encoding / Decoding (delegated to erc725.js)
// ============================================================================

/**
 * Encode a value by its ABI type.
 *
 * @param type - ABI type (e.g., "uint256", "address", "bytes32", "bool")
 * @param value - The value to encode
 * @returns ABI-encoded hex string
 *
 * @example
 * ```typescript
 * encodeValueType("uint256", 42);
 * // "0x000000000000000000000000000000000000000000000000000000000000002a"
 * ```
 */
export function encodeValueType(type: string, value: unknown): string {
	return ERC725.encodeValueType(type, value);
}

/**
 * Decode a value by its ABI type.
 *
 * @param type - ABI type (e.g., "uint256", "address", "bytes32", "bool")
 * @param data - The hex-encoded data to decode
 * @returns The decoded value
 *
 * @example
 * ```typescript
 * decodeValueType("uint256", "0x000...002a");
 * // 42n
 * ```
 */
export function decodeValueType(type: string, data: string): unknown {
	return ERC725.decodeValueType(type, data);
}

// ============================================================================
// Schema Lookup (delegated to erc725.js)
// ============================================================================

/**
 * Find the matching schema for a given data key.
 *
 * @param key - Hashed data key or key name
 * @param schemas - Array of ERC725 JSON schemas to search
 * @returns The matching schema, or null if not found
 */
export function getSchema(
	key: string,
	schemas: ERC725JSONSchema[],
): ERC725JSONSchema | null {
	return erc725GetSchema(key, schemas);
}

// ============================================================================
// Array Key Utilities (unique — not available in erc725.js)
// ============================================================================

/**
 * Extract the array key prefix (first 16 bytes) from a full data key.
 *
 * Used to match array element keys against their parent array.
 * This utility is not available in erc725.js.
 *
 * @param dataKey - A 32-byte ERC725Y data key
 * @returns The first 16 bytes (array prefix)
 *
 * @example
 * ```typescript
 * const prefix = extractArrayPrefix("0x6460ee3c0aac563ccbf76d6e1d07bada...");
 * // "0x6460ee3c0aac563ccbf76d6e1d07bada"
 * ```
 */
export function extractArrayPrefix(dataKey: Hex): Hex {
	return slice(dataKey, 0, 16);
}

/**
 * Extract the element index from an Array element key.
 *
 * Returns the uint128 index stored in the last 16 bytes.
 * This utility is not available in erc725.js.
 *
 * @param elementKey - A 32-byte array element data key
 * @returns The element index as a bigint
 *
 * @example
 * ```typescript
 * const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
 * const element = encodeArrayElementKey(arrayKey, 5);
 * const index = extractArrayIndex(element); // 5n
 * ```
 */
export function extractArrayIndex(elementKey: Hex): bigint {
	const indexHex = slice(elementKey, 16, 32);
	return BigInt(indexHex);
}

// ============================================================================
// Re-exports from erc725.js
// ============================================================================

export type { ERC725JSONSchema } from "@erc725/erc725.js";
/** The ERC725 class for advanced usage (instance methods, provider-based reads) */
export { default as ERC725 } from "@erc725/erc725.js";
