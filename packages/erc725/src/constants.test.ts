import { LSP1DataKeys } from "@lukso/lsp1-contracts";
import { LSP3DataKeys } from "@lukso/lsp3-contracts";
import { LSP4DataKeys } from "@lukso/lsp4-contracts";
import { LSP5DataKeys } from "@lukso/lsp5-contracts";
import { LSP6DataKeys } from "@lukso/lsp6-contracts";
import { LSP8DataKeys } from "@lukso/lsp8-contracts";
import { LSP9DataKeys } from "@lukso/lsp9-contracts";
import { LSP10DataKeys } from "@lukso/lsp10-contracts";
import { LSP12DataKeys } from "@lukso/lsp12-contracts";
import { LSP17DataKeys } from "@lukso/lsp17contractextension-contracts";
import { describe, expect, it } from "vitest";
import { ALL_DATA_KEYS, BUILT_IN_DATA_KEYS, DATA_KEY_NAMES } from "./constants";

/** Helper to collect all flattened key names from a raw DataKeys object */
function flatKeyNames(
	raw: Record<string, string | { length: string; index: string }>,
): string[] {
	const names: string[] = [];
	for (const [name, value] of Object.entries(raw)) {
		if (typeof value === "string") {
			names.push(name);
		} else {
			// Array keys: "KeyName[]" for length, "KeyName[number]" for index
			// Strip the trailing "[]" from the original name to build the flattened names
			const baseName = name.replace(/\[\]$/, "");
			names.push(`${baseName}[]`);
			names.push(`${baseName}[number]`);
		}
	}
	return names;
}

describe("ALL_DATA_KEYS", () => {
	it("contains LSP1 data keys", () => {
		for (const name of flatKeyNames(LSP1DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP3 data keys", () => {
		for (const name of flatKeyNames(LSP3DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP4 data keys", () => {
		for (const name of flatKeyNames(LSP4DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP5 data keys", () => {
		for (const name of flatKeyNames(LSP5DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP6 data keys", () => {
		for (const name of flatKeyNames(LSP6DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP8 data keys", () => {
		for (const name of flatKeyNames(LSP8DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP9 data keys", () => {
		for (const name of flatKeyNames(LSP9DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP10 data keys", () => {
		for (const name of flatKeyNames(LSP10DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP12 data keys", () => {
		for (const name of flatKeyNames(LSP12DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("contains LSP17 data keys", () => {
		for (const name of flatKeyNames(LSP17DataKeys)) {
			expect(ALL_DATA_KEYS).toHaveProperty(name);
		}
	});

	it("all values are valid 0x-prefixed hex strings", () => {
		for (const value of Object.values(ALL_DATA_KEYS)) {
			expect(value).toMatch(/^0x[0-9a-fA-F]+$/);
		}
	});

	it("all values are unique", () => {
		const values = Object.values(ALL_DATA_KEYS);
		const unique = new Set(values.map((v) => v.toLowerCase()));
		expect(unique.size).toBe(values.length);
	});

	it("has more than 10 data keys (sourced from multiple LSPs)", () => {
		expect(Object.keys(ALL_DATA_KEYS).length).toBeGreaterThan(10);
	});

	it("correctly flattens array-type keys", () => {
		// LSP4Creators[] should become LSP4Creators[] (length) and LSP4Creators[number] (index)
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4Creators[]");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4Creators[number]");
	});

	it("includes SupportedStandards keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("SupportedStandards_LSP3");
		expect(ALL_DATA_KEYS).toHaveProperty("SupportedStandards_LSP4");
		expect(ALL_DATA_KEYS).toHaveProperty("SupportedStandards_LSP9");
	});
});

describe("DATA_KEY_NAMES", () => {
	it("contains all keys from ALL_DATA_KEYS", () => {
		const keys = Object.keys(ALL_DATA_KEYS);
		expect(DATA_KEY_NAMES).toHaveLength(keys.length);
		for (const key of keys) {
			expect(DATA_KEY_NAMES).toContain(key);
		}
	});

	it("is a non-empty array", () => {
		expect(DATA_KEY_NAMES.length).toBeGreaterThan(0);
	});
});

describe("BUILT_IN_DATA_KEYS", () => {
	it("contains [name, hex] pairs matching ALL_DATA_KEYS", () => {
		expect(BUILT_IN_DATA_KEYS).toHaveLength(Object.keys(ALL_DATA_KEYS).length);
		for (const [name, hex] of BUILT_IN_DATA_KEYS) {
			expect(ALL_DATA_KEYS).toHaveProperty(
				name,
				expect.stringMatching(/^0x[0-9a-fA-F]+$/),
			);
			expect(hex).toBe(
				(ALL_DATA_KEYS as Record<string, string>)[name as string],
			);
		}
	});
});

describe("ALL_DATA_KEYS includes per-LSP constants", () => {
	it("includes LSP1 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP1UniversalReceiverDelegate");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP1UniversalReceiverDelegatePrefix");
	});

	it("includes LSP3 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP3Profile");
		expect(ALL_DATA_KEYS).toHaveProperty("SupportedStandards_LSP3");
	});

	it("includes LSP4 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4TokenName");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4TokenSymbol");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4TokenType");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4Metadata");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP4CreatorsMap");
	});

	it("includes LSP5 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP5ReceivedAssetsMap");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP5ReceivedAssets[]");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP5ReceivedAssets[number]");
	});

	it("includes LSP6 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("AddressPermissions:Permissions");
		expect(ALL_DATA_KEYS).toHaveProperty("AddressPermissions:AllowedCalls");
		expect(ALL_DATA_KEYS).toHaveProperty(
			"AddressPermissions:AllowedERC725YDataKeys",
		);
	});

	it("includes LSP8 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP8TokenIdFormat");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP8TokenMetadataBaseURI");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP8ReferenceContract");
	});

	it("includes LSP9 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("SupportedStandards_LSP9");
	});

	it("includes LSP10 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP10VaultsMap");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP10Vaults[]");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP10Vaults[number]");
	});

	it("includes LSP12 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP12IssuedAssetsMap");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP12IssuedAssets[]");
		expect(ALL_DATA_KEYS).toHaveProperty("LSP12IssuedAssets[number]");
	});

	it("includes LSP17 keys", () => {
		expect(ALL_DATA_KEYS).toHaveProperty("LSP17ExtensionPrefix");
	});
});
