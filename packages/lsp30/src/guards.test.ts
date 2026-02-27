import { type Hex, keccak256 } from "viem";
import { describe, expect, it } from "vitest";

import { encodeLsp30Uri } from "./encode";
import { isLsp30Uri } from "./guards";

// ============================================================================
// Test Data
// ============================================================================

const testEntries = [
	{ backend: "ipfs" as const, cid: "QmTest123" },
	{ backend: "s3" as const, bucket: "b", key: "k", region: "r" },
];

const testContent = new Uint8Array([72, 101, 108, 108, 111]);
const testContentHash = keccak256(testContent);
const validLsp30 = encodeLsp30Uri(testEntries, testContentHash);

// ============================================================================
// isLsp30Uri Tests
// ============================================================================

describe("isLsp30Uri", () => {
	it("should return true for valid LSP30-encoded hex", () => {
		expect(isLsp30Uri(validLsp30)).toBe(true);
	});

	it("should return false for LSP2-encoded hex (0x0000 prefix)", () => {
		const lsp2Value =
			"0x00008019f9b100200000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;
		expect(isLsp30Uri(lsp2Value)).toBe(false);
	});

	it("should return false for hex too short", () => {
		expect(isLsp30Uri("0x0030" as Hex)).toBe(false);
		expect(isLsp30Uri("0x00308019f9b1" as Hex)).toBe(false);
	});

	it("should return false for arbitrary hex without 0x0030 prefix", () => {
		const arbitraryHex =
			"0xffff8019f9b100200000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;
		expect(isLsp30Uri(arbitraryHex)).toBe(false);
	});

	it("should return false for empty hex", () => {
		expect(isLsp30Uri("0x" as Hex)).toBe(false);
	});
});
