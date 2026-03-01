/**
 * Blockchain Utility Tests
 */

import { describe, expect, it } from "vitest";
import { encodeUint128, parseUint128 } from "./blockchain";

describe("blockchain utilities", () => {
	describe("encodeUint128", () => {
		it("should encode small numbers", () => {
			expect(encodeUint128(0n)).toBe("0x00000000000000000000000000000000");
			expect(encodeUint128(1n)).toBe("0x00000000000000000000000000000001");
			expect(encodeUint128(255n)).toBe("0x000000000000000000000000000000ff");
		});

		it("should encode large numbers", () => {
			const maxUint128 = 2n ** 128n - 1n;
			expect(encodeUint128(maxUint128)).toBe(
				"0xffffffffffffffffffffffffffffffff",
			);
		});

		it("should encode mid-range numbers", () => {
			expect(encodeUint128(123456789n)).toBe(
				"0x000000000000000000000000075bcd15",
			);
		});
	});

	describe("parseUint128", () => {
		it("should parse small numbers", () => {
			expect(parseUint128("0x00000000000000000000000000000000")).toBe(0n);
			expect(parseUint128("0x00000000000000000000000000000001")).toBe(1n);
			expect(parseUint128("0x000000000000000000000000000000ff")).toBe(255n);
		});

		it("should parse large numbers", () => {
			const maxUint128 = 2n ** 128n - 1n;
			expect(parseUint128("0xffffffffffffffffffffffffffffffff")).toBe(
				maxUint128,
			);
		});

		it("should handle hex without padding", () => {
			expect(parseUint128("0x1")).toBe(1n);
			expect(parseUint128("0xff")).toBe(255n);
		});

		it("should handle empty/zero values", () => {
			expect(parseUint128("0x")).toBe(0n);
			expect(parseUint128("0x0")).toBe(0n);
		});
	});

	describe("round trip", () => {
		it("should encode and parse back to same value", () => {
			const values = [0n, 1n, 255n, 123456789n, 2n ** 64n, 2n ** 128n - 1n];

			for (const value of values) {
				expect(parseUint128(encodeUint128(value))).toBe(value);
			}
		});
	});
});
