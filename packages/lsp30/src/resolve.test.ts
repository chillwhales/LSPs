import { describe, expect, it } from "vitest";

import { resolveUrl, selectBackend } from "./resolve";
import type { Lsp30Entry } from "./types";

// ============================================================================
// Test Data
// ============================================================================

const allEntries: Lsp30Entry[] = [
	{ backend: "ipfs", cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" },
	{
		backend: "s3",
		bucket: "my-bucket",
		key: "content/file.bin",
		region: "us-east-1",
	},
	{ backend: "lumera", actionId: "action-123" },
	{ backend: "arweave", transactionId: "tx-abc-def" },
];

// ============================================================================
// selectBackend Tests
// ============================================================================

describe("selectBackend", () => {
	it("should return entries in original array order when no preference (undefined)", () => {
		const result = selectBackend(allEntries);
		expect(result).toEqual(allEntries);
		// Should be a copy, not the same reference
		expect(result).not.toBe(allEntries);
	});

	it('should put ipfs entry first when preference is "ipfs"', () => {
		const result = selectBackend(allEntries, "ipfs");
		expect(result[0]).toEqual({
			backend: "ipfs",
			cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
		});
		expect(result.length).toBe(allEntries.length);
	});

	it("should return all entries in original order when string preference has no match", () => {
		// Only ipfs and s3 entries, preference for arweave
		const entries: Lsp30Entry[] = [
			{ backend: "ipfs", cid: "QmTest" },
			{ backend: "s3", bucket: "b", key: "k", region: "r" },
		];
		const result = selectBackend(entries, "arweave");
		expect(result).toEqual(entries);
		expect(result.length).toBe(entries.length);
	});

	it("should order by array preference: lumera first, ipfs second, then remaining", () => {
		const result = selectBackend(allEntries, ["lumera", "ipfs"]);
		expect(result[0]).toEqual({ backend: "lumera", actionId: "action-123" });
		expect(result[1]).toEqual({
			backend: "ipfs",
			cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
		});
		// Remaining entries in original order
		expect(result[2]).toEqual({
			backend: "s3",
			bucket: "my-bucket",
			key: "content/file.bin",
			region: "us-east-1",
		});
		expect(result[3]).toEqual({
			backend: "arweave",
			transactionId: "tx-abc-def",
		});
		expect(result.length).toBe(allEntries.length);
	});

	it("should skip missing backends in preference and include present ones in order", () => {
		const entries: Lsp30Entry[] = [
			{ backend: "ipfs", cid: "QmTest" },
			{ backend: "s3", bucket: "b", key: "k", region: "r" },
		];
		// Preference for arweave (missing) and ipfs (present)
		const result = selectBackend(entries, ["arweave", "ipfs"]);
		expect(result[0]).toEqual({ backend: "ipfs", cid: "QmTest" });
		expect(result[1]).toEqual({
			backend: "s3",
			bucket: "b",
			key: "k",
			region: "r",
		});
		expect(result.length).toBe(entries.length);
	});

	it("should never drop entries — output always has same length as input", () => {
		const testCases: [Lsp30Entry[], Parameters<typeof selectBackend>[1]][] = [
			[allEntries, undefined],
			[allEntries, "ipfs"],
			[allEntries, "arweave"],
			[allEntries, ["lumera", "ipfs"]],
			[allEntries, ["arweave", "s3", "lumera", "ipfs"]],
			[allEntries, []],
		];

		for (const [entries, pref] of testCases) {
			const result = selectBackend(entries, pref);
			expect(result.length).toBe(entries.length);
		}
	});

	it("should treat empty preference array same as undefined", () => {
		const result = selectBackend(allEntries, []);
		expect(result).toEqual(allEntries);
	});

	it("should handle two entries of same backend type", () => {
		const dupes: Lsp30Entry[] = [
			{ backend: "ipfs", cid: "QmFirst" },
			{ backend: "ipfs", cid: "QmSecond" },
			{ backend: "s3", bucket: "b", key: "k", region: "r" },
		];
		const result = selectBackend(dupes, "ipfs");
		// Both ipfs entries should come first, preserving their relative order
		expect(result[0]).toEqual({ backend: "ipfs", cid: "QmFirst" });
		expect(result[1]).toEqual({ backend: "ipfs", cid: "QmSecond" });
		expect(result[2]).toEqual({
			backend: "s3",
			bucket: "b",
			key: "k",
			region: "r",
		});
		expect(result.length).toBe(dupes.length);
	});
});

// ============================================================================
// resolveUrl Tests
// ============================================================================

describe("resolveUrl", () => {
	it("should return ipfs:// protocol URL for IPFS entry", () => {
		const entry: Lsp30Entry = {
			backend: "ipfs",
			cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
		};
		const url = resolveUrl(entry);
		expect(url).toBe("ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG");
	});

	it("should return virtual-hosted S3 URL for S3 entry", () => {
		const entry: Lsp30Entry = {
			backend: "s3",
			bucket: "my-bucket",
			key: "content/file.bin",
			region: "us-east-1",
		};
		const url = resolveUrl(entry);
		expect(url).toBe(
			"https://my-bucket.s3.us-east-1.amazonaws.com/content%2Ffile.bin",
		);
	});

	it("should URL-encode special characters in S3 keys", () => {
		const entry: Lsp30Entry = {
			backend: "s3",
			bucket: "my-bucket",
			key: "path/to/my file (1).bin",
			region: "us-east-1",
		};
		const url = resolveUrl(entry);
		expect(url).toBe(
			"https://my-bucket.s3.us-east-1.amazonaws.com/path%2Fto%2Fmy%20file%20(1).bin",
		);
	});

	it("should return lumera:// protocol URL for Lumera entry", () => {
		const entry: Lsp30Entry = { backend: "lumera", actionId: "action-123" };
		const url = resolveUrl(entry);
		expect(url).toBe("lumera://action-123");
	});

	it("should return arweave.net gateway URL for Arweave entry", () => {
		const entry: Lsp30Entry = {
			backend: "arweave",
			transactionId: "ABCDEF123456",
		};
		const url = resolveUrl(entry);
		expect(url).toBe("https://arweave.net/ABCDEF123456");
	});

	it("should handle S3 keys with nested paths", () => {
		const entry: Lsp30Entry = {
			backend: "s3",
			bucket: "prod",
			key: "encrypted/2024/q1/data.bin",
			region: "eu-west-1",
		};
		const url = resolveUrl(entry);
		expect(url).toBe(
			"https://prod.s3.eu-west-1.amazonaws.com/encrypted%2F2024%2Fq1%2Fdata.bin",
		);
	});

	it("should handle CIDv1 base32 IPFS CIDs", () => {
		const entry: Lsp30Entry = {
			backend: "ipfs",
			cid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
		};
		const url = resolveUrl(entry);
		expect(url).toBe(
			"ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
		);
	});
});
