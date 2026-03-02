import { keccak256, slice, stringToHex } from "viem";
import { describe, expect, it } from "vitest";
import {
	checkPermissions,
	decodeData,
	decodeMappingKey,
	decodePermissions,
	decodeValueType,
	encodeArrayElementKey,
	encodeData,
	encodeKeyName,
	encodePermissions,
	encodeValueType,
	extractArrayIndex,
	extractArrayPrefix,
	getSchema,
} from "./data-keys";

// ============================================================================
// encodeKeyName Tests
// ============================================================================

describe("encodeKeyName", () => {
	it("produces keccak256 for Singleton key names", () => {
		const result = encodeKeyName("LSP3Profile");
		const expected = keccak256(stringToHex("LSP3Profile"));
		expect(result).toBe(expected);
	});

	it("produces a 32-byte hex string", () => {
		const result = encodeKeyName("SomeKey");
		expect(result).toMatch(/^0x[0-9a-fA-F]{64}$/);
	});

	it("matches known LSP3Profile key value", () => {
		const result = encodeKeyName("LSP3Profile");
		expect(result).toBe(
			"0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5",
		);
	});

	it("produces Array length key (same as singleton)", () => {
		const singleton = encodeKeyName("LSP5ReceivedAssets[]");
		const expected = keccak256(stringToHex("LSP5ReceivedAssets[]"));
		expect(singleton).toBe(expected);
	});

	it("produces Mapping key with address", () => {
		const address = "0xcafecafecafecafecafecafecafecafecafecafe";
		const mappingKey = encodeKeyName("LSP5ReceivedAssetsMap:<address>", [
			address,
		]);
		expect(mappingKey).toHaveLength(66); // 32 bytes

		// First 10 bytes from keccak256 of the key name prefix
		const keyHash = keccak256(stringToHex("LSP5ReceivedAssetsMap"));
		const expectedPrefix = slice(keyHash, 0, 10);
		expect(slice(mappingKey, 0, 10)).toBe(expectedPrefix);

		// Middle 2 bytes should be 0x0000
		expect(slice(mappingKey, 10, 12)).toBe("0x0000");
	});

	it("produces MappingWithGrouping key", () => {
		const address = "0xcafecafecafecafecafecafecafecafecafecafe";
		const key = encodeKeyName("AddressPermissions:Permissions:<address>", [
			address,
		]);
		expect(key).toHaveLength(66); // 32 bytes
	});
});

// ============================================================================
// encodeArrayElementKey Tests
// ============================================================================

describe("encodeArrayElementKey", () => {
	it("produces array element keys from length key", () => {
		const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
		const elem0 = encodeArrayElementKey(arrayKey, 0);
		expect(elem0).toHaveLength(66);

		// First 16 bytes should match
		expect(slice(elem0, 0, 16)).toBe(slice(arrayKey, 0, 16));
		// Last 16 bytes should be zero for index 0
		expect(slice(elem0, 16, 32)).toBe("0x00000000000000000000000000000000");
	});

	it("encodes non-zero index correctly", () => {
		const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
		const elem5 = encodeArrayElementKey(arrayKey, 5);
		expect(slice(elem5, 16, 32)).toBe("0x00000000000000000000000000000005");
	});

	it("encodes large index correctly", () => {
		const arrayKey = encodeKeyName("Test[]");
		const elem = encodeArrayElementKey(arrayKey, 255);
		expect(slice(elem, 16, 32)).toBe("0x000000000000000000000000000000ff");
	});
});

// ============================================================================
// decodeMappingKey Tests
// ============================================================================

describe("decodeMappingKey", () => {
	it("decodes a mapping key back to its dynamic parts", () => {
		const address = "0xcafecafecafecafecafecafecafecafecafecafe";
		const mappingKey = encodeKeyName("LSP5ReceivedAssetsMap:<address>", [
			address,
		]);
		const parts = decodeMappingKey(
			mappingKey,
			"LSP5ReceivedAssetsMap:<address>",
		);
		expect(parts).toBeDefined();
		expect(parts.length).toBeGreaterThan(0);
		expect(parts[0]?.value?.toString().toLowerCase()).toBe(
			address.toLowerCase(),
		);
	});
});

// ============================================================================
// encodeData / decodeData Tests
// ============================================================================

