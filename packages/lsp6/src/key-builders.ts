/**
 * LSP6 Key Builders
 *
 * Pure functions for building ERC725Y data keys used by the LSP6 Key Manager.
 * Each function concatenates the LSP6 data key prefix with a controller address
 * to produce the 32-byte storage key.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager
 */

import { LSP6DataKeys } from "@lukso/lsp6-contracts";
import { type Address, concat, type Hex } from "viem";

/**
 * Build the LSP6 permissions data key for an address
 *
 * @param address - The controller/extension address
 * @returns The 32-byte permissions data key
 *
 * @example
 * ```typescript
 * const key = buildPermissionsKey('0x1234...');
 * // '0x4b80742de2bf82acb3630000<address>'
 * ```
 */
export function buildPermissionsKey(address: Address): Hex {
	return concat([LSP6DataKeys["AddressPermissions:Permissions"], address]);
}

/**
 * Build the LSP6 allowed data keys key for an address
 *
 * @param address - The controller/extension address
 * @returns The 32-byte allowed data keys key
 *
 * @example
 * ```typescript
 * const key = buildAllowedDataKeysKey('0x1234...');
 * // '0x4b80742de2bf866c29110000<address>'
 * ```
 */
export function buildAllowedDataKeysKey(address: Address): Hex {
	return concat([
		LSP6DataKeys["AddressPermissions:AllowedERC725YDataKeys"],
		address,
	]);
}

/**
 * Build the LSP6 allowed calls key for an address
 *
 * @param address - The controller/extension address
 * @returns The 32-byte allowed calls key
 *
 * @example
 * ```typescript
 * const key = buildAllowedCallsKey('0x1234...');
 * // '0x4b80742de2bf393a64c70000<address>'
 * ```
 */
export function buildAllowedCallsKey(address: Address): Hex {
	return concat([LSP6DataKeys["AddressPermissions:AllowedCalls"], address]);
}
