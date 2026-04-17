import type { Address, Hex } from "viem";
import { hashTypedData, recoverTypedDataAddress } from "viem";
import {
	LSP36_DOMAIN_NAME,
	LSP36_DOMAIN_VERSION,
	LSP36_EIP712_TYPES,
	LSP36_PRIMARY_TYPE,
} from "./constants";
import type { SignedAuthorization } from "./types";

function buildDomainAndMessage(params: {
	auth: SignedAuthorization;
	chainId: number;
	verifyingContract: Address;
}) {
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

export async function verifyAuthorization(params: {
	auth: SignedAuthorization;
	signature: Hex;
	chainId: number;
	verifyingContract: Address;
}): Promise<Address> {
	const typed = buildDomainAndMessage({
		auth: params.auth,
		chainId: params.chainId,
		verifyingContract: params.verifyingContract,
	});

	return recoverTypedDataAddress({
		domain: typed.domain,
		types: typed.types,
		primaryType: typed.primaryType,
		message: typed.message,
		signature: params.signature,
	});
}

export function hashAuthorization(params: {
	auth: SignedAuthorization;
	chainId: number;
	verifyingContract: Address;
}): Hex {
	const typed = buildDomainAndMessage({
		auth: params.auth,
		chainId: params.chainId,
		verifyingContract: params.verifyingContract,
	});

	return hashTypedData({
		domain: typed.domain,
		types: typed.types,
		primaryType: typed.primaryType,
		message: typed.message,
	});
}
