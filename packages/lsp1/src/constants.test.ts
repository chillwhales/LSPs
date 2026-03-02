import { describe, expect, it } from "vitest";
import {
	ALL_TYPE_IDS,
	BUILT_IN_TYPE_IDS,
	LSP0_TYPE_IDS,
	LSP7_TYPE_IDS,
	LSP8_TYPE_IDS,
	LSP9_TYPE_IDS,
	LSP14_TYPE_IDS,
	LSP26_TYPE_IDS,
	TYPE_ID_NAMES,
	UNIVERSAL_RECEIVER_EVENT_SIGNATURE,
} from "./constants";

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

describe("per-LSP re-exports", () => {
	it("re-exports LSP0_TYPE_IDS with expected keys", () => {
		expect(LSP0_TYPE_IDS).toHaveProperty("LSP0ValueReceived");
		expect(LSP0_TYPE_IDS).toHaveProperty("LSP0OwnershipTransferStarted");
		expect(LSP0_TYPE_IDS).toHaveProperty(
			"LSP0OwnershipTransferred_SenderNotification",
		);
		expect(LSP0_TYPE_IDS).toHaveProperty(
			"LSP0OwnershipTransferred_RecipientNotification",
		);
	});

	it("re-exports LSP7_TYPE_IDS with expected keys", () => {
		expect(LSP7_TYPE_IDS).toHaveProperty("LSP7Tokens_SenderNotification");
		expect(LSP7_TYPE_IDS).toHaveProperty("LSP7Tokens_RecipientNotification");
	});

	it("re-exports LSP8_TYPE_IDS with expected keys", () => {
		expect(LSP8_TYPE_IDS).toHaveProperty("LSP8Tokens_SenderNotification");
		expect(LSP8_TYPE_IDS).toHaveProperty("LSP8Tokens_RecipientNotification");
	});

	it("re-exports LSP14_TYPE_IDS with expected keys", () => {
		expect(LSP14_TYPE_IDS).toHaveProperty(
			"LSP14OwnershipTransferred_SenderNotification",
		);
		expect(LSP14_TYPE_IDS).toHaveProperty(
			"LSP14OwnershipTransferred_RecipientNotification",
		);
	});

	it("re-exports LSP26_TYPE_IDS with expected keys", () => {
		expect(LSP26_TYPE_IDS).toHaveProperty(
			"LSP26FollowerSystem_FollowNotification",
		);
		expect(LSP26_TYPE_IDS).toHaveProperty(
			"LSP26FollowerSystem_UnfollowNotification",
		);
	});
});

describe("UNIVERSAL_RECEIVER_EVENT_SIGNATURE", () => {
	it("matches the expected event signature", () => {
		expect(UNIVERSAL_RECEIVER_EVENT_SIGNATURE).toBe(
			"UniversalReceiver(address,uint256,bytes32,bytes,bytes)",
		);
	});
});
