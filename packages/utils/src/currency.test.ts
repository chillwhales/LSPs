/**
 * Currency Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	formatMicroUsd,
	formatPrice,
	formatTokenAmount,
	MICRO_USD_DECIMALS,
	MICRO_USD_MULTIPLIER,
	microUsdToUsd,
	usdToMicroUsd,
	usdToMicroUsdBigInt,
} from "./currency";

describe("currency utilities", () => {
	describe("constants", () => {
		it("should have correct micro USD constants", () => {
			expect(MICRO_USD_DECIMALS).toBe(6);
			expect(MICRO_USD_MULTIPLIER).toBe(1000000);
		});
	});

	describe("formatPrice", () => {
		it("should format numbers as USD price", () => {
			expect(formatPrice(1)).toBe("$1.00");
			expect(formatPrice(1.23)).toBe("$1.23");
			expect(formatPrice(1234.57)).toBe("$1,234.57");
		});

		it("should handle zero", () => {
			expect(formatPrice(0)).toBe("$0.00");
		});

		it("should handle small amounts", () => {
			expect(formatPrice(0.01)).toBe("$0.01");
			expect(formatPrice(0.5)).toBe("$0.50");
		});
	});

	describe("formatTokenAmount", () => {
		it("should format token amounts with 18 decimals", () => {
			expect(formatTokenAmount(1000000000000000000n, 18)).toBe("1.00");
			expect(formatTokenAmount(1500000000000000000n, 18)).toBe("1.50");
		});

		it("should format with custom decimals", () => {
			expect(formatTokenAmount(1000000n, 6)).toBe("1.00");
			expect(formatTokenAmount(1500000n, 6)).toBe("1.50");
		});

		it("should handle zero", () => {
			expect(formatTokenAmount(0n, 18)).toBe("0.00");
		});

		it("should handle small amounts", () => {
			expect(formatTokenAmount(100000000000000000n, 18)).toBe("0.10");
		});
	});

	describe("formatMicroUsd", () => {
		it("should format micro USD string to USD price", () => {
			expect(formatMicroUsd("1234567")).toBe("$1.23");
			expect(formatMicroUsd("1000000")).toBe("$1.00");
		});
	});

	describe("microUsdToUsd", () => {
		it("should convert micro USD to USD", () => {
			expect(microUsdToUsd("1000000")).toBe(1);
			expect(microUsdToUsd("1500000")).toBe(1.5);
		});

		it("should handle zero", () => {
			expect(microUsdToUsd("0")).toBe(0);
		});
	});

	describe("usdToMicroUsd", () => {
		it("should convert USD to micro USD as string", () => {
			expect(usdToMicroUsd(1)).toBe("1000000");
			expect(usdToMicroUsd(1.5)).toBe("1500000");
			expect(usdToMicroUsd(0.5)).toBe("500000");
		});

		it("should handle zero", () => {
			expect(usdToMicroUsd(0)).toBe("0");
		});

		it("should round to nearest integer", () => {
			expect(usdToMicroUsd(1.2345678)).toBe("1234568");
		});
	});

	describe("usdToMicroUsdBigInt", () => {
		it("should convert USD to micro USD as BigInt", () => {
			expect(usdToMicroUsdBigInt(1)).toBe(1000000n);
			expect(usdToMicroUsdBigInt(1.5)).toBe(1500000n);
		});

		it("should handle zero", () => {
			expect(usdToMicroUsdBigInt(0)).toBe(0n);
		});
	});

	describe("round trip conversions", () => {
		it("should convert back and forth without loss", () => {
			const microUsd = "1234567";
			const usd = microUsdToUsd(microUsd);
			const backToMicro = usdToMicroUsd(usd);
			expect(backToMicro).toBe(microUsd);
		});
	});
});
