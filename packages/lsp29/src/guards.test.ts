/**
 * LSP29 Guard Utilities Tests
 *
 * Tests for type guard validation of LSP29 v2.0.0 assets.
 */

import { describe, expect, it } from "vitest";

import { isLsp29Asset } from "./guards";
import type { LSP29EncryptedAsset } from "./types";

/** Valid v2.0.0 asset fixture */
const validAsset: LSP29EncryptedAsset = {
	LSP29EncryptedAsset: {
		version: "2.0.0",
		id: "test-content-id",
		title: "Test Content",
		description: "A test encrypted asset",
		revision: 1,
		images: [],
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

describe("isLsp29Asset", () => {
	it("should return true for valid v2.0.0 LSP29 object", () => {
		expect(isLsp29Asset(validAsset)).toBe(true);
	});

	it("should return true without optional description", () => {
		const asset = {
			...validAsset,
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				description: undefined,
			},
		};
		expect(isLsp29Asset(asset)).toBe(true);
	});

	it("should return true without optional file.lastModified", () => {
		const asset = {
			...validAsset,
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				file: {
					...validAsset.LSP29EncryptedAsset.file,
					lastModified: undefined,
				},
			},
		};
		expect(isLsp29Asset(asset)).toBe(true);
	});

	it("should return false for missing LSP29EncryptedAsset wrapper", () => {
		expect(isLsp29Asset({ version: "2.0.0", id: "test", title: "Test" })).toBe(
			false,
		);
	});

	it("should return false for missing required fields", () => {
		const missingTitle = {
			LSP29EncryptedAsset: {
				version: "2.0.0",
				id: "test",
				// missing title
				revision: 1,
				file: validAsset.LSP29EncryptedAsset.file,
				encryption: validAsset.LSP29EncryptedAsset.encryption,
				chunks: validAsset.LSP29EncryptedAsset.chunks,
			},
		};
		expect(isLsp29Asset(missingTitle)).toBe(false);
	});

	it("should return false for old v1.0.0 objects", () => {
		const v1Asset = {
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				version: "1.0.0",
			},
		};
		expect(isLsp29Asset(v1Asset)).toBe(false);
	});

	it("should return false for null", () => {
		expect(isLsp29Asset(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isLsp29Asset(undefined)).toBe(false);
	});

	it("should return false for string", () => {
		expect(isLsp29Asset("not an object")).toBe(false);
	});

	it("should return false for number", () => {
		expect(isLsp29Asset(123)).toBe(false);
	});

	it("should return false for empty object", () => {
		expect(isLsp29Asset({})).toBe(false);
	});

	it("should return false for array", () => {
		expect(isLsp29Asset([validAsset])).toBe(false);
	});

	it("should return false for invalid revision (0)", () => {
		const invalidRevision = {
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				revision: 0,
			},
		};
		expect(isLsp29Asset(invalidRevision)).toBe(false);
	});

	it("should work with lsp8-ownership encryption", () => {
		const lsp8Asset = {
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				encryption: {
					provider: "taco" as const,
					method: "lsp8-ownership" as const,
					params: {
						method: "lsp8-ownership" as const,
						tokenAddress: "0x1234567890123456789012345678901234567890",
						requiredTokenId: "1",
					},
					condition: {},
					encryptedKey: { messageKit: "0x" },
				},
			},
		};
		expect(isLsp29Asset(lsp8Asset)).toBe(true);
	});

	it("should work with time-locked encryption", () => {
		const timeLockedAsset = {
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				encryption: {
					provider: "taco" as const,
					method: "time-locked" as const,
					params: {
						method: "time-locked" as const,
						unlockTimestamp: "1704067200",
					},
					condition: {},
					encryptedKey: { messageKit: "0x" },
				},
			},
		};
		expect(isLsp29Asset(timeLockedAsset)).toBe(true);
	});

	it("should work with lsp26-follower encryption", () => {
		const followerAsset = {
			LSP29EncryptedAsset: {
				...validAsset.LSP29EncryptedAsset,
				encryption: {
					provider: "taco" as const,
					method: "lsp26-follower" as const,
					params: {
						method: "lsp26-follower" as const,
						followedAddresses: ["0x1234567890123456789012345678901234567890"],
					},
					condition: {},
					encryptedKey: { messageKit: "0x" },
				},
			},
		};
		expect(isLsp29Asset(followerAsset)).toBe(true);
	});
});
