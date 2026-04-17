import { describe, expect, it } from "vitest";
import { pad } from "viem";
import { decodeTrailingBytes } from "./decode";
import {
	encodePreApprovedTrailingBytes,
	encodeTrailingBytes,
} from "./encode";
import type { SignedAuthorization } from "./types";

const MOCK_AUTH: SignedAuthorization = {
	signer: "0x1234567890abcdef1234567890abcdef12345678",
	target: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	selector: "0xdeadbeef",
	paramValues: [pad("0x01", { size: 32 })],
	paramWildcards: 1n,
	paramDynamicMask: 0n,
	valueIsWildcard: true,
	value: 1000n,
	signatureId: pad("0xff", { size: 32 }),
	validAfter: 100n,
	validBefore: 200n,
	nonce: 42n,
};

const MOCK_SIGNATURE =
	`0x${"ab".repeat(32)}${"cd".repeat(32)}${"1b"}` as `0x${string}`;

describe("decodeTrailingBytes mode 0x00", () => {
	it("decodes mode 0x00 trailing bytes correctly", () => {
		const encoded = encodeTrailingBytes(MOCK_AUTH, MOCK_SIGNATURE);
		const result = decodeTrailingBytes(encoded);

		expect(result.mode).toBe(0);
		if (result.mode !== 0) throw new Error("unreachable");
		expect(result.auth.signer.toLowerCase()).toBe(MOCK_AUTH.signer.toLowerCase());
		expect(result.auth.valueIsWildcard).toBe(true);
		expect(result.auth.value).toBe(1000n);
		expect(result.auth.nonce).toBe(42n);
	});
});

describe("decodeTrailingBytes mode 0x01", () => {
	it("decodes mode 0x01 trailing bytes correctly", () => {
		const signatureId = pad("0xdd", { size: 32 });
		const encoded = encodePreApprovedTrailingBytes(signatureId);
		const result = decodeTrailingBytes(encoded);

		expect(result.mode).toBe(1);
		if (result.mode !== 1) throw new Error("unreachable");
		expect(result.signatureId.toLowerCase()).toBe(signatureId.toLowerCase());
	});
});

describe("decodeTrailingBytes error cases", () => {
	it("throws on invalid mode byte 0x02", () => {
		const data = `0x${"00".repeat(32)}02` as `0x${string}`;
		expect(() => decodeTrailingBytes(data)).toThrow("Unknown trailing bytes mode: 0x02");
	});

	it("throws on invalid mode byte 0xff", () => {
		const data = `0x${"00".repeat(32)}ff` as `0x${string}`;
		expect(() => decodeTrailingBytes(data)).toThrow("Unknown trailing bytes mode: 0xff");
	});

	it("throws on empty data", () => {
		expect(() => decodeTrailingBytes("0x" as `0x${string}`)).toThrow("too short");
	});

	it("throws on truncated mode 0x01 data (less than 33 bytes)", () => {
		const data = `0x${"00".repeat(10)}01` as `0x${string}`;
		expect(() => decodeTrailingBytes(data)).toThrow("Mode 0x01 trailing bytes too short");
	});

	it("throws on truncated mode 0x00 data (less than 66 bytes)", () => {
		const data = `0x${"00".repeat(30)}00` as `0x${string}`;
		expect(() => decodeTrailingBytes(data)).toThrow("Mode 0x00 trailing bytes too short");
	});
});

describe("round-trip both modes", () => {
	it("mode 0x00 round-trip preserves all fields", () => {
		const encoded = encodeTrailingBytes(MOCK_AUTH, MOCK_SIGNATURE);
		const decoded = decodeTrailingBytes(encoded);

		expect(decoded.mode).toBe(0);
		if (decoded.mode !== 0) throw new Error("unreachable");
		expect(decoded.auth.validAfter).toBe(MOCK_AUTH.validAfter);
		expect(decoded.auth.validBefore).toBe(MOCK_AUTH.validBefore);
		expect(decoded.auth.paramWildcards).toBe(MOCK_AUTH.paramWildcards);
		expect(decoded.signature.toLowerCase()).toBe(MOCK_SIGNATURE.toLowerCase());
	});

	it("mode 0x01 round-trip preserves signatureId", () => {
		const signatureId = pad("0xee", { size: 32 });
		const encoded = encodePreApprovedTrailingBytes(signatureId);
		const decoded = decodeTrailingBytes(encoded);

		expect(decoded.mode).toBe(1);
		if (decoded.mode !== 1) throw new Error("unreachable");
		expect(decoded.signatureId.toLowerCase()).toBe(signatureId.toLowerCase());
	});
});
