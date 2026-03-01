import type { Hex } from "viem";

/** ERC725Y key-value pair */
export interface ERC725YKeyValue {
	key: Hex;
	value: Hex;
}

/** ERC725Y key type classifications from LSP2 */
export type ERC725YKeyType =
	| "Singleton"
	| "Array"
	| "Mapping"
	| "MappingWithGrouping";
