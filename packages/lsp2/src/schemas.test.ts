/**
 * LSP2 Schema Validation Tests
 *
 * Tests for LSP2 shared primitive schemas:
 * - Address, bytes32, and bytes validation
 * - Verification, image, asset, link, and tag schemas
 * - Required fields, type checking, and edge cases
 */

import { describe, expect, it } from "vitest";
import { VERIFICATION_METHODS } from "./constants";
import {
	addressSchema,
	assetSchema,
	bytes32Schema,
	bytesSchema,
	imageSchema,
	linkSchema,
	tagSchema,
	verificationSchema,
} from "./schemas";

// ============================================================================
// Address Schema Tests
// ============================================================================

describe("addressSchema", () => {
	it("should accept valid Ethereum addresses", () => {
		const validAddresses = [
			"0x0000000000000000000000000000000000000000", // zero address
			"0x1234567890123456789012345678901234567890", // simple lowercase hex
			"0xABCDEF1234567890ABCDEF1234567890ABCDEF12", // uppercase hex
			"0xaB3456789012345678901234567890123456789C", // mixed case hex
		];

		for (const address of validAddresses) {
			const result = addressSchema.safeParse(address);
			expect(result.success).toBe(true);
		}
	});

	it("should reject invalid addresses", () => {
		const invalidAddresses = [
			"0x123", // too short
			"1234567890123456789012345678901234567890", // missing 0x
			"0xGHIJKL567890123456789012345678901234567890", // invalid characters
			"0x12345678901234567890123456789012345678900", // too long (41 chars)
			"0x123456789012345678901234567890123456789", // too short (39 chars)
			null,
			undefined,
			123,
			{},
		];

		for (const address of invalidAddresses) {
			const result = addressSchema.safeParse(address);
			expect(result.success).toBe(false);
		}
	});

	it("should provide meaningful error messages for invalid types", () => {
		const result = addressSchema.safeParse(123);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"Invalid value, not a string",
			);
		}
	});
});

// ============================================================================
// Bytes32 Schema Tests
// ============================================================================

