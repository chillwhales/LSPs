import { describe, expect, it } from "vitest";
import { MAX_UINT48 } from "./constants";
import {
	addressSchema,
	bytes4Schema,
	bytes32Schema,
	signedAuthorizationSchema,
} from "./schemas";

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

describe("addressSchema", () => {
	it("accepts valid address", () => {
		expect(
			addressSchema.safeParse("0x1234567890abcdef1234567890abcdef12345678")
				.success,
		).toBe(true);
	});

	it("rejects empty string", () => {
		expect(addressSchema.safeParse("").success).toBe(false);
	});

	it("rejects address without 0x prefix", () => {
		expect(
			addressSchema.safeParse("1234567890abcdef1234567890abcdef12345678")
				.success,
		).toBe(false);
	});

	it("rejects address with wrong length", () => {
		expect(addressSchema.safeParse("0x1234").success).toBe(false);
	});

	it("rejects non-hex characters", () => {
		expect(
			addressSchema.safeParse("0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG")
				.success,
		).toBe(false);
	});
});

describe("bytes4Schema", () => {
	it("accepts valid bytes4", () => {
		expect(bytes4Schema.safeParse("0x12345678").success).toBe(true);
	});

	it("rejects wrong length", () => {
		expect(bytes4Schema.safeParse("0x1234").success).toBe(false);
		expect(bytes4Schema.safeParse("0x123456789a").success).toBe(false);
	});
});

describe("bytes32Schema", () => {
	it("accepts valid bytes32", () => {
		expect(
			bytes32Schema.safeParse(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			).success,
		).toBe(true);
	});

	it("rejects too short", () => {
		expect(bytes32Schema.safeParse("0x0001").success).toBe(false);
	});

	it("rejects too long", () => {
		expect(
			bytes32Schema.safeParse(
				"0x00000000000000000000000000000000000000000000000000000000000000001",
			).success,
		).toBe(false);
	});
});

describe("signedAuthorizationSchema", () => {
	it("accepts a valid SignedAuthorization", () => {
		expect(signedAuthorizationSchema.safeParse(validAuth).success).toBe(true);
	});

	it("rejects when required fields are missing", () => {
		const { signer: _, ...noSigner } = validAuth;
		expect(signedAuthorizationSchema.safeParse(noSigner).success).toBe(false);

		const { target: __, ...noTarget } = validAuth;
		expect(signedAuthorizationSchema.safeParse(noTarget).success).toBe(false);
	});

	it("accepts empty paramValues array", () => {
		expect(
			signedAuthorizationSchema.safeParse({ ...validAuth, paramValues: [] })
				.success,
		).toBe(true);
	});

	it("accepts paramValues with 256 entries", () => {
		const large = Array.from(
			{ length: 256 },
			() =>
				"0x0000000000000000000000000000000000000000000000000000000000000001",
		);
		expect(
			signedAuthorizationSchema.safeParse({
				...validAuth,
				paramValues: large,
			}).success,
		).toBe(true);
	});

	it("rejects paramValues with non-bytes32 entries", () => {
		expect(
			signedAuthorizationSchema.safeParse({
				...validAuth,
				paramValues: ["0x1234"],
			}).success,
		).toBe(false);
	});

	it("accepts uint48 boundary: validAfter=0n", () => {
		expect(
			signedAuthorizationSchema.safeParse({ ...validAuth, validAfter: 0n })
				.success,
		).toBe(true);
	});

	it("accepts uint48 boundary: validBefore=MAX_UINT48", () => {
		expect(
			signedAuthorizationSchema.safeParse({
				...validAuth,
				validBefore: MAX_UINT48,
			}).success,
		).toBe(true);
	});

	it("rejects negative bigint for uint256 fields", () => {
		expect(
			signedAuthorizationSchema.safeParse({ ...validAuth, value: -1n })
				.success,
		).toBe(false);
	});

	it("rejects negative bigint for uint48 fields", () => {
		expect(
			signedAuthorizationSchema.safeParse({ ...validAuth, validAfter: -1n })
				.success,
		).toBe(false);
	});

	it("rejects number instead of bigint", () => {
		expect(
			signedAuthorizationSchema.safeParse({ ...validAuth, nonce: 42 })
				.success,
		).toBe(false);
	});

	it("rejects invalid address format in signer", () => {
		expect(
			signedAuthorizationSchema.safeParse({ ...validAuth, signer: "0xBAD" })
				.success,
		).toBe(false);
	});

	it("rejects invalid selector length", () => {
		expect(
			signedAuthorizationSchema.safeParse({
				...validAuth,
				selector: "0x12",
			}).success,
		).toBe(false);
	});

	it("rejects non-boolean valueIsWildcard", () => {
		expect(
			signedAuthorizationSchema.safeParse({
				...validAuth,
				valueIsWildcard: "true",
			}).success,
		).toBe(false);
	});
});
