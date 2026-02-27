/**
 * LSP29 Encode Utilities Tests
 *
 * Tests for ERC725Y data key computation functions.
 * Ported from packages/utils/src/lsp29.test.ts, adapted for v2.0.0 package.
 */

import { encodePacked, keccak256, toHex } from "viem";
import { describe, expect, it } from "vitest";

import {
	computeLsp29ArrayIndexKey,
	computeLsp29MapKey,
	computeLsp29MapKeyVersioned,
	computeLsp29RevisionCountKey,
} from "./encode";

describe("computeLsp29ArrayIndexKey", () => {
	it("should compute key for index 0", () => {
		const key = computeLsp29ArrayIndexKey(0);
		expect(key).toBe(
			"0x1965f98377ddff08e78c93d820cc8de400000000000000000000000000000000",
		);
	});

	it("should compute key for index 1", () => {
		const key = computeLsp29ArrayIndexKey(1);
		expect(key).toBe(
			"0x1965f98377ddff08e78c93d820cc8de400000000000000000000000000000001",
		);
	});

	it("should compute key for large index", () => {
		const key = computeLsp29ArrayIndexKey(1000);
		expect(key).toBe(
			"0x1965f98377ddff08e78c93d820cc8de4000000000000000000000000000003e8",
		);
	});

	it("should return 32-byte key", () => {
		const key = computeLsp29ArrayIndexKey(0);
		expect(key.length).toBe(66); // 0x + 64 hex chars
	});

	it("should throw for negative index", () => {
		expect(() => computeLsp29ArrayIndexKey(-1)).toThrow(
			"Index must be a non-negative integer",
		);
	});

	it("should throw for non-integer index", () => {
		expect(() => computeLsp29ArrayIndexKey(1.5)).toThrow();
	});

	it("should handle BigInt input", () => {
		const key = computeLsp29ArrayIndexKey(BigInt(5));
		expect(key).toMatch(/^0x1965f98377ddff08e78c93d820cc8de4/);
		expect(key.length).toBe(66);
	});

	it("should handle very large indices", () => {
		const key = computeLsp29ArrayIndexKey(Number.MAX_SAFE_INTEGER);
		expect(key).toMatch(/^0x1965f98377ddff08e78c93d820cc8de4/);
		expect(key.length).toBe(66);
	});
});

describe("computeLsp29MapKey", () => {
	it("should compute key with correct prefix", () => {
		const key = computeLsp29MapKey("premium-content");
		expect(key.startsWith("0x2b9a7a38a67cedc507c20000")).toBe(true);
	});

	it("should return 32-byte key", () => {
		const key = computeLsp29MapKey("premium-content");
		expect(key.length).toBe(66);
	});

	it("should produce different keys for different content IDs", () => {
		const key1 = computeLsp29MapKey("content-1");
		const key2 = computeLsp29MapKey("content-2");
		expect(key1).not.toBe(key2);
	});

	it("should produce same key for same content ID", () => {
		const key1 = computeLsp29MapKey("premium-content");
		const key2 = computeLsp29MapKey("premium-content");
		expect(key1).toBe(key2);
	});

	it("should handle empty string", () => {
		const key = computeLsp29MapKey("");
		expect(key.length).toBe(66);
		expect(key.startsWith("0x2b9a7a38a67cedc507c20000")).toBe(true);
	});

	it("should use first 20 bytes of keccak256 hash", () => {
		const contentId = "test-content";
		const key = computeLsp29MapKey(contentId);

		const contentIdBytes = toHex(contentId);
		const hash = keccak256(contentIdBytes);
		const expectedSuffix = hash.slice(0, 42); // 0x + 40 chars = 20 bytes

		expect(key.slice(26)).toBe(expectedSuffix.slice(2));
	});
});

