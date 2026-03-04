/**
 * Built-in LUKSO LSP ERC725Y data key constants.
 *
 * Derived from official `@lukso/lsp*-contracts` packages — no hardcoded
 * hex values. The merged {@link ALL_DATA_KEYS} record is the single source
 * of truth; {@link DATA_KEY_NAMES} and {@link BUILT_IN_DATA_KEYS} are
 * computed from it.
 *
 * Some `@lukso` packages export DataKeys with nested `{ length, index }`
 * objects for array-type keys. These are flattened into separate entries
 * using a `KeyName[].length` / `KeyName[].index` naming convention.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp2-json-schema
 * @module
 */

import { LSP1DataKeys } from "@lukso/lsp1-contracts";
import { LSP3DataKeys } from "@lukso/lsp3-contracts";
import { LSP4DataKeys } from "@lukso/lsp4-contracts";
import { LSP5DataKeys } from "@lukso/lsp5-contracts";
import { LSP6DataKeys } from "@lukso/lsp6-contracts";
import { LSP8DataKeys } from "@lukso/lsp8-contracts";
import { LSP9DataKeys } from "@lukso/lsp9-contracts";
import { LSP10DataKeys } from "@lukso/lsp10-contracts";
import { LSP12DataKeys } from "@lukso/lsp12-contracts";
import { LSP17DataKeys } from "@lukso/lsp17contractextension-contracts";

/**
 * All known LUKSO ERC725Y data keys merged into a single `{ name: hex }` record.
 *
 * Sourced from `@lukso/lsp{1,3,4,5,6,8,9,10,12,17}-contracts`.
 * Array-type keys are flattened into `KeyName[].length` and `KeyName[].index`.
 */
export const ALL_DATA_KEYS = {
	...LSP1DataKeys,
	...LSP3DataKeys,
	...(({ "LSP4Creators[]": LSP4CreatorsArray, ...rest }) => ({
		"LSP4Creators[number]": LSP4CreatorsArray.index,
		"LSP4Creators[]": LSP4CreatorsArray.length,
		...rest,
	}))(LSP4DataKeys),
	...(({ "LSP5ReceivedAssets[]": LSP5ReceivedAssetsArray, ...rest }) => ({
		"LSP5ReceivedAssets[number]": LSP5ReceivedAssetsArray.index,
		"LSP5ReceivedAssets[]": LSP5ReceivedAssetsArray.length,
		...rest,
	}))(LSP5DataKeys),
	...(({ "AddressPermissions[]": AddressPermissionsArray, ...rest }) => ({
		"AddressPermissions[number]": AddressPermissionsArray.index,
		"AddressPermissions[]": AddressPermissionsArray.length,
		...rest,
	}))(LSP6DataKeys),
	...LSP8DataKeys,
	...LSP9DataKeys,
	...(({ "LSP10Vaults[]": LSP10VaultsArray, ...rest }) => ({
		"LSP10Vaults[number]": LSP10VaultsArray.index,
		"LSP10Vaults[]": LSP10VaultsArray.length,
		...rest,
	}))(LSP10DataKeys),
	...(({ "LSP12IssuedAssets[]": LSP12IssuedAssetsArray, ...rest }) => ({
		"LSP12IssuedAssets[number]": LSP12IssuedAssetsArray.index,
		"LSP12IssuedAssets[]": LSP12IssuedAssetsArray.length,
		...rest,
	}))(LSP12DataKeys),
	...LSP17DataKeys,
} as const;

/**
 * All built-in LUKSO ERC725Y data key names as a non-empty tuple.
 *
 * Derived from {@link ALL_DATA_KEYS} keys. Used by `z.enum()` (requires
 * `[string, ...string[]]`) and the `DataKeyName` union type.
 */
export const DATA_KEY_NAMES = Object.keys(ALL_DATA_KEYS) as [
	keyof typeof ALL_DATA_KEYS,
	...(keyof typeof ALL_DATA_KEYS)[],
];

/**
 * Built-in `[name, hex]` pairs derived from {@link ALL_DATA_KEYS}.
 *
 * Used by the registry module to populate bidirectional lookup maps.
 */
export const BUILT_IN_DATA_KEYS: ReadonlyArray<
	readonly [name: string, hex: string]
> = Object.entries(ALL_DATA_KEYS);
