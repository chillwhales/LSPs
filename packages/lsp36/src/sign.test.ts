import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";
import type { SignedAuthorization } from "./types";
import { buildTypedData, signAuthorization } from "./sign";
import { verifyAuthorization } from "./verify";
import {
	LSP36_DOMAIN_NAME,
	LSP36_DOMAIN_VERSION,
	LSP36_EIP712_TYPES,
	LSP36_PRIMARY_TYPE,
} from "./constants";

const account = privateKeyToAccount(
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

const verifyingContract =
	"0x1234567890abcdef1234567890abcdef12345678" as Address;
const chainId = 1;

const baseAuth: SignedAuthorization = {
	signer: account.address,
	target: "0x000000000000000000000000000000000000dead" as Address,
	selector: "0xdeadbeef",
	paramValues: [
		"0x0000000000000000000000000000000000000000000000000000000000000001",
	],
	paramWildcards: 0n,
	paramDynamicMask: 0n,
	valueIsWildcard: false,
	value: 0n,
	signatureId:
		"0x0000000000000000000000000000000000000000000000000000000000000001",
	validAfter: 0n,
	validBefore: 281474976710655n,
	nonce: 0n,
};

describe("signAuthorization", () => {
	it("produces a signature recoverable to the signer", async () => {
		const sig = await signAuthorization({
			auth: baseAuth,
			account,
			chainId,
			verifyingContract,
		});

		expect(sig).toMatch(/^0x[0-9a-f]{130}$/);

		const recovered = await verifyAuthorization({
			auth: baseAuth,
			signature: sig,
			chainId,
			verifyingContract,
		});
		expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
	});

	it("different auth field values produce different signatures", async () => {
		const sig1 = await signAuthorization({
			auth: baseAuth,
			account,
			chainId,
			verifyingContract,
		});

		const altAuth: SignedAuthorization = { ...baseAuth, nonce: 999n };
		const sig2 = await signAuthorization({
			auth: altAuth,
			account,
			chainId,
			verifyingContract,
		});

		expect(sig1).not.toBe(sig2);
	});

	it("different chainId values produce different signatures", async () => {
		const sig1 = await signAuthorization({
			auth: baseAuth,
			account,
			chainId: 1,
			verifyingContract,
		});

		const sig2 = await signAuthorization({
			auth: baseAuth,
			account,
			chainId: 42,
			verifyingContract,
		});

		expect(sig1).not.toBe(sig2);
	});
});

describe("buildTypedData", () => {
	it("returns correct domain, types, primaryType, and message", () => {
		const td = buildTypedData({
			auth: baseAuth,
			chainId,
			verifyingContract,
		});

		expect(td.domain).toEqual({
			name: LSP36_DOMAIN_NAME,
			version: LSP36_DOMAIN_VERSION,
			chainId,
			verifyingContract,
		});
		expect(td.types).toBe(LSP36_EIP712_TYPES);
		expect(td.primaryType).toBe(LSP36_PRIMARY_TYPE);
		expect(td.message).toEqual({ ...baseAuth });
	});
});
