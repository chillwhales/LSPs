import type { Address, Hex, LocalAccount } from "viem";
import {
	LSP36_DOMAIN_NAME,
	LSP36_DOMAIN_VERSION,
	LSP36_EIP712_TYPES,
	LSP36_PRIMARY_TYPE,
} from "./constants";
import type { SignedAuthorization } from "./types";

export interface TypedData {
	domain: {
		name: string;
		version: string;
		chainId: number;
		verifyingContract: Address;
	};
	types: typeof LSP36_EIP712_TYPES;
	primaryType: typeof LSP36_PRIMARY_TYPE;
	message: Record<string, unknown>;
}

export function buildTypedData(params: {
	auth: SignedAuthorization;
	chainId: number;
	verifyingContract: Address;
}): TypedData {
	return {
		domain: {
			name: LSP36_DOMAIN_NAME,
			version: LSP36_DOMAIN_VERSION,
			chainId: params.chainId,
			verifyingContract: params.verifyingContract,
		},
		types: LSP36_EIP712_TYPES,
		primaryType: LSP36_PRIMARY_TYPE,
		message: { ...params.auth },
	};
}

export async function signAuthorization(params: {
	auth: SignedAuthorization;
	account: LocalAccount;
	chainId: number;
	verifyingContract: Address;
}): Promise<Hex> {
	const typedData = buildTypedData({
		auth: params.auth,
		chainId: params.chainId,
		verifyingContract: params.verifyingContract,
	});

	return params.account.signTypedData({
		domain: typedData.domain,
		types: typedData.types,
		primaryType: typedData.primaryType,
		message: typedData.message,
	});
}
