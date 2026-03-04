/**
 * LSP17 Extension Key Utility Tests
 *
 * Tests for LSP17 extension key builders and selectors.
 */

import { LSP17DataKeys } from "@lukso/lsp17contractextension-contracts";
import { describe, expect, it } from "vitest";
import {
	buildExtensionKey,
	extractSelectorFromExtensionKey,
	filterExtensionKeys,
} from "./extensions";

// ============================================================================
// buildExtensionKey Tests
// ============================================================================

describe("buildExtensionKey", () => {
	it("should produce a 32-byte key with prefix + selector", () => {
		const key = buildExtensionKey("0x8b159099");

		// 32 bytes = 64 hex chars + "0x" = 66 chars
		expect(key).toHaveLength(66);

		// Should start with LSP17 prefix
		expect(key.startsWith(LSP17DataKeys.LSP17ExtensionPrefix)).toBe(true);

		// Should contain the selector after the prefix
		expect(key.slice(26, 34)).toBe("8b159099");
	});

	it("should right-pad with zeros", () => {
		const key = buildExtensionKey("0xaabbccdd");
		// Last 32 chars should be zeros (16 bytes of padding)
		expect(key.slice(34)).toBe("00000000000000000000000000000000");
	});

	it("should produce different keys for different selectors", () => {
		const key1 = buildExtensionKey("0x11111111");
		const key2 = buildExtensionKey("0x22222222");
		expect(key1).not.toBe(key2);
	});
});

// ============================================================================
// extractSelectorFromExtensionKey Tests
// ============================================================================

describe("extractSelectorFromExtensionKey", () => {
	it("should extract the correct 4-byte selector", () => {
		const key = buildExtensionKey("0x8b159099");
		const extracted = extractSelectorFromExtensionKey(key);
		expect(extracted).toBe("0x8b159099");
	});

	it("should roundtrip with buildExtensionKey", () => {
		const selectors = ["0xaabbccdd", "0x00000000", "0xffffffff", "0x12345678"];
		for (const selector of selectors) {
			const key = buildExtensionKey(selector);
			expect(extractSelectorFromExtensionKey(key)).toBe(selector);
		}
	});
});

// ============================================================================
// filterExtensionKeys Tests
// ============================================================================

describe("filterExtensionKeys", () => {
	it("should filter to only LSP17-prefixed keys", () => {
		const lsp17Key = buildExtensionKey("0x8b159099");
		const lsp6Key =
			"0x4b80742de2bf82acb3630000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		const otherKey =
			"0x0000000000000000000000000000000000000000000000000000000000000001";

		const result = filterExtensionKeys([lsp17Key, lsp6Key, otherKey]);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(lsp17Key);
	});

	it("should return empty array when no LSP17 keys", () => {
		const keys = [
			"0x4b80742de2bf82acb3630000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		];
		expect(filterExtensionKeys(keys)).toHaveLength(0);
	});

	it("should return all keys when all are LSP17", () => {
		const keys = [
			buildExtensionKey("0x11111111"),
			buildExtensionKey("0x22222222"),
		];
		expect(filterExtensionKeys(keys)).toHaveLength(2);
	});

	it("should handle empty array", () => {
		expect(filterExtensionKeys([])).toHaveLength(0);
	});
});
