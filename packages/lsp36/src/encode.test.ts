import { describe, expect, it } from "vitest";
import { pad, toHex } from "viem";
import {
	buildDynamicMask,
	buildWildcardMask,
	encodeParamValue,
	encodePreApprovedTrailingBytes,
	encodeTrailingBytes,
	getWildcardedIndices,
	isWildcarded,
} from "./encode";
import { decodeTrailingBytes } from "./decode";
import type { SignedAuthorization } from "./types";

const MOCK_AUTH: SignedAuthorization = {
	signer: "0x1234567890abcdef1234567890abcdef12345678",
	target: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	selector: "0xdeadbeef",
	paramValues: [pad("0x01", { size: 32 }), pad("0x02", { size: 32 })],
	paramWildcards: 0n,
	paramDynamicMask: 0n,
	valueIsWildcard: false,
	value: 0n,
	signatureId: pad("0xaa", { size: 32 }),
	validAfter: 0n,
	validBefore: 281474976710655n,
	nonce: 1n,
};

const MOCK_SIGNATURE =
	`0x${"ab".repeat(32)}${"cd".repeat(32)}${"01"}` as `0x${string}`;

describe("encodeTrailingBytes", () => {
	it("mode 0x00 produces valid format ending with signature + 0x00", () => {
		const result = encodeTrailingBytes(MOCK_AUTH, MOCK_SIGNATURE);
		expect(result.endsWith("00")).toBe(true);
		const hexBody = result.slice(2);
		const sigAndMode = hexBody.slice(-132);
		expect(sigAndMode.slice(-2)).toBe("00");
		expect(`0x${sigAndMode.slice(0, 130)}`).toBe(MOCK_SIGNATURE);
	});

	it("throws for invalid signature length", () => {
		expect(() => encodeTrailingBytes(MOCK_AUTH, "0xabcd")).toThrow(
			"Signature must be 65 bytes",
		);
	});
});

describe("encodePreApprovedTrailingBytes", () => {
	it("produces exactly 33 bytes (66 hex chars + 0x prefix)", () => {
		const signatureId = pad("0xbb", { size: 32 });
		const result = encodePreApprovedTrailingBytes(signatureId);
		const hexBody = result.slice(2);
		expect(hexBody.length).toBe(66);
		expect(result.endsWith("01")).toBe(true);
	});

	it("throws for invalid signatureId length", () => {
		expect(() => encodePreApprovedTrailingBytes("0xabcd")).toThrow(
			"signatureId must be 32 bytes",
		);
	});
});

