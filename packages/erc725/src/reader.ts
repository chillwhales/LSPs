/**
 * ERC725Y On-Chain Reader
 *
 * Read ERC725Y contract storage using a viem PublicClient.
 * Unlike erc725.js's built-in getData (which requires its own provider abstraction),
 * this works directly with any viem-compatible client.
 *
 * @see https://docs.lukso.tech/standards/lsp-background/erc725
 */

import type { Address, Hex } from "viem";

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

/**
 * Minimal client interface — compatible with viem's PublicClient.
 *
 * Accepts any object with a `readContract` method, making it easy to
 * test with mocks.
 */
export interface ERC725YReader {
	readContract: (args: {
		address: Address;
		abi: readonly Record<string, unknown>[];
		functionName: string;
		args: readonly unknown[];
	}) => Promise<unknown>;
}

/**
 * Read a single ERC725Y data key from a contract.
 *
 * @param client - Viem PublicClient (or any object with readContract)
 * @param contractAddress - The ERC725Y contract address
 * @param dataKey - The 32-byte data key to read
 * @returns The data value as hex (empty `"0x"` if not set)
 * @throws If the contract read fails
 *
 * @example
 * ```typescript
 * import { createPublicClient, http } from "viem";
 * import { lukso } from "viem/chains";
 * import { getData, encodeKeyName } from "@chillwhales/erc725";
 *
 * const client = createPublicClient({ chain: lukso, transport: http() });
 * const value = await getData(client, "0x1234...", encodeKeyName("LSP3Profile"));
 * ```
 */
export async function getData(
	client: ERC725YReader,
	contractAddress: Address,
	dataKey: Hex,
): Promise<Hex>;
/**
 * Read multiple ERC725Y data keys from a contract in a single call.
 *
 * @param client - Viem PublicClient (or any object with readContract)
 * @param contractAddress - The ERC725Y contract address
 * @param dataKeys - Array of 32-byte data keys to read
 * @returns Array of data values as hex (empty `"0x"` for unset keys)
 * @throws If the contract read fails
 *
 * @example
 * ```typescript
 * const values = await getData(client, "0x1234...", [
 *   encodeKeyName("LSP3Profile"),
 *   encodeKeyName("LSP5ReceivedAssets[]"),
 * ]);
 * ```
 */
export async function getData(
	client: ERC725YReader,
	contractAddress: Address,
	dataKeys: Hex[],
): Promise<Hex[]>;
export async function getData(
	client: ERC725YReader,
	contractAddress: Address,
	dataKeyOrKeys: Hex | Hex[],
): Promise<Hex | Hex[]> {
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
