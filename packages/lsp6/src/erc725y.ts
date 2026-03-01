/**
 * ERC725Y / LSP17 Read Utilities
 *
 * Functions for building LSP17 extension data keys, reading ERC725Y data
 * from contracts, and hex comparison helpers.
 *
 * Extracted from chillwhales/marketplace — only genuinely new functions
 * that don't overlap with existing key-builders.ts / parsers.ts.
 *
 * @see https://docs.lukso.tech/standards/generic-standards/lsp17-contract-extension
 */

import { type Address, concat, type Hex, padHex, slice } from "viem";

/**
 * Well-known LSP17 extension data key prefix (12 bytes).
 *
 * Defined in LSP17 spec — key format is:
 *   `LSP17ExtensionPrefix (12 bytes) + functionSelector (4 bytes) + padding (16 bytes)`
 *
 * @see https://docs.lukso.tech/standards/generic-standards/lsp17-contract-extension#lsp17extension-data-key
 */
const LSP17_EXTENSION_PREFIX =
	"0xcee78b4094da860110960000" as const satisfies Hex;

/**
 * Build the LSP17 extension data key for a function selector.
 *
 * Produces a 32-byte ERC725Y data key by concatenating the LSP17 prefix
 * with the 4-byte selector, right-padded to 32 bytes.
 *
 * @param selector - The 4-byte function selector (e.g., `0x8b159099`)
 * @returns The 32-byte LSP17 extension data key
 *
 * @example
 * ```typescript
 * const key = buildLsp17ExtensionKey("0x8b159099");
 * // "0xcee78b4094da8601109600008b15909900000000000000000000000000000000"
 * ```
 */
export function buildLsp17ExtensionKey(selector: Hex): Hex {
	return padHex(concat([LSP17_EXTENSION_PREFIX, selector]), {
		size: 32,
		dir: "right",
	});
}

/**
 * Extract the 4-byte function selector from an LSP17 extension data key.
 *
 * The selector occupies bytes 12–16 of the 32-byte key.
 *
 * @param key - A 32-byte LSP17 extension data key
 * @returns The 4-byte function selector
 *
 * @example
 * ```typescript
 * const selector = extractSelectorFromLsp17ExtensionKey(
 *   "0xcee78b4094da8601109600008b15909900000000000000000000000000000000"
 * );
 * // "0x8b159099"
 * ```
 */
export function extractSelectorFromLsp17ExtensionKey(key: Hex): Hex {
	return slice(key, 12, 16);
}

/**
 * Filter an array of ERC725Y data keys to only those with the LSP17 extension prefix.
 *
 * @param dataKeys - Array of 32-byte data keys
 * @returns Only the keys that start with the LSP17 extension prefix
 *
 * @example
 * ```typescript
 * const allKeys = ["0xcee78b40...", "0x4b80742d...", "0xcee78b40..."];
 * const lsp17Keys = extractLsp17ExtensionKeys(allKeys);
 * // Returns only keys starting with LSP17 prefix
 * ```
 */
export function extractLsp17ExtensionKeys(dataKeys: Hex[]): Hex[] {
	return dataKeys.filter((dataKey) =>
		dataKey.startsWith(LSP17_EXTENSION_PREFIX),
	);
}

/**
 * Case-insensitive hex string comparison.
 *
 * @param a - First hex value
 * @param b - Second hex value
 * @returns `true` if the hex values are equal (case-insensitive)
 *
 * @example
 * ```typescript
 * isHexEqual("0xAbC", "0xabc"); // true
 * isHexEqual("0x1234", "0x5678"); // false
 * ```
 */
export function isHexEqual(a: Hex, b: Hex): boolean {
	return a.toLowerCase() === b.toLowerCase();
}

/**
 * Read ERC725Y data from a contract.
 *
 * Supports both single key and batch key reads. Uses the Universal Profile ABI
 * which includes the ERC725Y `getData` / `getDataBatch` functions.
 *
 * @param client - Viem PublicClient instance
 * @param contractAddress - The ERC725Y contract address
 * @param dataKey - Single data key to read
 * @returns The data value (empty `"0x"` if not set)
 * @throws If the contract read fails
 *
 * @example
 * ```typescript
 * // Single key read
 * const value = await getData(client, "0x1234...", "0xabcd...");
 *
 * // Batch read
 * const values = await getData(client, "0x1234...", ["0xabcd...", "0xefgh..."]);
 * ```
 */
export async function getData(
	client: {
		readContract: (args: {
			address: Address;
			abi: readonly Record<string, unknown>[];
			functionName: string;
			args: readonly unknown[];
		}) => Promise<unknown>;
	},
	contractAddress: Address,
	dataKey: Hex,
): Promise<Hex>;
export async function getData(
	client: {
		readContract: (args: {
			address: Address;
			abi: readonly Record<string, unknown>[];
			functionName: string;
			args: readonly unknown[];
		}) => Promise<unknown>;
	},
	contractAddress: Address,
	dataKeys: Hex[],
): Promise<Hex[]>;
export async function getData(
	client: {
		readContract: (args: {
			address: Address;
			abi: readonly Record<string, unknown>[];
			functionName: string;
			args: readonly unknown[];
		}) => Promise<unknown>;
	},
	contractAddress: Address,
	dataKeyOrKeys: Hex | Hex[],
): Promise<Hex | Hex[]> {
	/** Minimal ERC725Y ABI for getData/getDataBatch */
	const erc725yAbi = [
		{
			type: "function",
			name: "getData",
			inputs: [{ type: "bytes32", name: "dataKey" }],
			outputs: [{ type: "bytes", name: "" }],
			stateMutability: "view",
		},
		{
			type: "function",
			name: "getDataBatch",
			inputs: [{ type: "bytes32[]", name: "dataKeys" }],
			outputs: [{ type: "bytes[]", name: "" }],
			stateMutability: "view",
		},
	] as const;

	try {
		if (Array.isArray(dataKeyOrKeys)) {
			if (dataKeyOrKeys.length === 0) return [];

			const result = await client.readContract({
				address: contractAddress,
				abi: erc725yAbi,
				functionName: "getDataBatch",
				args: [dataKeyOrKeys],
			});

			return [...(result as Hex[])];
		}

		const result = await client.readContract({
			address: contractAddress,
			abi: erc725yAbi,
			functionName: "getData",
			args: [dataKeyOrKeys],
		});

		return result as Hex;
	} catch (error) {
		const keyInfo = Array.isArray(dataKeyOrKeys)
			? `${dataKeyOrKeys.length} data keys`
			: `data key ${dataKeyOrKeys}`;
		throw new Error(
			`Failed to read ${keyInfo}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
