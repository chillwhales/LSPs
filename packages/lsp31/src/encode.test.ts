import { type Hex, hexToString, keccak256 } from "viem";
import { describe, expect, it } from "vitest";

import { computeContentHash, encodeLsp31Uri } from "./encode";

// ============================================================================
// Test Data
// ============================================================================

const testEntries = [
	{
		backend: "ipfs" as const,
		cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
	},
	{
		backend: "s3" as const,
		bucket: "my-bucket",
		key: "content/file.bin",
		region: "us-east-1",
	},
];

const testContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
const testContentHash = keccak256(testContent);

// ============================================================================
// encodeLsp31Uri Tests
// ============================================================================

describe("encodeLsp31Uri", () => {
	it("should produce hex starting with 0x0031", () => {
		const encoded = encodeLsp31Uri(testEntries, testContentHash);
		expect(encoded.startsWith("0x0031")).toBe(true);
	});

	it("should contain correct method ID 0x8019f9b1 at bytes 2-6", () => {
		const encoded = encodeLsp31Uri(testEntries, testContentHash);
		// bytes 2-6 = hex chars 6-14 (after '0x' prefix, each byte = 2 hex chars)
		const methodId = encoded.slice(6, 14);
		expect(methodId).toBe("8019f9b1");
	});

	it("should contain hash length prefix 0x0020 at bytes 6-8", () => {
		const encoded = encodeLsp31Uri(testEntries, testContentHash);
		const hashLength = encoded.slice(14, 18);
		expect(hashLength).toBe("0020");
	});

	it("should embed the provided verification hash at bytes 8-40", () => {
		const encoded = encodeLsp31Uri(testEntries, testContentHash);
		const embeddedHash = `0x${encoded.slice(18, 82)}` as Hex;
		expect(embeddedHash.toLowerCase()).toBe(testContentHash.toLowerCase());
	});

	it("should encode entries JSON as UTF-8 hex after byte 40", () => {
		const encoded = encodeLsp31Uri(testEntries, testContentHash);
		const entriesHex = `0x${encoded.slice(82)}` as Hex;
		const decodedEntries = JSON.parse(hexToString(entriesHex));
		expect(decodedEntries).toEqual(testEntries);
	});

	it("should reject entries with fewer than 2 items", () => {
		const singleEntry = [{ backend: "ipfs" as const, cid: "QmSingle" }];
		expect(() => encodeLsp31Uri(singleEntry, testContentHash)).toThrow();
	});

	it("should reject invalid verification hash format", () => {
		expect(() => encodeLsp31Uri(testEntries, "0xshort" as Hex)).toThrow();
	});

	it("should work with all 4 backend types", () => {
		const allBackends = [
			{ backend: "ipfs" as const, cid: "QmTest" },
			{ backend: "s3" as const, bucket: "b", key: "k", region: "r" },
			{ backend: "lumera" as const, actionId: "action-1" },
			{ backend: "arweave" as const, transactionId: "tx-1" },
		];
		const encoded = encodeLsp31Uri(allBackends, testContentHash);
		expect(encoded.startsWith("0x0031")).toBe(true);
	});
});

// ============================================================================
// computeContentHash Tests
// ============================================================================

describe("computeContentHash", () => {
	it("should compute keccak256 of Uint8Array content", () => {
		const hash = computeContentHash(testContent);
		expect(hash).toBe(testContentHash);
	});

	it("should produce different hashes for different content", () => {
		const content1 = new Uint8Array([1, 2, 3]);
		const content2 = new Uint8Array([4, 5, 6]);
		const hash1 = computeContentHash(content1);
		const hash2 = computeContentHash(content2);
		expect(hash1).not.toBe(hash2);
	});

	it("should produce consistent hash for same content", () => {
		const hash1 = computeContentHash(testContent);
		const hash2 = computeContentHash(testContent);
		expect(hash1).toBe(hash2);
	});
});
