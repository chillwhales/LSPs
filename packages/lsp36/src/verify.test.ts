import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";
import type { SignedAuthorization } from "./types";
import { signAuthorization } from "./sign";
import { verifyAuthorization, hashAuthorization } from "./verify";

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

describe("verifyAuthorization", () => {
	it("recovers correct signer from valid signature", async () => {
		const sig = await signAuthorization({
			auth: baseAuth,
			account,
			chainId,
			verifyingContract,
		});

		const recovered = await verifyAuthorization({
			auth: baseAuth,
			signature: sig,
			chainId,
			verifyingContract,
		});

		expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
	});

	it("tampered auth field recovers a different address", async () => {
		const sig = await signAuthorization({
			auth: baseAuth,
			account,
			chainId,
			verifyingContract,
		});

		const tampered: SignedAuthorization = { ...baseAuth, nonce: 42n };
		const recovered = await verifyAuthorization({
			auth: tampered,
			signature: sig,
			chainId,
			verifyingContract,
		});

		expect(recovered.toLowerCase()).not.toBe(
			account.address.toLowerCase(),
		);
	});
});

describe("hashAuthorization", () => {
	it("is deterministic — same inputs produce same hash", () => {
		const hash1 = hashAuthorization({
			auth: baseAuth,
			chainId,
			verifyingContract,
		});
		const hash2 = hashAuthorization({
			auth: baseAuth,
			chainId,
			verifyingContract,
		});

		expect(hash1).toBe(hash2);
		expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("differs when any field changes", () => {
		const hash1 = hashAuthorization({
			auth: baseAuth,
			chainId,
			verifyingContract,
		});

		const altAuth: SignedAuthorization = { ...baseAuth, value: 1n };
		const hash2 = hashAuthorization({
			auth: altAuth,
			chainId,
			verifyingContract,
		});

		expect(hash1).not.toBe(hash2);
	});

	it("differs when chainId changes", () => {
		const hash1 = hashAuthorization({
			auth: baseAuth,
			chainId: 1,
			verifyingContract,
		});
		const hash2 = hashAuthorization({
			auth: baseAuth,
			chainId: 42,
			verifyingContract,
		});

		expect(hash1).not.toBe(hash2);
	});
});
