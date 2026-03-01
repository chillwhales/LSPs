import { type Hex, keccak256 } from "viem";
import { describe, expect, it } from "vitest";

import { encodeLsp31Uri } from "./encode";
import { isLsp31Uri } from "./guards";

// ============================================================================
// Test Data
// ============================================================================

const testEntries = [
	{ backend: "ipfs" as const, cid: "QmTest123" },
	{ backend: "s3" as const, bucket: "b", key: "k", region: "r" },
];

const testContent = new Uint8Array([72, 101, 108, 108, 111]);
const testContentHash = keccak256(testContent);
const validLsp31 = encodeLsp31Uri(testEntries, testContentHash);

// ============================================================================
// isLsp31Uri Tests
// ============================================================================

describe("isLsp31Uri", () => {
	it("should return true for valid LSP31-encoded hex", () => {
		expect(isLsp31Uri(validLsp31)).toBe(true);
	});

	it("should return false for LSP2-encoded hex (0x0000 prefix)", () => {
		const lsp2Value =
			"0x00008019f9b100200000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;
		expect(isLsp31Uri(lsp2Value)).toBe(false);
	});

	it("should return false for hex too short", () => {
		expect(isLsp31Uri("0x0031" as Hex)).toBe(false);
		expect(isLsp31Uri("0x00318019f9b1" as Hex)).toBe(false);
	});

	it("should return false for arbitrary hex without 0x0031 prefix", () => {
		const arbitraryHex =
			"0xffff8019f9b100200000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;
		expect(isLsp31Uri(arbitraryHex)).toBe(false);
	});

	it("should return false for empty hex", () => {
		expect(isLsp31Uri("0x" as Hex)).toBe(false);
	});
});
