/**
 * ERC725Y / LSP17 Utility Tests
 *
 * Tests for LSP17 extension key builders, hex comparison,
 * and ERC725Y getData functions.
 */

import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import {
	buildLsp17ExtensionKey,
	extractLsp17ExtensionKeys,
	extractSelectorFromLsp17ExtensionKey,
	getData,
	isHexEqual,
} from "./erc725y";

// ============================================================================
// Constants
// ============================================================================

/**
 * LSP17 extension prefix (12 bytes)
 * @see https://docs.lukso.tech/standards/generic-standards/lsp17-contract-extension
 */
const LSP17_PREFIX = "0xcee78b4094da860110960000";

// ============================================================================
// buildLsp17ExtensionKey Tests
// ============================================================================

describe("buildLsp17ExtensionKey", () => {
	it("should produce a 32-byte key with prefix + selector", () => {
		const selector = "0x8b159099" as Hex;
		const key = buildLsp17ExtensionKey(selector);

		// 32 bytes = 64 hex chars + "0x" = 66 chars
		expect(key).toHaveLength(66);

		// Should start with LSP17 prefix
		expect(key.startsWith(LSP17_PREFIX)).toBe(true);

		// Should contain the selector after the prefix
		expect(key.slice(26, 34)).toBe("8b159099");
	});

	it("should right-pad with zeros", () => {
		const key = buildLsp17ExtensionKey("0xaabbccdd" as Hex);
		// Last 32 chars should be zeros (16 bytes of padding)
		expect(key.slice(34)).toBe("00000000000000000000000000000000");
	});

	it("should produce different keys for different selectors", () => {
		const key1 = buildLsp17ExtensionKey("0x11111111" as Hex);
		const key2 = buildLsp17ExtensionKey("0x22222222" as Hex);
		expect(key1).not.toBe(key2);
	});
});

// ============================================================================
// extractSelectorFromLsp17ExtensionKey Tests
// ============================================================================

describe("extractSelectorFromLsp17ExtensionKey", () => {
	it("should extract the correct 4-byte selector", () => {
		const selector = "0x8b159099" as Hex;
		const key = buildLsp17ExtensionKey(selector);
		const extracted = extractSelectorFromLsp17ExtensionKey(key);
		expect(extracted).toBe(selector);
	});

	it("should roundtrip with buildLsp17ExtensionKey", () => {
		const selectors = [
			"0xaabbccdd",
			"0x00000000",
			"0xffffffff",
			"0x12345678",
		] as Hex[];
		for (const selector of selectors) {
			const key = buildLsp17ExtensionKey(selector);
			expect(extractSelectorFromLsp17ExtensionKey(key)).toBe(selector);
		}
	});
});

// ============================================================================
// extractLsp17ExtensionKeys Tests
// ============================================================================

describe("extractLsp17ExtensionKeys", () => {
	it("should filter to only LSP17-prefixed keys", () => {
		const lsp17Key = buildLsp17ExtensionKey("0x8b159099" as Hex);
		const lsp6Key =
			"0x4b80742de2bf82acb3630000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hex;
		const otherKey =
			"0x0000000000000000000000000000000000000000000000000000000000000001" as Hex;

		const result = extractLsp17ExtensionKeys([lsp17Key, lsp6Key, otherKey]);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(lsp17Key);
	});

	it("should return empty array when no LSP17 keys", () => {
		const keys = [
			"0x4b80742de2bf82acb3630000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hex,
		];
		expect(extractLsp17ExtensionKeys(keys)).toHaveLength(0);
	});

	it("should return all keys when all are LSP17", () => {
		const keys = [
			buildLsp17ExtensionKey("0x11111111" as Hex),
			buildLsp17ExtensionKey("0x22222222" as Hex),
		];
		expect(extractLsp17ExtensionKeys(keys)).toHaveLength(2);
	});

	it("should handle empty array", () => {
		expect(extractLsp17ExtensionKeys([])).toHaveLength(0);
	});
});

// ============================================================================
// isHexEqual Tests
// ============================================================================

describe("isHexEqual", () => {
	it("should return true for case-insensitive match", () => {
		expect(isHexEqual("0xAbCdEf" as Hex, "0xabcdef" as Hex)).toBe(true);
		expect(isHexEqual("0xABCDEF" as Hex, "0xabcdef" as Hex)).toBe(true);
	});

	it("should return false for different values", () => {
		expect(isHexEqual("0x1234" as Hex, "0x5678" as Hex)).toBe(false);
	});

	it("should return true for identical values", () => {
		expect(isHexEqual("0xabc" as Hex, "0xabc" as Hex)).toBe(true);
	});
});

// ============================================================================
// getData Tests
// ============================================================================

describe("getData", () => {
	const contractAddress =
		"0x1234567890abcdef1234567890abcdef12345678" as Address;

	it("should call readContract with getData for single key", async () => {
		const mockClient = {
			readContract: vi.fn().mockResolvedValue("0xdeadbeef" as Hex),
		};

		const result = await getData(
			mockClient,
			contractAddress,
			"0xaabbccdd" as Hex,
		);

		expect(result).toBe("0xdeadbeef");
		expect(mockClient.readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address: contractAddress,
				functionName: "getData",
				args: ["0xaabbccdd"],
			}),
		);
	});

	it("should call readContract with getDataBatch for array", async () => {
		const mockClient = {
			readContract: vi.fn().mockResolvedValue(["0xaa" as Hex, "0xbb" as Hex]),
		};
		const dataKeys = ["0x1111" as Hex, "0x2222" as Hex];

		const result = await getData(mockClient, contractAddress, dataKeys);

		expect(result).toEqual(["0xaa", "0xbb"]);
		expect(mockClient.readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: "getDataBatch",
				args: [dataKeys],
			}),
		);
	});

	it("should return empty array for empty keys array", async () => {
		const mockClient = {
			readContract: vi.fn(),
		};

		const result = await getData(mockClient, contractAddress, []);
		expect(result).toEqual([]);
		expect(mockClient.readContract).not.toHaveBeenCalled();
	});

	it("should wrap errors with context", async () => {
		const mockClient = {
			readContract: vi.fn().mockRejectedValue(new Error("RPC failure")),
		};

		await expect(
			getData(mockClient, contractAddress, "0xaabb" as Hex),
		).rejects.toThrow("Failed to read data key 0xaabb: RPC failure");
	});

	it("should wrap errors for batch reads", async () => {
		const mockClient = {
			readContract: vi.fn().mockRejectedValue(new Error("timeout")),
		};

		await expect(
			getData(mockClient, contractAddress, ["0x11" as Hex, "0x22" as Hex]),
		).rejects.toThrow("Failed to read 2 data keys: timeout");
	});
});
