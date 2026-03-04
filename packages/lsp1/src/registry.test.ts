import { describe, expect, it } from "vitest";
import { ALL_TYPE_IDS } from "./constants";
import {
	getKnownTypeIdHexes,
	getKnownTypeIdNames,
	getTypeIdCount,
	getTypeIdEntries,
	isKnownTypeIdHex,
	isKnownTypeIdName,
	resolveTypeIdHex,
	resolveTypeIdName,
} from "./registry";

describe("resolveTypeIdName", () => {
	it("resolves known hex to name", () => {
		const hex = ALL_TYPE_IDS.LSP7Tokens_SenderNotification;
		expect(resolveTypeIdName(hex)).toBe("LSP7Tokens_SenderNotification");
	});

	it("is case-insensitive", () => {
		const hex = ALL_TYPE_IDS.LSP7Tokens_SenderNotification;
		expect(resolveTypeIdName(hex.toLowerCase())).toBe(
			"LSP7Tokens_SenderNotification",
		);
		expect(resolveTypeIdName(hex.toUpperCase())).toBe(
			"LSP7Tokens_SenderNotification",
		);
	});

	it("returns null for unknown hex", () => {
		expect(
			resolveTypeIdName(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			),
		).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(resolveTypeIdName("")).toBeNull();
	});

	it("resolves all built-in type IDs", () => {
		for (const [name, hex] of Object.entries(ALL_TYPE_IDS)) {
			expect(resolveTypeIdName(hex)).toBe(name);
		}
	});
});

describe("resolveTypeIdHex", () => {
	it("resolves known name to hex", () => {
		const result = resolveTypeIdHex("LSP7Tokens_SenderNotification");
		expect(result).toBe(
			ALL_TYPE_IDS.LSP7Tokens_SenderNotification.toLowerCase(),
		);
	});

	it("is case-insensitive", () => {
		const result = resolveTypeIdHex("lsp7tokens_sendernotification");
		expect(result).toBe(
			ALL_TYPE_IDS.LSP7Tokens_SenderNotification.toLowerCase(),
		);
	});

	it("returns null for unknown name", () => {
		expect(resolveTypeIdHex("UnknownTypeId")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(resolveTypeIdHex("")).toBeNull();
	});
});

describe("isKnownTypeIdName", () => {
	it("returns true for known names", () => {
		expect(isKnownTypeIdName("LSP7Tokens_SenderNotification")).toBe(true);
		expect(isKnownTypeIdName("LSP8Tokens_RecipientNotification")).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isKnownTypeIdName("lsp7tokens_sendernotification")).toBe(true);
	});

	it("returns false for unknown names", () => {
		expect(isKnownTypeIdName("UnknownTypeId")).toBe(false);
		expect(isKnownTypeIdName("")).toBe(false);
	});
});

describe("isKnownTypeIdHex", () => {
	it("returns true for known hex values", () => {
		expect(isKnownTypeIdHex(ALL_TYPE_IDS.LSP7Tokens_SenderNotification)).toBe(
			true,
		);
	});

	it("is case-insensitive", () => {
		expect(
			isKnownTypeIdHex(
				ALL_TYPE_IDS.LSP7Tokens_SenderNotification.toUpperCase(),
			),
		).toBe(true);
	});

	it("returns false for unknown hex values", () => {
		expect(
			isKnownTypeIdHex(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			),
		).toBe(false);
		expect(isKnownTypeIdHex("")).toBe(false);
	});
});

describe("getKnownTypeIdNames", () => {
	it("returns all known names", () => {
		const names = getKnownTypeIdNames();
		expect(names.length).toBe(Object.keys(ALL_TYPE_IDS).length);
		for (const key of Object.keys(ALL_TYPE_IDS)) {
			expect(names).toContain(key);
		}
	});
});

describe("getKnownTypeIdHexes", () => {
	it("returns all known hex values (lowercase)", () => {
		const hexes = getKnownTypeIdHexes();
		expect(hexes.length).toBe(Object.keys(ALL_TYPE_IDS).length);
		for (const hex of hexes) {
			expect(hex).toBe(hex.toLowerCase());
		}
	});
});

describe("getTypeIdCount", () => {
	it("returns the correct count", () => {
		expect(getTypeIdCount()).toBe(Object.keys(ALL_TYPE_IDS).length);
	});
});

describe("getTypeIdEntries", () => {
	it("returns [hex, name] pairs", () => {
		const entries = getTypeIdEntries();
		expect(entries.length).toBe(Object.keys(ALL_TYPE_IDS).length);
		for (const [hex, name] of entries) {
			expect(hex).toBe(hex.toLowerCase());
			expect(typeof name).toBe("string");
			// Verify the mapping is correct
			expect(resolveTypeIdName(hex)).toBe(name);
		}
	});
});