describe("encodeParamValue", () => {
	it("encodes address to 32-byte word", () => {
		const result = encodeParamValue(
			"address",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		expect(result.slice(2).length).toBe(64);
	});

	it("encodes uint256", () => {
		const result = encodeParamValue("uint256", 42n);
		expect(result.slice(2).length).toBe(64);
		expect(BigInt(result)).toBe(42n);
	});

	it("encodes bool", () => {
		const result = encodeParamValue("bool", true);
		expect(result.slice(2).length).toBe(64);
		expect(BigInt(result)).toBe(1n);
	});

	it("encodes bytes32", () => {
		const val = pad("0x01", { size: 32 });
		const result = encodeParamValue("bytes32", val);
		expect(result.slice(2).length).toBe(64);
	});

	it("hashes bytes (dynamic type)", () => {
		const result = encodeParamValue("bytes", "0xdeadbeef");
		expect(result.slice(2).length).toBe(64);
	});

	it("hashes string (dynamic type)", () => {
		const result = encodeParamValue("string", "hello");
		expect(result.slice(2).length).toBe(64);
	});

	it("throws for unsupported type", () => {
		expect(() => encodeParamValue("tuple", [])).toThrow("Unsupported param type");
	});
});

describe("buildWildcardMask", () => {
	it("sets bit 0", () => {
		expect(buildWildcardMask([0])).toBe(1n);
	});

	it("sets bits 0, 1, 255", () => {
		const mask = buildWildcardMask([0, 1, 255]);
		expect(isWildcarded(mask, 0)).toBe(true);
		expect(isWildcarded(mask, 1)).toBe(true);
		expect(isWildcarded(mask, 255)).toBe(true);
		expect(isWildcarded(mask, 2)).toBe(false);
	});

	it("returns 0 for empty array", () => {
		expect(buildWildcardMask([])).toBe(0n);
	});

	it("throws for index 256", () => {
		expect(() => buildWildcardMask([256])).toThrow("Wildcard index must be in [0, 255]");
	});

	it("throws for negative index", () => {
		expect(() => buildWildcardMask([-1])).toThrow("Wildcard index must be in [0, 255]");
	});
});

describe("buildDynamicMask", () => {
	it("sets bits correctly", () => {
		const mask = buildDynamicMask([3, 7]);
		expect(isWildcarded(mask, 3)).toBe(true);
		expect(isWildcarded(mask, 7)).toBe(true);
	});

	it("throws for out of range", () => {
		expect(() => buildDynamicMask([256])).toThrow("Dynamic mask index must be in [0, 255]");
	});
});

describe("isWildcarded / getWildcardedIndices", () => {
	it("consistency: getWildcardedIndices returns all set bits", () => {
		const mask = buildWildcardMask([0, 5, 100, 255]);
		const indices = getWildcardedIndices(mask);
		expect(indices).toEqual([0, 5, 100, 255]);
		for (const i of indices) {
			expect(isWildcarded(mask, i)).toBe(true);
		}
	});

	it("getWildcardedIndices returns empty for zero mask", () => {
		expect(getWildcardedIndices(0n)).toEqual([]);
	});
});

describe("round-trip encode/decode mode 0x00", () => {
	it("recovers all 12 struct fields and signature", () => {
		const encoded = encodeTrailingBytes(MOCK_AUTH, MOCK_SIGNATURE);
		const decoded = decodeTrailingBytes(encoded);

		expect(decoded.mode).toBe(0);
		if (decoded.mode !== 0) throw new Error("unreachable");

		expect(decoded.signature.toLowerCase()).toBe(MOCK_SIGNATURE.toLowerCase());
		expect(decoded.auth.signer.toLowerCase()).toBe(MOCK_AUTH.signer.toLowerCase());
		expect(decoded.auth.target.toLowerCase()).toBe(MOCK_AUTH.target.toLowerCase());
		expect(decoded.auth.selector.toLowerCase()).toBe(MOCK_AUTH.selector.toLowerCase());
		expect(decoded.auth.paramValues.length).toBe(MOCK_AUTH.paramValues.length);
		for (let i = 0; i < MOCK_AUTH.paramValues.length; i++) {
			expect(decoded.auth.paramValues[i].toLowerCase()).toBe(
				MOCK_AUTH.paramValues[i].toLowerCase(),
			);
		}
		expect(decoded.auth.paramWildcards).toBe(MOCK_AUTH.paramWildcards);
		expect(decoded.auth.paramDynamicMask).toBe(MOCK_AUTH.paramDynamicMask);
		expect(decoded.auth.valueIsWildcard).toBe(MOCK_AUTH.valueIsWildcard);
		expect(decoded.auth.value).toBe(MOCK_AUTH.value);
		expect(decoded.auth.signatureId.toLowerCase()).toBe(
			MOCK_AUTH.signatureId.toLowerCase(),
		);
		expect(decoded.auth.validAfter).toBe(MOCK_AUTH.validAfter);
		expect(decoded.auth.validBefore).toBe(MOCK_AUTH.validBefore);
		expect(decoded.auth.nonce).toBe(MOCK_AUTH.nonce);
	});

	it("round-trips with empty paramValues", () => {
		const auth = { ...MOCK_AUTH, paramValues: [] };
		const encoded = encodeTrailingBytes(auth, MOCK_SIGNATURE);
		const decoded = decodeTrailingBytes(encoded);
		expect(decoded.mode).toBe(0);
		if (decoded.mode !== 0) throw new Error("unreachable");
		expect(decoded.auth.paramValues).toEqual([]);
	});
});

describe("round-trip encode/decode mode 0x01", () => {
	it("recovers signatureId", () => {
		const signatureId = pad("0xcc", { size: 32 });
		const encoded = encodePreApprovedTrailingBytes(signatureId);
		const decoded = decodeTrailingBytes(encoded);

		expect(decoded.mode).toBe(1);
		if (decoded.mode !== 1) throw new Error("unreachable");
		expect(decoded.signatureId.toLowerCase()).toBe(signatureId.toLowerCase());
	});
});
