import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { MAX_UINT48 } from "./constants";
import type { SignedAuthorization } from "./types";
import { signAuthorization } from "./sign";
import { hashAuthorization, verifyAuthorization } from "./verify";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const VERIFYING_CONTRACT = "0x2222222222222222222222222222222222222222" as const;
const CHAIN_ID = 31337;

const FIXTURE_PATH = resolve(
	__dirname,
	"../../../solidity/LSP36/test/fixtures/ts-signed-auth.json",
);

describe("generate fixture", () => {
	it("signs a deterministic authorization and writes fixture JSON", async () => {
		const account = privateKeyToAccount(PRIVATE_KEY);

		const auth: SignedAuthorization = {
			signer: account.address,
			target: "0x1111111111111111111111111111111111111111",
			selector: "0x12345678",
			paramValues: [keccak256(toHex("test-param"))],
			paramWildcards: 0n,
			paramDynamicMask: 0n,
			valueIsWildcard: false,
			value: 1000000000000000000n,
			signatureId: keccak256(toHex("test-sig-id")),
			validAfter: 0n,
			validBefore: MAX_UINT48,
			nonce: 0n,
		};

		const signature = await signAuthorization({
			auth,
			account,
			chainId: CHAIN_ID,
			verifyingContract: VERIFYING_CONTRACT,
		});

		const digest = hashAuthorization({
			auth,
			chainId: CHAIN_ID,
			verifyingContract: VERIFYING_CONTRACT,
		});

		const recovered = await verifyAuthorization({
			auth,
			signature,
			chainId: CHAIN_ID,
			verifyingContract: VERIFYING_CONTRACT,
		});
		expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());

		const fixture = {
			auth: {
				signer: auth.signer,
				target: auth.target,
				selector: auth.selector,
				paramValues: auth.paramValues,
				paramWildcards: auth.paramWildcards.toString(),
				paramDynamicMask: auth.paramDynamicMask.toString(),
				valueIsWildcard: auth.valueIsWildcard,
				value: auth.value.toString(),
				signatureId: auth.signatureId,
				validAfter: auth.validAfter.toString(),
				validBefore: auth.validBefore.toString(),
				nonce: auth.nonce.toString(),
			},
			signature,
			digest,
			chainId: CHAIN_ID,
			verifyingContract: VERIFYING_CONTRACT,
		};

		const fixtureDir = dirname(FIXTURE_PATH);
		if (!existsSync(fixtureDir)) {
			mkdirSync(fixtureDir, { recursive: true });
		}
		writeFileSync(FIXTURE_PATH, JSON.stringify(fixture, null, "\t"));

		expect(existsSync(FIXTURE_PATH)).toBe(true);
	});
});
