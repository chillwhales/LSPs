/**
 * String Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	capitalizeFirst,
	caseInsensitiveIncludes,
	collapseWhitespace,
	isEqual,
	normalizeMimeType,
	normalizeString,
	normalizeUrl,
	removeWhitespace,
	toTitleCase,
	truncate,
	truncateString,
} from "./strings";

describe("isEqual", () => {
	it("returns true for matching strings (case-insensitive)", () => {
		expect(isEqual("0xAbCd", "0xabcd")).toBe(true);
		expect(isEqual("Hello", "hello")).toBe(true);
	});

	it("returns false for non-matching strings", () => {
		expect(isEqual("0xAbCd", "0x1234")).toBe(false);
		expect(isEqual("foo", "bar")).toBe(false);
	});
});

describe("truncate", () => {
	it("should truncate long hex strings with default params", () => {
		const hex = "0xabcdef1234567890abcdef1234567890abcdef12";
		const result = truncate(hex);
		expect(result).toBe("0xabcd\u2026ef12");
		expect(result.length).toBeLessThan(hex.length);
	});

	it("should truncate long non-hex strings with default params", () => {
		const str = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
		const result = truncate(str);
		expect(result).toBe("QmYw\u2026PbdG");
	});

	it("should not truncate short strings", () => {
		expect(truncate("0xabcd")).toBe("0xabcd");
		expect(truncate("short")).toBe("short");
	});

	it("should accept custom start and end chars", () => {
		const str = "abcdefghijklmnop";
		expect(truncate(str, 3, 3)).toBe("abc\u2026nop");
	});

	it("should return original if length <= start + end + 1", () => {
		expect(truncate("0xabcdefgh", 6, 4)).toBe("0xabcdefgh");
	});
});

describe("truncateString", () => {
	it("should truncate long strings", () => {
		expect(truncateString("Hello World", 8)).toBe("Hello...");
		expect(truncateString("1234567890", 5)).toBe("12...");
	});

	it("should not truncate short strings", () => {
		expect(truncateString("Hello", 10)).toBe("Hello");
	});

	it("should use custom suffix", () => {
		expect(truncateString("Hello World", 8, "\u2026")).toBe("Hello W\u2026");
	});
});

describe("capitalizeFirst", () => {
	it("should capitalize first letter", () => {
		expect(capitalizeFirst("hello")).toBe("Hello");
		expect(capitalizeFirst("world")).toBe("World");
	});

	it("should handle empty string", () => {
		expect(capitalizeFirst("")).toBe("");
	});

	it("should not affect already capitalized", () => {
		expect(capitalizeFirst("Hello")).toBe("Hello");
	});
});

describe("toTitleCase", () => {
	it("should convert to title case", () => {
		expect(toTitleCase("hello world")).toBe("Hello World");
		expect(toTitleCase("foo bar baz")).toBe("Foo Bar Baz");
	});

	it("should handle single word", () => {
		expect(toTitleCase("hello")).toBe("Hello");
	});
});

describe("normalizeString", () => {
	it("should lowercase and trim", () => {
		expect(normalizeString("  Hello   World  ")).toBe("hello   world");
		expect(normalizeString("FOO  BAR")).toBe("foo  bar");
	});
});

describe("normalizeMimeType", () => {
	it("should normalize MIME type", () => {
		expect(normalizeMimeType("IMAGE/PNG")).toBe("image/png");
		expect(normalizeMimeType("Text/Plain")).toBe("text/plain");
	});
});

describe("normalizeUrl", () => {
	it("should trim URL", () => {
		expect(normalizeUrl("  https://example.com  ")).toBe("https://example.com");
	});
});

describe("collapseWhitespace", () => {
	it("should collapse multiple spaces", () => {
		expect(collapseWhitespace("hello    world")).toBe("hello world");
		expect(collapseWhitespace("  foo   bar  ")).toBe(" foo bar ");
	});
});

describe("removeWhitespace", () => {
	it("should remove all whitespace", () => {
		expect(removeWhitespace("hello world")).toBe("helloworld");
		expect(removeWhitespace("  foo bar  ")).toBe("foobar");
	});
});

describe("caseInsensitiveIncludes", () => {
	it("should find substring case-insensitively", () => {
		expect(caseInsensitiveIncludes("Hello World", "hello")).toBe(true);
		expect(caseInsensitiveIncludes("Hello World", "xyz")).toBe(false);
	});
});
