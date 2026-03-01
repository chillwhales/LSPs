/**
 * Transformers Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	base64ToArrayBuffer,
	base64ToBlob,
	base64ToBytes,
	base64ToUtf8,
	bytesToBase64,
	capitalizeFirst,
	caseInsensitiveEquals,
	caseInsensitiveIncludes,
	collapseWhitespace,
	normalizeMimeType,
	normalizeString,
	normalizeUrl,
	removeWhitespace,
	toTitleCase,
	truncateString,
	urlBase64ToUint8Array,
	utf8ToBase64,
} from "./transformers";

describe("transformers utilities", () => {
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

	describe("normalizeString", () => {
		it("should lowercase and trim", () => {
			expect(normalizeString("  Hello   World  ")).toBe("hello   world");
			expect(normalizeString("FOO  BAR")).toBe("foo  bar");
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

	describe("normalizeUrl", () => {
		it("should trim URL", () => {
			expect(normalizeUrl("  https://example.com  ")).toBe(
				"https://example.com",
			);
		});
	});

	describe("normalizeMimeType", () => {
		it("should normalize MIME type", () => {
			expect(normalizeMimeType("IMAGE/PNG")).toBe("image/png");
			expect(normalizeMimeType("Text/Plain")).toBe("text/plain");
		});
	});

	describe("caseInsensitiveIncludes", () => {
		it("should find substring case-insensitively", () => {
			expect(caseInsensitiveIncludes("Hello World", "hello")).toBe(true);
			expect(caseInsensitiveIncludes("Hello World", "xyz")).toBe(false);
		});
	});

	describe("caseInsensitiveEquals", () => {
		it("should compare strings case-insensitively", () => {
			expect(caseInsensitiveEquals("Hello", "hello")).toBe(true);
			expect(caseInsensitiveEquals("foo", "bar")).toBe(false);
		});
	});

	describe("base64 encoding/decoding", () => {
		describe("utf8ToBase64 and base64ToUtf8", () => {
			it("should encode and decode UTF-8", () => {
				const text = "Hello World";
				const encoded = utf8ToBase64(text);
				expect(base64ToUtf8(encoded)).toBe(text);
			});

			it("should handle special characters", () => {
				const text = "Hello \u4e16\u754c \ud83c\udf0d";
				const encoded = utf8ToBase64(text);
				expect(base64ToUtf8(encoded)).toBe(text);
			});
		});

		describe("bytesToBase64 and base64ToBytes", () => {
			it("should encode and decode bytes", () => {
				const bytes = new Uint8Array([72, 101, 108, 108, 111]);
				const encoded = bytesToBase64(bytes);
				const decoded = base64ToBytes(encoded);
				expect(decoded).toEqual(bytes);
			});
		});

		describe("base64ToBlob", () => {
			it("should convert base64 to Blob", () => {
				const base64 = "SGVsbG8=";
				const blob = base64ToBlob(base64, "text/plain");
				expect(blob).toBeInstanceOf(Blob);
				expect(blob.type).toBe("text/plain");
			});
		});

		describe("base64ToArrayBuffer", () => {
			it("should convert base64 to ArrayBuffer", () => {
				const base64 = "SGVsbG8=";
				const buffer = base64ToArrayBuffer(base64);
				expect(buffer).toBeInstanceOf(ArrayBuffer);
				expect(buffer.byteLength).toBeGreaterThan(0);
			});

			it("should handle data URLs", () => {
				const dataUrl = "data:text/plain;base64,SGVsbG8=";
				const buffer = base64ToArrayBuffer(dataUrl);
				expect(buffer.byteLength).toBe(5);
			});
		});

		describe("urlBase64ToUint8Array", () => {
			it("should convert URL-safe base64 to Uint8Array", () => {
				const urlSafeBase64 = "SGVsbG8";
				const result = urlBase64ToUint8Array(urlSafeBase64);
				expect(result).toBeInstanceOf(Uint8Array);
			});
		});
	});
});
