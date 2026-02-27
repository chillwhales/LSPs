/**
 * LSP3 Type Guard Tests
 *
 * Tests for runtime type guard validation of LSP3 profile schema.
 * Validates both positive cases (valid profiles) and negative cases
 * (missing fields, wrong types, etc.).
 */

import { VERIFICATION_METHODS } from "@chillwhales/lsp2";
import { describe, expect, it } from "vitest";
import { isLsp3ProfileSchema } from "./guards";
import type { LSP3Profile } from "./types";

// ============================================================================
// Test Fixtures
// ============================================================================

const validVerification = {
	data: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

const validImage = {
	url: "https://example.com/image.png",
	width: 1024,
	height: 768,
	verification: validVerification,
};

const validAsset = {
	url: "https://example.com/asset.pdf",
	fileType: "application/pdf",
	verification: validVerification,
};

const validLink = {
	title: "Example Link",
	url: "https://example.com",
};

const validLsp3Profile: LSP3Profile = {
	name: "John Doe",
	description: "A Universal Profile user",
	tags: ["developer", "blockchain"],
	links: [validLink],
	avatar: [validAsset],
	profileImage: [validImage],
	backgroundImage: [validImage],
};

const minimalValidProfile: LSP3Profile = {
	name: null,
	description: null,
	tags: [],
	links: [],
	avatar: [],
	profileImage: [],
	backgroundImage: [],
};

// ============================================================================
// isLsp3ProfileSchema Tests
// ============================================================================

describe("isLsp3ProfileSchema", () => {
	it("should return true for valid complete LSP3 profile objects", () => {
		expect(isLsp3ProfileSchema(validLsp3Profile)).toBe(true);
	});

	it("should return true for minimal valid profiles with empty arrays and null values", () => {
		expect(isLsp3ProfileSchema(minimalValidProfile)).toBe(true);
	});

	it("should return true for profiles with nullable name and description", () => {
		const profileWithNulls = {
			...validLsp3Profile,
			name: null,
			description: null,
		};
		expect(isLsp3ProfileSchema(profileWithNulls)).toBe(true);
	});

	it("should return true for profiles with various tag types", () => {
		const profileWithDifferentTags = {
			...validLsp3Profile,
			tags: ["art", "nft", "digital-asset", "music", "123", ""],
		};
		expect(isLsp3ProfileSchema(profileWithDifferentTags)).toBe(true);
	});

	it("should return true for profiles with multiple links, assets, and images", () => {
		const profileWithMultiples = {
			...validLsp3Profile,
			links: [validLink, { title: "Another Link", url: "https://another.com" }],
			avatar: [
				validAsset,
				{ ...validAsset, url: "https://example.com/another.pdf" },
			],
			profileImage: [
				validImage,
				{ ...validImage, url: "https://example.com/another.png" },
			],
			backgroundImage: [validImage],
		};
		expect(isLsp3ProfileSchema(profileWithMultiples)).toBe(true);
	});

	it("should return false for objects missing required fields", () => {
		const missingName = { ...validLsp3Profile };
		delete (missingName as any).name;

		const missingDescription = { ...validLsp3Profile };
		delete (missingDescription as any).description;

		const missingTags = { ...validLsp3Profile };
		delete (missingTags as any).tags;

		const missingLinks = { ...validLsp3Profile };
		delete (missingLinks as any).links;

		const missingAvatar = { ...validLsp3Profile };
		delete (missingAvatar as any).avatar;

		const missingProfileImage = { ...validLsp3Profile };
		delete (missingProfileImage as any).profileImage;

		const missingBackgroundImage = { ...validLsp3Profile };
		delete (missingBackgroundImage as any).backgroundImage;

		expect(isLsp3ProfileSchema(missingName)).toBe(false);
		expect(isLsp3ProfileSchema(missingDescription)).toBe(false);
		expect(isLsp3ProfileSchema(missingTags)).toBe(false);
		expect(isLsp3ProfileSchema(missingLinks)).toBe(false);
		expect(isLsp3ProfileSchema(missingAvatar)).toBe(false);
		expect(isLsp3ProfileSchema(missingProfileImage)).toBe(false);
		expect(isLsp3ProfileSchema(missingBackgroundImage)).toBe(false);
	});

	it("should return false for objects with invalid field types", () => {
		const invalidName = { ...validLsp3Profile, name: 123 };
		const invalidDescription = { ...validLsp3Profile, description: 123 };
		const invalidTags = { ...validLsp3Profile, tags: "not an array" };
		const invalidLinks = { ...validLsp3Profile, links: "not an array" };
		const invalidAvatar = { ...validLsp3Profile, avatar: "not an array" };
		const invalidProfileImage = {
			...validLsp3Profile,
			profileImage: "not an array",
		};
		const invalidBackgroundImage = {
			...validLsp3Profile,
			backgroundImage: "not an array",
		};

		expect(isLsp3ProfileSchema(invalidName)).toBe(false);
		expect(isLsp3ProfileSchema(invalidDescription)).toBe(false);
		expect(isLsp3ProfileSchema(invalidTags)).toBe(false);
		expect(isLsp3ProfileSchema(invalidLinks)).toBe(false);
		expect(isLsp3ProfileSchema(invalidAvatar)).toBe(false);
		expect(isLsp3ProfileSchema(invalidProfileImage)).toBe(false);
		expect(isLsp3ProfileSchema(invalidBackgroundImage)).toBe(false);
	});

	it("should return false for arrays with invalid items", () => {
		const invalidTags = { ...validLsp3Profile, tags: [123, "valid", null] };
		const invalidLinks = {
			...validLsp3Profile,
			links: [{ invalidField: "value" }],
		};
		const invalidAvatar = {
			...validLsp3Profile,
			avatar: [{ invalidField: "value" }],
		};
		const invalidProfileImage = {
			...validLsp3Profile,
			profileImage: [{ invalidField: "value" }],
		};
		const invalidBackgroundImage = {
			...validLsp3Profile,
			backgroundImage: [{ invalidField: "value" }],
		};

		expect(isLsp3ProfileSchema(invalidTags)).toBe(false);
		expect(isLsp3ProfileSchema(invalidLinks)).toBe(false);
		expect(isLsp3ProfileSchema(invalidAvatar)).toBe(false);
		expect(isLsp3ProfileSchema(invalidProfileImage)).toBe(false);
		expect(isLsp3ProfileSchema(invalidBackgroundImage)).toBe(false);
	});

	it("should return false for non-objects", () => {
		expect(isLsp3ProfileSchema(null)).toBe(false);
		expect(isLsp3ProfileSchema(undefined)).toBe(false);
		expect(isLsp3ProfileSchema("string")).toBe(false);
		expect(isLsp3ProfileSchema(123)).toBe(false);
		expect(isLsp3ProfileSchema([])).toBe(false);
		expect(isLsp3ProfileSchema(true)).toBe(false);
	});

	it("should return false for empty objects", () => {
		expect(isLsp3ProfileSchema({})).toBe(false);
	});
});
