import { describe, expect, it } from "vitest";
import { ALL_DATA_KEYS } from "./constants";
import {
	getDataKeyCount,
	getDataKeyEntries,
	getKnownDataKeyHexes,
	getKnownDataKeyNames,
	isKnownDataKeyHex,
	isKnownDataKeyName,
	resolveDataKeyHex,
	resolveDataKeyName,
} from "./registry";

describe("resolveDataKeyName", () => {
	it("resolves known full-length hex to name", () => {
		const hex = ALL_DATA_KEYS.LSP3Profile;
		expect(resolveDataKeyName(hex)).toBe("LSP3Profile");
	});

	it("is case-insensitive", () => {
		const hex = ALL_DATA_KEYS.LSP3Profile;
		expect(resolveDataKeyName(hex.toLowerCase())).toBe("LSP3Profile");
		expect(resolveDataKeyName(hex.toUpperCase())).toBe("LSP3Profile");
	});

	it("returns null for unknown hex", () => {
		expect(
			resolveDataKeyName(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			),
		).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(resolveDataKeyName("")).toBeNull();
	});

	it("resolves all built-in data keys by exact match", () => {
		for (const [name, hex] of Object.entries(ALL_DATA_KEYS)) {
			expect(resolveDataKeyName(hex)).toBe(name);
		}
	});

	it("resolves prefix keys via prefix matching", () => {
		// LSP5ReceivedAssetsMap is a prefix key (0x812c4334633eb816c80d0000)
		// A full 32-byte key starting with this prefix should resolve
		const prefix = ALL_DATA_KEYS.LSP5ReceivedAssetsMap;
		const fullKey = `${prefix}cafecafecafecafecafecafe`;
		expect(resolveDataKeyName(fullKey)).toBe("LSP5ReceivedAssetsMap");
	});

	it("uses greedy (longest) prefix matching", () => {
		// AddressPermissionsPrefix is shorter than AddressPermissions:Permissions
		// A key starting with Permissions prefix should match Permissions, not the shorter prefix
		const permissionsPrefix = ALL_DATA_KEYS["AddressPermissions:Permissions"];
		const fullKey = `${permissionsPrefix}cafecafecafecafecafecafe`;
		expect(resolveDataKeyName(fullKey)).toBe("AddressPermissions:Permissions");
	});
});

describe("resolveDataKeyHex", () => {
	it("resolves known name to hex", () => {
		const result = resolveDataKeyHex("LSP3Profile");
		expect(result).toBe(ALL_DATA_KEYS.LSP3Profile.toLowerCase());
	});

	it("is case-insensitive", () => {
		const result = resolveDataKeyHex("lsp3profile");
		expect(result).toBe(ALL_DATA_KEYS.LSP3Profile.toLowerCase());
	});

	it("returns null for unknown name", () => {
		expect(resolveDataKeyHex("UnknownDataKey")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(resolveDataKeyHex("")).toBeNull();
	});

	it("resolves array sub-key names", () => {
		expect(resolveDataKeyHex("LSP4Creators[]")).toBe(
			ALL_DATA_KEYS["LSP4Creators[]"].toLowerCase(),
		);
		expect(resolveDataKeyHex("LSP4Creators[number]")).toBe(
			ALL_DATA_KEYS["LSP4Creators[number]"].toLowerCase(),
		);
	});
});

describe("isKnownDataKeyName", () => {
	it("returns true for known names", () => {
		expect(isKnownDataKeyName("LSP3Profile")).toBe(true);
		expect(isKnownDataKeyName("LSP4TokenName")).toBe(true);
		expect(isKnownDataKeyName("LSP8TokenIdFormat")).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isKnownDataKeyName("lsp3profile")).toBe(true);
	});

	it("returns false for unknown names", () => {
		expect(isKnownDataKeyName("UnknownDataKey")).toBe(false);
		expect(isKnownDataKeyName("")).toBe(false);
	});
});

describe("isKnownDataKeyHex", () => {
	it("returns true for known hex values", () => {
		expect(isKnownDataKeyHex(ALL_DATA_KEYS.LSP3Profile)).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isKnownDataKeyHex(ALL_DATA_KEYS.LSP3Profile.toUpperCase())).toBe(
			true,
		);
	});

	it("returns false for unknown hex values", () => {
		expect(
			isKnownDataKeyHex(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			),
		).toBe(false);
		expect(isKnownDataKeyHex("")).toBe(false);
	});
});

describe("getKnownDataKeyNames", () => {
	it("returns all known names", () => {
		const names = getKnownDataKeyNames();
		expect(names.length).toBe(Object.keys(ALL_DATA_KEYS).length);
		for (const key of Object.keys(ALL_DATA_KEYS)) {
			expect(names).toContain(key);
		}
	});
});

describe("getKnownDataKeyHexes", () => {
	it("returns all known hex values (lowercase)", () => {
		const hexes = getKnownDataKeyHexes();
		expect(hexes.length).toBe(Object.keys(ALL_DATA_KEYS).length);
		for (const hex of hexes) {
			expect(hex).toBe(hex.toLowerCase());
		}
	});
});

describe("getDataKeyCount", () => {
	it("returns the correct count", () => {
		expect(getDataKeyCount()).toBe(Object.keys(ALL_DATA_KEYS).length);
	});
});

describe("getDataKeyEntries", () => {
	it("returns [hex, name] pairs", () => {
		const entries = getDataKeyEntries();
		expect(entries.length).toBe(Object.keys(ALL_DATA_KEYS).length);
		for (const [hex, name] of entries) {
			expect(hex).toBe(hex.toLowerCase());
			expect(typeof name).toBe("string");
			// Verify the mapping is correct
			expect(resolveDataKeyName(hex)).toBe(name);
		}
	});
});
