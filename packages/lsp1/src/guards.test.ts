import { describe, expect, it } from "vitest";
import {
	ALL_TYPE_IDS,
	LSP0_TYPE_IDS,
	LSP7_TYPE_IDS,
	LSP8_TYPE_IDS,
	LSP14_TYPE_IDS,
} from "./constants";
import {
	isLsp1TypeId,
	isOwnershipNotification,
	isTokenRecipientNotification,
	isTokenSenderNotification,
} from "./guards";

describe("isLsp1TypeId", () => {
	it("returns true for all known typeIds", () => {
		for (const value of Object.values(ALL_TYPE_IDS)) {
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

	it("is case-insensitive", () => {
		const hex = ALL_TYPE_IDS.LSP7Tokens_SenderNotification;
		expect(isLsp1TypeId(hex.toUpperCase())).toBe(true);
		expect(isLsp1TypeId(hex.toLowerCase())).toBe(true);
	});
});

describe("isTokenRecipientNotification", () => {
	it("returns true for LSP7 recipient notification", () => {
		expect(
			isTokenRecipientNotification(
				LSP7_TYPE_IDS.LSP7Tokens_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns true for LSP8 recipient notification", () => {
		expect(
			isTokenRecipientNotification(
				LSP8_TYPE_IDS.LSP8Tokens_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns false for sender notifications", () => {
		expect(
			isTokenRecipientNotification(LSP7_TYPE_IDS.LSP7Tokens_SenderNotification),
		).toBe(false);
		expect(
			isTokenRecipientNotification(LSP8_TYPE_IDS.LSP8Tokens_SenderNotification),
		).toBe(false);
	});

	it("returns false for ownership notifications", () => {
		expect(
			isTokenRecipientNotification(
				LSP14_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification,
			),
		).toBe(false);
	});
});

describe("isTokenSenderNotification", () => {
	it("returns true for LSP7 sender notification", () => {
		expect(
			isTokenSenderNotification(LSP7_TYPE_IDS.LSP7Tokens_SenderNotification),
		).toBe(true);
	});

	it("returns true for LSP8 sender notification", () => {
		expect(
			isTokenSenderNotification(LSP8_TYPE_IDS.LSP8Tokens_SenderNotification),
		).toBe(true);
	});

	it("returns false for recipient notifications", () => {
		expect(
			isTokenSenderNotification(LSP7_TYPE_IDS.LSP7Tokens_RecipientNotification),
		).toBe(false);
	});
});

describe("isOwnershipNotification", () => {
	it("returns true for LSP0 ownership sender notification", () => {
		expect(
			isOwnershipNotification(
				LSP0_TYPE_IDS.LSP0OwnershipTransferred_SenderNotification,
			),
		).toBe(true);
	});

	it("returns true for LSP0 ownership recipient notification", () => {
		expect(
			isOwnershipNotification(
				LSP0_TYPE_IDS.LSP0OwnershipTransferred_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns true for LSP14 ownership sender notification", () => {
		expect(
			isOwnershipNotification(
				LSP14_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification,
			),
		).toBe(true);
	});

	it("returns true for LSP14 ownership recipient notification", () => {
		expect(
			isOwnershipNotification(
				LSP14_TYPE_IDS.LSP14OwnershipTransferred_RecipientNotification,
			),
		).toBe(true);
	});

	it("returns false for token notifications", () => {
		expect(
			isOwnershipNotification(LSP7_TYPE_IDS.LSP7Tokens_RecipientNotification),
		).toBe(false);
		expect(
			isOwnershipNotification(LSP8_TYPE_IDS.LSP8Tokens_SenderNotification),
		).toBe(false);
	});
});
