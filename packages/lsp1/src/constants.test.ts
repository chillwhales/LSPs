import { describe, expect, it } from "vitest";
import {
	LSP1_TYPE_ID_VALUES,
	LSP1_TYPE_IDS,
	UNIVERSAL_RECEIVER_EVENT_SIGNATURE,
} from "./constants";

describe("LSP1_TYPE_IDS", () => {
	it("has all expected keys", () => {
		expect(LSP1_TYPE_IDS).toHaveProperty("LSP7Tokens_RecipientNotification");
		expect(LSP1_TYPE_IDS).toHaveProperty("LSP7Tokens_SenderNotification");
		expect(LSP1_TYPE_IDS).toHaveProperty("LSP8Tokens_RecipientNotification");
		expect(LSP1_TYPE_IDS).toHaveProperty("LSP8Tokens_SenderNotification");
		expect(LSP1_TYPE_IDS).toHaveProperty(
			"LSP14OwnershipTransferred_SenderNotification",
		);
		expect(LSP1_TYPE_IDS).toHaveProperty(
			"LSP14OwnershipTransferred_RecipientNotification",
		);
	});

	it("has exactly 6 typeId entries", () => {
		expect(Object.keys(LSP1_TYPE_IDS)).toHaveLength(6);
	});

	it("all values are valid 32-byte hex strings", () => {
		for (const value of Object.values(LSP1_TYPE_IDS)) {
			expect(value).toMatch(/^0x[0-9a-f]{64}$/);
			expect(value).toHaveLength(66); // 0x + 64 hex chars
		}
	});

	it("all values are unique", () => {
		const values = Object.values(LSP1_TYPE_IDS);
		const unique = new Set(values);
		expect(unique.size).toBe(values.length);
	});
});

describe("LSP1_TYPE_ID_VALUES", () => {
	it("contains all 6 values", () => {
		expect(LSP1_TYPE_ID_VALUES).toHaveLength(6);
	});

	it("matches Object.values of LSP1_TYPE_IDS", () => {
		expect(LSP1_TYPE_ID_VALUES).toEqual(Object.values(LSP1_TYPE_IDS));
	});
});

describe("UNIVERSAL_RECEIVER_EVENT_SIGNATURE", () => {
	it("matches the expected event signature", () => {
		expect(UNIVERSAL_RECEIVER_EVENT_SIGNATURE).toBe(
			"UniversalReceiver(address,uint256,bytes32,bytes,bytes)",
		);
	});
});
