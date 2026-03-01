import { describe, expect, it } from "vitest";
import { LSP1_TYPE_IDS } from "./constants";
import {
	isLsp1TypeId,
	isOwnershipNotification,
	isTokenRecipientNotification,
	isTokenSenderNotification,
} from "./guards";

describe("isLsp1TypeId", () => {
	it("returns true for all known typeIds", () => {
		for (const value of Object.values(LSP1_TYPE_IDS)) {
			expect(isLsp1TypeId(value)).toBe(true);
		}
	});

	it("returns false for unknown hex strings", () => {
		expect(
			isLsp1TypeId(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			),
		).toBe(false);
		expect(
			isLsp1TypeId(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			),
		).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isLsp1TypeId("")).toBe(false);
	});

	it("returns false for non-hex strings", () => {
		expect(isLsp1TypeId("hello")).toBe(false);
		expect(isLsp1TypeId("0x")).toBe(false);
	});
});

describe("isTokenRecipientNotification", () => {
	it("returns true for LSP7 recipient notification", () => {
		expect(
			isTokenRecipientNotification(
				LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns true for LSP8 recipient notification", () => {
		expect(
			isTokenRecipientNotification(
				LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns false for sender notifications", () => {
		expect(
			isTokenRecipientNotification(LSP1_TYPE_IDS.LSP7Tokens_SenderNotification),
		).toBe(false);
		expect(
			isTokenRecipientNotification(LSP1_TYPE_IDS.LSP8Tokens_SenderNotification),
		).toBe(false);
	});

	it("returns false for ownership notifications", () => {
		expect(
			isTokenRecipientNotification(
				LSP1_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification,
			),
		).toBe(false);
	});
});

describe("isTokenSenderNotification", () => {
	it("returns true for LSP7 sender notification", () => {
		expect(
			isTokenSenderNotification(LSP1_TYPE_IDS.LSP7Tokens_SenderNotification),
		).toBe(true);
	});

	it("returns true for LSP8 sender notification", () => {
		expect(
			isTokenSenderNotification(LSP1_TYPE_IDS.LSP8Tokens_SenderNotification),
		).toBe(true);
	});

	it("returns false for recipient notifications", () => {
		expect(
			isTokenSenderNotification(LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification),
		).toBe(false);
	});
});

describe("isOwnershipNotification", () => {
	it("returns true for ownership sender notification", () => {
		expect(
			isOwnershipNotification(
				LSP1_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification,
			),
		).toBe(true);
	});

	it("returns true for ownership recipient notification", () => {
		expect(
			isOwnershipNotification(
				LSP1_TYPE_IDS.LSP14OwnershipTransferred_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns false for token notifications", () => {
		expect(
			isOwnershipNotification(LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification),
		).toBe(false);
		expect(
			isOwnershipNotification(LSP1_TYPE_IDS.LSP8Tokens_SenderNotification),
		).toBe(false);
	});
});
