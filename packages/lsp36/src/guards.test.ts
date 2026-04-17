import { describe, expect, it } from "vitest";
import { MAX_UINT48 } from "./constants";
import { isSignedAuthorization } from "./guards";

const validAuth = {
	signer: "0x1234567890abcdef1234567890abcdef12345678",
	target: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	selector: "0x12345678",
	paramValues: [
		"0x0000000000000000000000000000000000000000000000000000000000000001",
	],
	paramWildcards: 0n,
	paramDynamicMask: 0n,
	valueIsWildcard: false,
	value: 0n,
	signatureId:
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	validAfter: 0n,
	validBefore: MAX_UINT48,
	nonce: 0n,
};

describe("isSignedAuthorization", () => {
	it("returns true for valid SignedAuthorization", () => {
		expect(isSignedAuthorization(validAuth)).toBe(true);
	});

	it("returns false for null", () => {
		expect(isSignedAuthorization(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isSignedAuthorization(undefined)).toBe(false);
	});

	it("returns false for empty object", () => {
		expect(isSignedAuthorization({})).toBe(false);
	});

	it("returns false for string", () => {
		expect(isSignedAuthorization("not an auth")).toBe(false);
	});

	it("returns false for number", () => {
		expect(isSignedAuthorization(42)).toBe(false);
	});

	it("returns false for partial object (missing fields)", () => {
		expect(isSignedAuthorization({ signer: validAuth.signer })).toBe(false);
	});

	it("never throws on any input", () => {
		const inputs = [
			null,
			undefined,
			0,
			"",
			[],
			{},
			Symbol("test"),
			() => {},
			validAuth,
		];
		for (const input of inputs) {
			expect(() => isSignedAuthorization(input)).not.toThrow();
		}
	});
});
