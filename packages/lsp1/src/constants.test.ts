import { LSP0_TYPE_IDS } from "@lukso/lsp0-contracts";
import { LSP7_TYPE_IDS } from "@lukso/lsp7-contracts";
import { LSP8_TYPE_IDS } from "@lukso/lsp8-contracts";
import { LSP9_TYPE_IDS } from "@lukso/lsp9-contracts";
import { LSP14_TYPE_IDS } from "@lukso/lsp14-contracts";
import { LSP26_TYPE_IDS } from "@lukso/lsp26-contracts";
import { describe, expect, it } from "vitest";
import { ALL_TYPE_IDS, BUILT_IN_TYPE_IDS, TYPE_ID_NAMES } from "./constants";

describe("ALL_TYPE_IDS", () => {
	it("contains LSP0 type IDs", () => {
		for (const key of Object.keys(LSP0_TYPE_IDS)) {
			expect(ALL_TYPE_IDS).toHaveProperty(key);
		}
	});

	it("contains LSP7 type IDs", () => {
		for (const key of Object.keys(LSP7_TYPE_IDS)) {
			expect(ALL_TYPE_IDS).toHaveProperty(key);
		}
	});

	it("contains LSP8 type IDs", () => {
		for (const key of Object.keys(LSP8_TYPE_IDS)) {
			expect(ALL_TYPE_IDS).toHaveProperty(key);
		}
	});

	it("contains LSP9 type IDs", () => {
		for (const key of Object.keys(LSP9_TYPE_IDS)) {
			expect(ALL_TYPE_IDS).toHaveProperty(key);
		}
	});

	it("contains LSP14 type IDs", () => {
		for (const key of Object.keys(LSP14_TYPE_IDS)) {
			expect(ALL_TYPE_IDS).toHaveProperty(key);
		}
	});

	it("contains LSP26 type IDs", () => {
		for (const key of Object.keys(LSP26_TYPE_IDS)) {
			expect(ALL_TYPE_IDS).toHaveProperty(key);
		}
	});

	it("all values are valid 0x-prefixed hex strings", () => {
		for (const value of Object.values(ALL_TYPE_IDS)) {
			expect(value).toMatch(/^0x[0-9a-fA-F]+$/);
		}
	});

	it("all values are unique", () => {
		const values = Object.values(ALL_TYPE_IDS);
		const unique = new Set(values.map((v) => v.toLowerCase()));
		expect(unique.size).toBe(values.length);
	});

	it("has more than 6 type IDs (sourced from multiple LSPs)", () => {
		// LSP0 (4) + LSP7 (5) + LSP8 (5) + LSP9 (4) + LSP14 (3) + LSP26 (2) = 23
		expect(Object.keys(ALL_TYPE_IDS).length).toBeGreaterThan(6);
	});
});

describe("TYPE_ID_NAMES", () => {
	it("contains all keys from ALL_TYPE_IDS", () => {
		const keys = Object.keys(ALL_TYPE_IDS);
		expect(TYPE_ID_NAMES).toHaveLength(keys.length);
		for (const key of keys) {
			expect(TYPE_ID_NAMES).toContain(key);
		}
	});

	it("is a non-empty array", () => {
		expect(TYPE_ID_NAMES.length).toBeGreaterThan(0);
	});
});

describe("BUILT_IN_TYPE_IDS", () => {
	it("contains [name, hex] pairs matching ALL_TYPE_IDS", () => {
		expect(BUILT_IN_TYPE_IDS).toHaveLength(Object.keys(ALL_TYPE_IDS).length);
		for (const [name, hex] of BUILT_IN_TYPE_IDS) {
			expect(ALL_TYPE_IDS).toHaveProperty(
				name,
				expect.stringMatching(/^0x[0-9a-fA-F]+$/),
			);
			expect(hex).toBe(
				(ALL_TYPE_IDS as Record<string, string>)[name as string],
			);
		}
	});
});

describe("ALL_TYPE_IDS includes per-LSP constants", () => {
	it("includes LSP0_TYPE_IDS keys", () => {
		expect(ALL_TYPE_IDS).toHaveProperty("LSP0ValueReceived");
		expect(ALL_TYPE_IDS).toHaveProperty("LSP0OwnershipTransferStarted");
		expect(ALL_TYPE_IDS).toHaveProperty(
			"LSP0OwnershipTransferred_SenderNotification",
		);
		expect(ALL_TYPE_IDS).toHaveProperty(
			"LSP0OwnershipTransferred_RecipientNotification",
		);
	});

	it("includes LSP7_TYPE_IDS keys", () => {
		expect(ALL_TYPE_IDS).toHaveProperty("LSP7Tokens_SenderNotification");
		expect(ALL_TYPE_IDS).toHaveProperty("LSP7Tokens_RecipientNotification");
	});

	it("includes LSP8_TYPE_IDS keys", () => {
		expect(ALL_TYPE_IDS).toHaveProperty("LSP8Tokens_SenderNotification");
		expect(ALL_TYPE_IDS).toHaveProperty("LSP8Tokens_RecipientNotification");
	});

	it("includes LSP14_TYPE_IDS keys", () => {
		expect(ALL_TYPE_IDS).toHaveProperty(
			"LSP14OwnershipTransferred_SenderNotification",
		);
		expect(ALL_TYPE_IDS).toHaveProperty(
			"LSP14OwnershipTransferred_RecipientNotification",
		);
	});

	it("includes LSP26_TYPE_IDS keys", () => {
		expect(ALL_TYPE_IDS).toHaveProperty(
			"LSP26FollowerSystem_FollowNotification",
		);
		expect(ALL_TYPE_IDS).toHaveProperty(
			"LSP26FollowerSystem_UnfollowNotification",
		);
	});
});
