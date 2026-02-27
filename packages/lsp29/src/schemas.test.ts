/**
 * LSP29 Schema Validation Tests
 *
 * Tests for schema refinements and validation rules:
 * - Method consistency (encryption.method === encryption.params.method)
 * - EVM address format validation on tokenAddress and followedAddresses
 */

import { describe, expect, it } from "vitest";

import {
	lsp29DigitalAssetBalanceParamsSchema,
	lsp29EncryptedAssetSchema,
	lsp29EncryptionParamsSchema,
	lsp29EncryptionSchema,
	lsp29Lsp8OwnershipParamsSchema,
	lsp29Lsp26FollowerParamsSchema,
} from "./schemas";

// ============================================================================
// Method Consistency Refinement
// ============================================================================

describe("lsp29EncryptionSchema method consistency", () => {
	const validEncryption = {
		provider: "taco",
		method: "digital-asset-balance",
		params: {
			method: "digital-asset-balance",
			tokenAddress: "0x1234567890123456789012345678901234567890",
			requiredBalance: "1000000",
		},
		condition: {},
		encryptedKey: { messageKit: "0x" },
	};

	it("should accept when method matches params.method", () => {
		const result = lsp29EncryptionSchema.safeParse(validEncryption);
		expect(result.success).toBe(true);
	});

	it("should reject when method diverges from params.method", () => {
		const mismatched = {
			...validEncryption,
			method: "time-locked", // top-level says time-locked
			params: {
				// but params says digital-asset-balance
				method: "digital-asset-balance",
				tokenAddress: "0x1234567890123456789012345678901234567890",
				requiredBalance: "1000000",
			},
		};
		const result = lsp29EncryptionSchema.safeParse(mismatched);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"encryption.method must match encryption.params.method",
			);
		}
	});

	it("should accept all four method types when consistent", () => {
		const methods = [
			{
				method: "digital-asset-balance",
				params: {
					method: "digital-asset-balance",
					tokenAddress: "0x1234567890123456789012345678901234567890",
					requiredBalance: "1",
				},
			},
			{
				method: "lsp8-ownership",
				params: {
					method: "lsp8-ownership",
					tokenAddress: "0x1234567890123456789012345678901234567890",
					requiredTokenId: "1",
				},
			},
			{
				method: "lsp26-follower",
				params: {
					method: "lsp26-follower",
					followedAddresses: ["0x1234567890123456789012345678901234567890"],
				},
			},
			{
				method: "time-locked",
				params: {
					method: "time-locked",
					unlockTimestamp: "1704067200",
				},
			},
		] as const;

		for (const { method, params } of methods) {
			const result = lsp29EncryptionSchema.safeParse({
				provider: "taco",
				method,
				params,
				condition: {},
				encryptedKey: {},
			});
			expect(result.success, `Expected ${method} to pass`).toBe(true);
		}
	});

	it("should propagate refinement through full asset schema", () => {
		const asset = {
			LSP29EncryptedAsset: {
				version: "2.0.0",
				id: "test",
				title: "Test",
				revision: 1,
				images: [],
				file: {
					type: "text/plain",
					name: "test.txt",
					size: 100,
					hash: "0xabc",
				},
				encryption: {
					provider: "taco",
					method: "lsp8-ownership", // mismatch
					params: {
						method: "digital-asset-balance",
						tokenAddress: "0x1234567890123456789012345678901234567890",
						requiredBalance: "1",
					},
					condition: {},
					encryptedKey: {},
				},
				chunks: { ipfs: { cids: ["QmTest"] }, iv: "base64iv", totalSize: 100 },
			},
		};
		const result = lsp29EncryptedAssetSchema.safeParse(asset);
		expect(result.success).toBe(false);
	});
});

// ============================================================================
// EVM Address Validation
// ============================================================================

describe("EVM address validation", () => {
	const validAddress = "0x1234567890123456789012345678901234567890";
	const validAddressUppercase = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
	const validAddressMixed = "0xaB3456789012345678901234567890123456789C";

	describe("lsp29DigitalAssetBalanceParamsSchema", () => {
		it("should accept valid EVM address", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: validAddress,
				requiredBalance: "1000",
			});
			expect(result.success).toBe(true);
		});

		it("should accept mixed-case EVM address (checksum)", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: validAddressMixed,
				requiredBalance: "1000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject address without 0x prefix", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: "1234567890123456789012345678901234567890",
				requiredBalance: "1000",
			});
			expect(result.success).toBe(false);
		});

		it("should reject address with wrong length (too short)", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: "0x123456",
				requiredBalance: "1000",
			});
			expect(result.success).toBe(false);
		});

		it("should reject address with wrong length (too long)", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: "0x12345678901234567890123456789012345678901",
				requiredBalance: "1000",
			});
			expect(result.success).toBe(false);
		});

		it("should reject address with non-hex characters", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
				requiredBalance: "1000",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = lsp29DigitalAssetBalanceParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: "",
				requiredBalance: "1000",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("lsp29Lsp8OwnershipParamsSchema", () => {
		it("should accept valid EVM address", () => {
			const result = lsp29Lsp8OwnershipParamsSchema.safeParse({
				method: "lsp8-ownership",
				tokenAddress: validAddress,
				requiredTokenId: "1",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid address", () => {
			const result = lsp29Lsp8OwnershipParamsSchema.safeParse({
				method: "lsp8-ownership",
				tokenAddress: "not-an-address",
				requiredTokenId: "1",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("lsp29Lsp26FollowerParamsSchema", () => {
		it("should accept array of valid EVM addresses", () => {
			const result = lsp29Lsp26FollowerParamsSchema.safeParse({
				method: "lsp26-follower",
				followedAddresses: [validAddress, validAddressUppercase],
			});
			expect(result.success).toBe(true);
		});

		it("should reject if any address is invalid", () => {
			const result = lsp29Lsp26FollowerParamsSchema.safeParse({
				method: "lsp26-follower",
				followedAddresses: [validAddress, "not-valid"],
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty array", () => {
			const result = lsp29Lsp26FollowerParamsSchema.safeParse({
				method: "lsp26-follower",
				followedAddresses: [],
			});
			expect(result.success).toBe(false);
		});
	});

	describe("lsp29EncryptionParamsSchema (discriminated union)", () => {
		it("should reject invalid address through discriminated union", () => {
			const result = lsp29EncryptionParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: "bad-address",
				requiredBalance: "1",
			});
			expect(result.success).toBe(false);
		});

		it("should accept valid address through discriminated union", () => {
			const result = lsp29EncryptionParamsSchema.safeParse({
				method: "digital-asset-balance",
				tokenAddress: validAddress,
				requiredBalance: "1",
			});
			expect(result.success).toBe(true);
		});
	});
});