describe("encodeData / decodeData", () => {
	const schemas = [
		{
			name: "TestKey",
			key: keccak256(stringToHex("TestKey")),
			keyType: "Singleton",
			valueType: "uint256",
			valueContent: "Number",
		},
	];

	it("encodes data with schemas", () => {
		const result = encodeData([{ keyName: "TestKey", value: 42 }], schemas);
		expect(result.keys).toHaveLength(1);
		expect(result.values).toHaveLength(1);
		expect(result.keys[0]).toBe(schemas[0].key);
	});

	it("decodes data back", () => {
		const encoded = encodeData([{ keyName: "TestKey", value: 42 }], schemas);
		const decoded = decodeData(
			[{ keyName: "TestKey", value: encoded.values[0] }],
			schemas,
		);
		expect(decoded).toHaveLength(1);
		// erc725.js decodes uint256 as bigint
		expect(decoded[0]?.value).toBe(42n);
	});
});

// ============================================================================
// Permissions Tests
// ============================================================================

describe("encodePermissions / decodePermissions", () => {
	it("encodes permissions to bytes32", () => {
		const encoded = encodePermissions({ CALL: true, SETDATA: true });
		expect(encoded).toMatch(/^0x[0-9a-fA-F]{64}$/);
	});

	it("roundtrips encode → decode", () => {
		const permissions = { CALL: true, SETDATA: true };
		const encoded = encodePermissions(permissions);
		const decoded = decodePermissions(encoded);
		expect(decoded.CALL).toBe(true);
		expect(decoded.SETDATA).toBe(true);
		expect(decoded.CHANGEOWNER).toBe(false);
	});
});

describe("checkPermissions", () => {
	it("returns true when required perms are included", () => {
		const required = encodePermissions({ CALL: true });
		const granted = encodePermissions({ CALL: true, SETDATA: true });
		expect(checkPermissions(required, granted)).toBe(true);
	});

	it("returns false when required perms are missing", () => {
		const required = encodePermissions({ CALL: true, DEPLOY: true });
		const granted = encodePermissions({ CALL: true });
		expect(checkPermissions(required, granted)).toBe(false);
	});
});

// ============================================================================
// Value Encoding Tests
// ============================================================================

describe("encodeValueType / decodeValueType", () => {
	it("encodes and decodes uint256", () => {
		const encoded = encodeValueType("uint256", 42);
		expect(encoded).toMatch(/^0x/);
		const decoded = decodeValueType("uint256", encoded);
		// erc725.js returns bigint for uint256
		expect(decoded).toBe(42n);
	});

	it("encodes and decodes address", () => {
		// erc725.js requires properly checksummed addresses
		const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
		const encoded = encodeValueType("address", address);
		const decoded = decodeValueType("address", encoded);
		expect((decoded as string).toLowerCase()).toBe(address.toLowerCase());
	});

	it("encodes and decodes bool", () => {
		const encoded = encodeValueType("bool", true);
		const decoded = decodeValueType("bool", encoded);
		expect(decoded).toBe(true);
	});
});

// ============================================================================
// getSchema Tests
// ============================================================================

describe("getSchema", () => {
	const schemas = [
		{
			name: "LSP3Profile",
			key: "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5",
			keyType: "Singleton",
			valueType: "bytes",
			valueContent: "VerifiableURI",
		},
	];

	it("finds a schema by key hash", () => {
		const result = getSchema(
			"0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5",
			schemas,
		);
		expect(result).toBeDefined();
		expect(result?.name).toBe("LSP3Profile");
	});

	it("returns null for unknown key", () => {
		const result = getSchema(
			"0x0000000000000000000000000000000000000000000000000000000000000001",
			schemas,
		);
		expect(result).toBeNull();
	});
});

// ============================================================================
// extractArrayPrefix Tests
// ============================================================================

describe("extractArrayPrefix", () => {
	it("extracts first 16 bytes from a data key", () => {
		const key =
			"0x6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b";
		const prefix = extractArrayPrefix(key);
		expect(prefix).toBe("0x6460ee3c0aac563ccbf76d6e1d07bada");
	});
});

// ============================================================================
// extractArrayIndex Tests
// ============================================================================

describe("extractArrayIndex", () => {
	it("extracts uint128 index from array element key", () => {
		const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
		const elementKey = encodeArrayElementKey(arrayKey, 42);
		const index = extractArrayIndex(elementKey);
		expect(index).toBe(42n);
	});

	it("roundtrip: encodeArrayElementKey → extractArrayIndex", () => {
		const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
		for (const idx of [0, 1, 42, 255, 1000]) {
			const elementKey = encodeArrayElementKey(arrayKey, idx);
			expect(extractArrayIndex(elementKey)).toBe(BigInt(idx));
		}
	});

	it("extracts 0 for index 0", () => {
		const arrayKey = encodeKeyName("LSP5ReceivedAssets[]");
		const elementKey = encodeArrayElementKey(arrayKey, 0);
		expect(extractArrayIndex(elementKey)).toBe(0n);
	});
});