describe("computeLsp29MapKeyVersioned", () => {
	it("should compute key with correct prefix", () => {
		const key = computeLsp29MapKeyVersioned("premium-content", 1);
		expect(key.startsWith("0x2b9a7a38a67cedc507c20000")).toBe(true);
	});

	it("should return 32-byte key", () => {
		const key = computeLsp29MapKeyVersioned("premium-content", 1);
		expect(key.length).toBe(66);
	});

	it("should produce different keys for different revisions", () => {
		const keyV1 = computeLsp29MapKeyVersioned("premium-content", 1);
		const keyV2 = computeLsp29MapKeyVersioned("premium-content", 2);
		expect(keyV1).not.toBe(keyV2);
	});

	it("should produce different key than non-versioned map key", () => {
		const latestKey = computeLsp29MapKey("premium-content");
		const versionedKey = computeLsp29MapKeyVersioned("premium-content", 1);
		expect(latestKey).not.toBe(versionedKey);
	});

	it("should throw for revision 0", () => {
		expect(() => computeLsp29MapKeyVersioned("content", 0)).toThrow(
			"Revision must be a positive integer",
		);
	});

	it("should throw for negative revision", () => {
		expect(() => computeLsp29MapKeyVersioned("content", -1)).toThrow(
			"Revision must be a positive integer",
		);
	});

	it("should throw for non-integer revision", () => {
		expect(() => computeLsp29MapKeyVersioned("content", 1.5)).toThrow(
			"Revision must be a positive integer",
		);
	});

	it("should use abi.encodePacked for hash input", () => {
		const contentId = "test-content";
		const revision = 1;
		const key = computeLsp29MapKeyVersioned(contentId, revision);

		const packed = encodePacked(["string", "uint32"], [contentId, revision]);
		const hash = keccak256(packed);
		const expectedSuffix = hash.slice(0, 42);

		expect(key.slice(26)).toBe(expectedSuffix.slice(2));
	});

	it("should handle large revision numbers", () => {
		const key = computeLsp29MapKeyVersioned("content", 4294967295);
		expect(key.length).toBe(66);
		expect(key.startsWith("0x2b9a7a38a67cedc507c20000")).toBe(true);
	});
});

describe("computeLsp29RevisionCountKey", () => {
	it("should compute key with correct prefix", () => {
		const key = computeLsp29RevisionCountKey("premium-content");
		expect(key.startsWith("0xb41f63e335c22bded8140000")).toBe(true);
	});

	it("should return 32-byte key", () => {
		const key = computeLsp29RevisionCountKey("premium-content");
		expect(key.length).toBe(66);
	});

	it("should produce different keys for different content IDs", () => {
		const key1 = computeLsp29RevisionCountKey("content-1");
		const key2 = computeLsp29RevisionCountKey("content-2");
		expect(key1).not.toBe(key2);
	});

	it("should produce same key for same content ID", () => {
		const key1 = computeLsp29RevisionCountKey("premium-content");
		const key2 = computeLsp29RevisionCountKey("premium-content");
		expect(key1).toBe(key2);
	});

	it("should use same hash suffix as map key (different prefix)", () => {
		const contentId = "test-content";
		const mapKey = computeLsp29MapKey(contentId);
		const countKey = computeLsp29RevisionCountKey(contentId);

		expect(mapKey.slice(26)).toBe(countKey.slice(26));
		expect(mapKey.slice(0, 26)).not.toBe(countKey.slice(0, 26));
	});
});

describe("Key Uniqueness", () => {
	it("should produce unique keys for different operations on same content", () => {
		const contentId = "test-content";
		const latestMapKey = computeLsp29MapKey(contentId);
		const versionedMapKey = computeLsp29MapKeyVersioned(contentId, 1);
		const revisionCountKey = computeLsp29RevisionCountKey(contentId);
		const arrayIndexKey = computeLsp29ArrayIndexKey(0);

		const keys = new Set([
			latestMapKey,
			versionedMapKey,
			revisionCountKey,
			arrayIndexKey,
		]);
		expect(keys.size).toBe(4);
	});
});
