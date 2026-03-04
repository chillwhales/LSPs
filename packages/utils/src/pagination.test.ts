/**
 * Pagination Utility Tests
 */

import { describe, expect, it } from "vitest";
import { calculateTotalPages } from "./pagination";

describe("calculateTotalPages", () => {
	it("should calculate exact pages", () => {
		expect(calculateTotalPages(100, 10)).toBe(10);
	});

	it("should round up for partial pages", () => {
		expect(calculateTotalPages(105, 10)).toBe(11);
	});

	it("should return 0 for no items", () => {
		expect(calculateTotalPages(0, 10)).toBe(0);
	});

	it("should handle fewer items than page size", () => {
		expect(calculateTotalPages(5, 10)).toBe(1);
	});

	it("should throw for non-positive page size", () => {
		expect(() => calculateTotalPages(10, 0)).toThrow(
			"itemsPerPage must be positive",
		);
		expect(() => calculateTotalPages(10, -1)).toThrow(
			"itemsPerPage must be positive",
		);
	});
});
