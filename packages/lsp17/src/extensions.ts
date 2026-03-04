/**
 * LSP17 Extension Key Utilities
 *
 * Functions for building and parsing LSP17 extension data keys.
 *
 * @see https://docs.lukso.tech/standards/generic-standards/lsp17-contract-extension
 */

import ERC725 from "@erc725/erc725.js";
import { LSP17DataKeys } from "@lukso/lsp17contractextension-contracts";

/**
 * ERC725Y key name for LSP17 extension mapping keys.
 *
 * Used with `ERC725.encodeKeyName` / `ERC725.decodeMappingKey`.
 */
const LSP17_KEY_NAME = "LSP17Extension:<bytes4>";

/**
 * Build the LSP17 extension data key for a function selector.
 *
 * Produces a 32-byte ERC725Y data key by encoding the LSP17 mapping key
 * with the given selector via `ERC725.encodeKeyName`.
 *
 * @param selector - The 4-byte function selector (e.g., `0x8b159099`)
 * @returns The 32-byte LSP17 extension data key
 *
 * @example
 * ```typescript
 * const key = buildExtensionKey("0x8b159099");
 * // "0xcee78b4094da8601109600008b15909900000000000000000000000000000000"
 * ```
 */
export function buildExtensionKey(selector: string): string {
	return ERC725.encodeKeyName(LSP17_KEY_NAME, selector);
}

/**
 * Extract the 4-byte function selector from an LSP17 extension data key.
 *
 * Decodes the mapping key via `ERC725.decodeMappingKey` to recover the
 * original selector.
 *
 * @param key - A 32-byte LSP17 extension data key
 * @returns The 4-byte function selector
 *
 * @example
 * ```typescript
 * const selector = extractSelectorFromExtensionKey(
 *   "0xcee78b4094da8601109600008b15909900000000000000000000000000000000"
 * );
 * // "0x8b159099"
 * ```
 */
export function extractSelectorFromExtensionKey(key: string): string {
	const [decoded] = ERC725.decodeMappingKey(key, LSP17_KEY_NAME);
	return decoded.value as string;
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
 * const extensionKeys = filterExtensionKeys(allKeys);
 * // Returns only keys starting with LSP17 prefix
 * ```
 */
export function filterExtensionKeys(dataKeys: string[]): string[] {
	return dataKeys.filter((dataKey) =>
		dataKey.startsWith(LSP17DataKeys.LSP17ExtensionPrefix),
	);
}