describe("bytes32Schema", () => {
	it("should accept valid 32-byte hex strings", () => {
		const validBytes32 = [
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			"0x0000000000000000000000000000000000000000000000000000000000000000",
			"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		];

		for (const bytes32 of validBytes32) {
			const result = bytes32Schema.safeParse(bytes32);
			expect(result.success).toBe(true);
		}
	});

	it("should reject invalid bytes32 strings", () => {
		const invalidBytes32 = [
			"0x1234", // too short
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00", // too long
			"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // missing 0x
			"0xGHIJ567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // invalid characters
			null,
			undefined,
			123,
		];

		for (const bytes32 of invalidBytes32) {
			const result = bytes32Schema.safeParse(bytes32);
			expect(result.success).toBe(false);
		}
	});
});

// ============================================================================
// Bytes Schema Tests
// ============================================================================

describe("bytesSchema", () => {
	it("should accept valid hex strings of any length", () => {
		const validBytes = [
			"0x",
			"0x00",
			"0x1234",
			"0x1234567890abcdef",
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		];

		for (const bytes of validBytes) {
			const result = bytesSchema.safeParse(bytes);
			expect(result.success).toBe(true);
		}
	});

	it("should reject invalid hex strings", () => {
		const invalidBytes = [
			"1234", // missing 0x
			"0xGHIJ", // invalid characters
			"not hex",
			null,
			undefined,
			123,
		];

		for (const bytes of invalidBytes) {
			const result = bytesSchema.safeParse(bytes);
			expect(result.success).toBe(false);
		}
	});
});

// ============================================================================
// Verification Schema Tests
// ============================================================================

describe("verificationSchema", () => {
	const validVerification = {
		data: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
	};

	it("should accept valid verification objects", () => {
		const result = verificationSchema.safeParse(validVerification);
		expect(result.success).toBe(true);
	});

	it("should accept both verification methods", () => {
		const bytesMethod = {
			...validVerification,
			method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
		};
		const utf8Method = {
			...validVerification,
			method: VERIFICATION_METHODS.HASH_KECCAK256_UTF8,
		};

		expect(verificationSchema.safeParse(bytesMethod).success).toBe(true);
		expect(verificationSchema.safeParse(utf8Method).success).toBe(true);
	});

	it("should reject invalid verification objects", () => {
		const invalidVerifications = [
			{}, // missing required fields
			{ data: "invalid", method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES }, // invalid data
			{ data: validVerification.data, method: "invalid" }, // invalid method
			{ data: validVerification.data }, // missing method
			{ method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES }, // missing data
		];

		for (const verification of invalidVerifications) {
			const result = verificationSchema.safeParse(verification);
			expect(result.success).toBe(false);
		}
	});
});

// ============================================================================
// Image Schema Tests
// ============================================================================

describe("imageSchema", () => {
	const validImage = {
		url: "https://example.com/image.png",
		width: 1024,
		height: 768,
		verification: {
			data: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
		},
	};

	it("should accept valid image objects", () => {
		const result = imageSchema.safeParse(validImage);
		expect(result.success).toBe(true);
	});

	it("should reject invalid image objects", () => {
		const invalidImages = [
			{}, // missing all fields
			{ ...validImage, url: 123 }, // invalid url type
			{ ...validImage, width: "not a number" }, // invalid width type
			{ ...validImage, height: "not a number" }, // invalid height type
			{ ...validImage, verification: null }, // invalid verification
			{ url: validImage.url, width: validImage.width }, // missing height and verification
		];

		for (const image of invalidImages) {
			const result = imageSchema.safeParse(image);
			expect(result.success).toBe(false);
		}
	});

	it("should provide meaningful error messages", () => {
		const result = imageSchema.safeParse({ url: 123 });
		expect(result.success).toBe(false);
		if (!result.success) {
			const errors = result.error.issues.map((issue) => issue.message);
			expect(errors).toContain("Invalid value, not a string");
		}
	});
});

// ============================================================================
// Asset Schema Tests
// ============================================================================

describe("assetSchema", () => {
	const validAsset = {
		url: "https://example.com/asset.pdf",
		fileType: "application/pdf",
		verification: {
			data: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
		},
	};

	it("should accept valid asset objects", () => {
		const result = assetSchema.safeParse(validAsset);
		expect(result.success).toBe(true);
	});

	it("should reject invalid asset objects", () => {
		const invalidAssets = [
			{}, // missing all fields
			{ ...validAsset, url: 123 }, // invalid url type
			{ ...validAsset, fileType: 123 }, // invalid fileType type
			{ ...validAsset, verification: null }, // invalid verification
			{ url: validAsset.url }, // missing fileType and verification
		];

		for (const asset of invalidAssets) {
			const result = assetSchema.safeParse(asset);
			expect(result.success).toBe(false);
		}
	});
});

// ============================================================================
// Link Schema Tests
// ============================================================================

describe("linkSchema", () => {
	const validLink = {
		title: "Example Link",
		url: "https://example.com",
	};

	it("should accept valid link objects", () => {
		const result = linkSchema.safeParse(validLink);
		expect(result.success).toBe(true);
	});

	it("should reject invalid URLs", () => {
		const invalidLinks = [
			{ title: "Invalid", url: "not a url" },
			{ title: "Invalid", url: "example.com" }, // missing protocol
			{ title: 123, url: "https://example.com" }, // invalid title type
			{ url: "https://example.com" }, // missing title
			{ title: "Test" }, // missing url
		];

		for (const link of invalidLinks) {
			const result = linkSchema.safeParse(link);
			expect(result.success).toBe(false);
		}
	});

	it("should accept various valid URL formats", () => {
		const validUrls = [
			"https://example.com",
			"http://example.com",
			"https://example.com/path",
			"https://subdomain.example.com",
			"https://example.com:8080",
		];

		for (const url of validUrls) {
			const link = { title: "Test", url };
			const result = linkSchema.safeParse(link);
			expect(result.success).toBe(true);
		}
	});
});

// ============================================================================
// Tag Schema Tests
// ============================================================================

describe("tagSchema", () => {
	it("should accept valid string tags", () => {
		const validTags = [
			"art",
			"nft",
			"digital-asset",
			"music",
			"gaming",
			"123",
			"tag with spaces",
			"",
		];

		for (const tag of validTags) {
			const result = tagSchema.safeParse(tag);
			expect(result.success).toBe(true);
		}
	});

	it("should reject non-string values", () => {
		const invalidTags = [123, null, undefined, {}, [], true];

		for (const tag of invalidTags) {
			const result = tagSchema.safeParse(tag);
			expect(result.success).toBe(false);
		}
	});

	it("should provide meaningful error messages", () => {
		const result = tagSchema.safeParse(123);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"Invalid value, not a string",
			);
		}
	});
});
