/**
 * LSP17 Extension Key Utilities
 *
 * Functions for building and parsing LSP17 extension data keys.
 * These are LSP17-specific utilities that belong in the LSP6 package
 * (LSP6 Key Manager manages LSP17 extensions on Universal Profiles).
 *
 * General ERC725Y utilities (getData, encoding/decoding) are in @chillwhales/erc725.
 *
 * @see https://docs.lukso.tech/standards/generic-standards/lsp17-contract-extension
 */

import { concat, type Hex, padHex, slice } from "viem";

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
 * The selector occupies bytes 12-16 of the 32-byte key.
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
