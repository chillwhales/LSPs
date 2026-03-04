/**
 * Validation Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	hasValue,
	isAlphanumeric,
	isEmpty,
	isHexString,
	isInRange,
	isValidEmail,
	isValidUrl,
	matchesPattern,
	stripHtmlTags,
	validateMaxLength,
	validateRequired,
} from "./validation";

describe("validation utilities", () => {
	describe("isValidEmail", () => {
		it("should validate correct emails", () => {
			expect(isValidEmail("user@example.com")).toBe(true);
			expect(isValidEmail("test.user+tag@example.co.uk")).toBe(true);
		});

		it("should reject invalid emails", () => {
			expect(isValidEmail("invalid")).toBe(false);
			expect(isValidEmail("@example.com")).toBe(false);
			expect(isValidEmail("user@")).toBe(false);
		});
	});

	describe("isValidUrl", () => {
		it("should validate correct URLs", () => {
			expect(isValidUrl("https://example.com")).toBe(true);
			expect(isValidUrl("http://test.org/path")).toBe(true);
		});

		it("should reject invalid URLs", () => {
			expect(isValidUrl("not a url")).toBe(false);
			expect(isValidUrl("")).toBe(false);
		});
	});

	describe("isHexString", () => {
		it("should validate hex strings", () => {
			expect(isHexString("0x1234")).toBe(true);
			expect(isHexString("0xabcdef")).toBe(true);
			expect(isHexString("1234abcd")).toBe(true);
		});

		it("should reject non-hex strings", () => {
			expect(isHexString("0xGHIJ")).toBe(false);
			expect(isHexString("GHIJ")).toBe(false);
		});
	});

	describe("isAlphanumeric", () => {
		it("should validate alphanumeric strings", () => {
			expect(isAlphanumeric("abc123")).toBe(true);
		});

		it("should reject non-alphanumeric", () => {
			expect(isAlphanumeric("test-123")).toBe(false);
			expect(isAlphanumeric("hello world")).toBe(false);
		});
	});

	describe("isEmpty", () => {
		it("should detect empty values", () => {
			expect(isEmpty("")).toBe(true);
			expect(isEmpty(null)).toBe(true);
			expect(isEmpty(undefined)).toBe(true);
			expect(isEmpty("   ")).toBe(true);
			expect(isEmpty([])).toBe(true);
			expect(isEmpty({})).toBe(true);
		});

		it("should detect non-empty values", () => {
			expect(isEmpty("hello")).toBe(false);
			expect(isEmpty("0")).toBe(false);
			expect(isEmpty(0)).toBe(false);
			expect(isEmpty([1])).toBe(false);
			expect(isEmpty({ a: 1 })).toBe(false);
		});
	});

	describe("hasValue", () => {
		it("should detect values that exist", () => {
			expect(hasValue("hello")).toBe(true);
			expect(hasValue(0)).toBe(true);
			expect(hasValue(false)).toBe(true);
		});

		it("should detect missing values", () => {
			expect(hasValue(null)).toBe(false);
			expect(hasValue(undefined)).toBe(false);
			expect(hasValue("")).toBe(false);
		});
	});

	describe("isInRange", () => {
		it("should validate numbers in range", () => {
			expect(isInRange(5, 0, 10)).toBe(true);
			expect(isInRange(0, 0, 10)).toBe(true);
			expect(isInRange(10, 0, 10)).toBe(true);
		});

		it("should detect numbers out of range", () => {
			expect(isInRange(-1, 0, 10)).toBe(false);
			expect(isInRange(11, 0, 10)).toBe(false);
		});
	});

	describe("matchesPattern", () => {
		it("should match regex patterns", () => {
			expect(matchesPattern("abc123", /^[a-z0-9]+$/)).toBe(true);
		});

		it("should match string patterns", () => {
			expect(matchesPattern("hello", "hello")).toBe(true);
			expect(matchesPattern("hello", "world")).toBe(false);
		});
	});

	describe("validateRequired", () => {
		it("should return value for non-empty values", () => {
			expect(validateRequired("hello", "field")).toBe("hello");
		});

		it("should throw for empty values", () => {
			expect(() => validateRequired("", "field")).toThrow("field is required");
			expect(() => validateRequired(null, "field")).toThrow(
				"field is required",
			);
		});
	});

	describe("validateMaxLength", () => {
		it("should return string if within length", () => {
			expect(validateMaxLength("hello", 10)).toBe("hello");
		});

		it("should truncate strings exceeding length", () => {
			expect(validateMaxLength("hello world", 5)).toBe("he...");
		});

		it("should throw when truncate is false", () => {
			expect(() => validateMaxLength("hello world", 5, false)).toThrow(
				"String exceeds maximum length of 5",
			);
		});
	});

	describe("stripHtmlTags", () => {
		it("should remove script tags", () => {
			const dirty = '<div>Hello<script>alert("xss")</script></div>';
			const clean = stripHtmlTags(dirty);
			expect(clean).not.toContain("<script>");
			expect(clean).toContain("Hello");
		});

		it("should strip all HTML tags", () => {
			expect(stripHtmlTags("<b>Bold</b> text")).toBe("Bold text");
		});

		it("should handle empty input", () => {
			expect(stripHtmlTags("")).toBe("");
			expect(stripHtmlTags(null as any)).toBe("");
		});
	});
});
