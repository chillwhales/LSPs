/**
 * LSP29 Decode Utilities Tests
 *
 * Tests for metadata JSON parsing and validation.
 */

import { describe, expect, it } from "vitest";

import { decodeLsp29Metadata } from "./decode";
import type { LSP29EncryptedAsset } from "./types";

/** Valid v2.0.0 asset fixture */
const validAsset: LSP29EncryptedAsset = {
	LSP29EncryptedAsset: {
		version: "2.0.0",
		id: "test-content-id",
		title: "Test Content",
		description: "A test encrypted asset",
		revision: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		file: {
			type: "image/png",
			name: "test.png",
			size: 1024,
			lastModified: 1704067200000,
			hash: "0xabc123def456",
		},
		encryption: {
			provider: "taco",
			method: "digital-asset-balance",
			params: {
				method: "digital-asset-balance",
				tokenAddress: "0x1234567890123456789012345678901234567890",
				requiredBalance: "1000000000000000000",
			},
			condition: { operator: "and", operands: [] },
			encryptedKey: { messageKit: "0xencrypteddata" },
		},
		chunks: {
			ipfs: { cids: ["QmTest123", "QmTest456"] },
			iv: "base64-iv-string",
			totalSize: 2048,
		},
	},
};

describe("decodeLsp29Metadata", () => {
	it("should parse valid v2.0.0 JSON string", () => {
		const json = JSON.stringify(validAsset);
		const result = decodeLsp29Metadata(json);
		expect(result.LSP29EncryptedAsset.version).toBe("2.0.0");
		expect(result.LSP29EncryptedAsset.title).toBe("Test Content");
		expect(result.LSP29EncryptedAsset.id).toBe("test-content-id");
	});

	it("should return correctly typed LSP29EncryptedAsset", () => {
		const json = JSON.stringify(validAsset);
		const result = decodeLsp29Metadata(json);
		expect(result.LSP29EncryptedAsset.encryption.provider).toBe("taco");
		expect(result.LSP29EncryptedAsset.encryption.method).toBe(
			"digital-asset-balance",
		);
		expect(result.LSP29EncryptedAsset.chunks.ipfs?.cids).toEqual([
			"QmTest123",
			"QmTest456",
		]);
	});

	it("should throw on invalid JSON", () => {
		expect(() => decodeLsp29Metadata("not valid json")).toThrow();
	});

	it("should throw on valid JSON but invalid schema (missing required fields)", () => {
		const invalidJson = JSON.stringify({
			LSP29EncryptedAsset: { version: "2.0.0" },
		});
		expect(() => decodeLsp29Metadata(invalidJson)).toThrow();
	});

	it("should throw on v1.0.0 JSON (version mismatch)", () => {
		const v1Asset = {
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				version: "1.0.0",
			},
		};
		expect(() => decodeLsp29Metadata(JSON.stringify(v1Asset))).toThrow();
	});

	it("should throw on empty string", () => {
		expect(() => decodeLsp29Metadata("")).toThrow();
	});

	it("should parse asset with lumera backend", () => {
		const lumeraAsset = {
			...validAsset,
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				chunks: {
					lumera: { actionIds: ["action-1", "action-2"] },
					iv: "base64-iv",
					totalSize: 4096,
				},
			},
		};
		const result = decodeLsp29Metadata(JSON.stringify(lumeraAsset));
		expect(result.LSP29EncryptedAsset.chunks.lumera?.actionIds).toEqual([
			"action-1",
			"action-2",
		]);
	});

	it("should parse asset with multiple backends", () => {
		const multiBackendAsset = {
			...validAsset,
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				chunks: {
					ipfs: { cids: ["QmCid1"] },
					lumera: { actionIds: ["action1"] },
					iv: "base64-iv",
					totalSize: 8192,
				},
			},
		};
		const result = decodeLsp29Metadata(JSON.stringify(multiBackendAsset));
		expect(result.LSP29EncryptedAsset.chunks.ipfs?.cids).toEqual(["QmCid1"]);
		expect(result.LSP29EncryptedAsset.chunks.lumera?.actionIds).toEqual([
			"action1",
		]);
	});
});
