/**
 * LSP4 Type Guard Tests
 *
 * Tests for runtime type guard validation of LSP4 schemas.
 * Validates both positive cases (valid inputs) and negative cases
 * (missing fields, wrong types, etc.).
 */

import { VERIFICATION_METHODS } from "@chillwhales/lsp2";
import { describe, expect, it } from "vitest";
import { isAttributesSchema, isLsp4MetadataSchema } from "./guards";
import type { LSP4Attribute, LSP4Metadata } from "./types";

// ============================================================================
// Test Fixtures
// ============================================================================

const validVerification = {
	data: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

const validStringAttribute: LSP4Attribute = {
	key: "color",
	value: "blue",
	type: "string",
};

const validNumberAttribute: LSP4Attribute = {
	key: "price",
	value: "100.50",
	type: "number",
};

const validBooleanAttribute: LSP4Attribute = {
	key: "isRare",
	value: true,
	type: "boolean",
};

const validMetadata: LSP4Metadata = {
	name: "Test Token",
	description: "A test digital asset",
	category: "art",
	links: [{ title: "Official Site", url: "https://example.com" }],
	icon: [
		{
			url: "https://example.com/icon.png",
			width: 64,
			height: 64,
			verification: validVerification,
		},
	],
	images: [
		[
			{
				url: "https://example.com/image.png",
				width: 1024,
				height: 768,
				verification: validVerification,
			},
		],
	],
	assets: [
		{
			url: "https://example.com/asset.pdf",
			fileType: "application/pdf",
			verification: validVerification,
		},
	],
	attributes: [validStringAttribute, validNumberAttribute],
};

// ============================================================================
// isAttributesSchema Tests
// ============================================================================

describe("isAttributesSchema", () => {
	describe("string attributes", () => {
		it("should return true for valid string attributes", () => {
			expect(isAttributesSchema(validStringAttribute)).toBe(true);
		});

		it("should return true for string attributes with special characters", () => {
			const specialAttribute = {
				key: "special-key_123",
				value: "special value with spaces & symbols!",
				type: "string",
			};
			expect(isAttributesSchema(specialAttribute)).toBe(true);
		});

		it("should return false for string attributes with missing fields", () => {
			const missingKey = { value: "test", type: "string" };
			const missingValue = { key: "test", type: "string" };
			const missingType = { key: "test", value: "test" };

			expect(isAttributesSchema(missingKey)).toBe(false);
			expect(isAttributesSchema(missingValue)).toBe(false);
			expect(isAttributesSchema(missingType)).toBe(false);
		});

		it("should return false for string attributes with invalid types", () => {
			const invalidKey = { key: 123, value: "test", type: "string" };
			const invalidValue = { key: "test", value: 123, type: "string" };

			expect(isAttributesSchema(invalidKey)).toBe(false);
			expect(isAttributesSchema(invalidValue)).toBe(false);
		});
	});

	describe("number attributes", () => {
		it("should return true for valid number attributes", () => {
			expect(isAttributesSchema(validNumberAttribute)).toBe(true);
		});

		it("should return true for various numeric string formats", () => {
			const integerAttribute = { key: "count", value: "42", type: "number" };
			const floatAttribute = { key: "price", value: "99.99", type: "number" };
			const negativeAttribute = { key: "temp", value: "-10.5", type: "number" };
			const zeroAttribute = { key: "zero", value: "0", type: "number" };

			expect(isAttributesSchema(integerAttribute)).toBe(true);
			expect(isAttributesSchema(floatAttribute)).toBe(true);
			expect(isAttributesSchema(negativeAttribute)).toBe(true);
			expect(isAttributesSchema(zeroAttribute)).toBe(true);
		});

		it("should return false for non-numeric string values", () => {
			const nonNumericAttribute = {
				key: "price",
				value: "not a number",
				type: "number",
			};
			const emptyAttribute = { key: "price", value: "", type: "number" };
			const spacesAttribute = { key: "price", value: "  ", type: "number" };

			expect(isAttributesSchema(nonNumericAttribute)).toBe(false);
			expect(isAttributesSchema(emptyAttribute)).toBe(false);
			expect(isAttributesSchema(spacesAttribute)).toBe(false);
		});

		it("should return false for actual number values (must be string)", () => {
			const actualNumber = { key: "price", value: 100.5, type: "number" };
			expect(isAttributesSchema(actualNumber)).toBe(false);
		});
	});

	describe("boolean attributes", () => {
		it("should return true for valid boolean attributes", () => {
			expect(isAttributesSchema(validBooleanAttribute)).toBe(true);
		});

		it("should return true for both boolean values", () => {
			const trueAttribute = { key: "isActive", value: true, type: "boolean" };
			const falseAttribute = { key: "isActive", value: false, type: "boolean" };

			expect(isAttributesSchema(trueAttribute)).toBe(true);
			expect(isAttributesSchema(falseAttribute)).toBe(true);
		});

		it("should return false for non-boolean values", () => {
			const stringBoolean = { key: "isActive", value: "true", type: "boolean" };
			const numberBoolean = { key: "isActive", value: 1, type: "boolean" };

			expect(isAttributesSchema(stringBoolean)).toBe(false);
			expect(isAttributesSchema(numberBoolean)).toBe(false);
		});
	});

	describe("general validation", () => {
		it("should return false for invalid type field", () => {
			const invalidType = { key: "test", value: "test", type: "invalid" };
			expect(isAttributesSchema(invalidType)).toBe(false);
		});

		it("should return false for non-objects", () => {
			expect(isAttributesSchema(null)).toBe(false);
			expect(isAttributesSchema(undefined)).toBe(false);
			expect(isAttributesSchema("string")).toBe(false);
			expect(isAttributesSchema(123)).toBe(false);
			expect(isAttributesSchema([])).toBe(false);
			expect(isAttributesSchema(true)).toBe(false);
		});
	});
});

// ============================================================================
// isLsp4MetadataSchema Tests
// ============================================================================

describe("isLsp4MetadataSchema", () => {
	it("should return true for valid complete metadata", () => {
		expect(isLsp4MetadataSchema(validMetadata)).toBe(true);
	});

	it("should return true for metadata with null nullable fields", () => {
		const metadataWithNulls = {
			...validMetadata,
			name: null,
			description: null,
			category: null,
		};
		expect(isLsp4MetadataSchema(metadataWithNulls)).toBe(true);
	});

	it("should return true for metadata with empty arrays", () => {
		const emptyArraysMetadata = {
			name: "Test",
			description: "Test description",
			category: "test",
			links: [],
			icon: [],
			images: [],
			assets: [],
			attributes: [],
		};
		expect(isLsp4MetadataSchema(emptyArraysMetadata)).toBe(true);
	});

	it("should return true for minimal valid metadata", () => {
		const minimalMetadata = {
			name: null,
			description: null,
			category: null,
			links: [],
			icon: [],
			images: [],
			assets: [],
			attributes: [],
		};
		expect(isLsp4MetadataSchema(minimalMetadata)).toBe(true);
	});

	describe("field validation", () => {
		it("should return false for missing required fields", () => {
			const requiredFields = [
				"name",
				"description",
				"category",
				"links",
				"icon",
				"images",
				"assets",
				"attributes",
			];

			for (const field of requiredFields) {
				const incomplete = { ...validMetadata };
				delete (incomplete as any)[field];
				expect(isLsp4MetadataSchema(incomplete)).toBe(false);
			}
		});

		it("should return false for invalid field types", () => {
			const invalidName = { ...validMetadata, name: 123 };
			const invalidDescription = { ...validMetadata, description: 123 };
			const invalidCategory = { ...validMetadata, category: 123 };
			const invalidLinks = { ...validMetadata, links: "not an array" };
			const invalidIcon = { ...validMetadata, icon: "not an array" };
			const invalidImages = { ...validMetadata, images: "not an array" };
			const invalidAssets = { ...validMetadata, assets: "not an array" };
			const invalidAttributes = {
				...validMetadata,
				attributes: "not an array",
			};

			expect(isLsp4MetadataSchema(invalidName)).toBe(false);
			expect(isLsp4MetadataSchema(invalidDescription)).toBe(false);
			expect(isLsp4MetadataSchema(invalidCategory)).toBe(false);
			expect(isLsp4MetadataSchema(invalidLinks)).toBe(false);
			expect(isLsp4MetadataSchema(invalidIcon)).toBe(false);
			expect(isLsp4MetadataSchema(invalidImages)).toBe(false);
			expect(isLsp4MetadataSchema(invalidAssets)).toBe(false);
			expect(isLsp4MetadataSchema(invalidAttributes)).toBe(false);
		});

		it("should return false for invalid array contents", () => {
			const invalidLinkContent = {
				...validMetadata,
				links: [{ title: "test" }], // missing url
			};

			const invalidAttributeContent = {
				...validMetadata,
				attributes: [{ key: "test" }], // missing value and type
			};

			expect(isLsp4MetadataSchema(invalidLinkContent)).toBe(false);
			expect(isLsp4MetadataSchema(invalidAttributeContent)).toBe(false);
		});
	});

	describe("nested array validation", () => {
		it("should return true for valid nested image arrays", () => {
			const multipleImageSets = {
				...validMetadata,
				images: [
					[
						{
							url: "https://example.com/image1.png",
							width: 1024,
							height: 768,
							verification: validVerification,
						},
					],
					[
						{
							url: "https://example.com/image2.png",
							width: 512,
							height: 384,
							verification: validVerification,
						},
						{
							url: "https://example.com/image3.png",
							width: 256,
							height: 192,
							verification: validVerification,
						},
					],
				],
			};
			expect(isLsp4MetadataSchema(multipleImageSets)).toBe(true);
		});

		it("should return false for invalid nested image structure", () => {
			const invalidNestedImages = {
				...validMetadata,
				images: [
					"not an array", // should be array of images
				],
			};
			expect(isLsp4MetadataSchema(invalidNestedImages)).toBe(false);
		});
	});

	it("should return false for non-objects", () => {
		expect(isLsp4MetadataSchema(null)).toBe(false);
		expect(isLsp4MetadataSchema(undefined)).toBe(false);
		expect(isLsp4MetadataSchema("string")).toBe(false);
		expect(isLsp4MetadataSchema(123)).toBe(false);
		expect(isLsp4MetadataSchema([])).toBe(false);
		expect(isLsp4MetadataSchema(true)).toBe(false);
	});
});
