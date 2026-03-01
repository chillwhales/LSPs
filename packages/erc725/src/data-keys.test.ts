import { keccak256, slice, stringToHex } from "viem";
import { describe, expect, it } from "vitest";
import {
	computeArrayElementKey,
	computeArrayKey,
	computeMappingKey,
	computeMappingWithGroupingKey,
	computeSingletonKey,
	extractArrayIndex,
	extractArrayPrefix,
} from "./data-keys";

describe("computeSingletonKey", () => {
	it("produces keccak256 of the key name string", () => {
		const result = computeSingletonKey("LSP3Profile");
		const expected = keccak256(stringToHex("LSP3Profile"));
		expect(result).toBe(expected);
	});

	it("produces a 32-byte hex string", () => {
		const result = computeSingletonKey("SomeKey");
		expect(result).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("matches known LSP3Profile key value", () => {
		const result = computeSingletonKey("LSP3Profile");
		expect(result).toBe(
			"0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5",
		);
	});
});

describe("computeArrayKey", () => {
	it("produces same as singleton key (it is the length key)", () => {
		const singleton = computeSingletonKey("LSP5ReceivedAssets[]");
		const array = computeArrayKey("LSP5ReceivedAssets[]");
		expect(array).toBe(singleton);
	});
});

describe("computeArrayElementKey", () => {
	it("first 16 bytes match array key prefix", () => {
		const arrayKey = computeArrayKey("LSP5ReceivedAssets[]");
		const elementKey = computeArrayElementKey("LSP5ReceivedAssets[]", 0);

		const arrayPrefix = slice(arrayKey, 0, 16);
		const elementPrefix = slice(elementKey, 0, 16);
		expect(elementPrefix).toBe(arrayPrefix);
	});

	it("last 16 bytes are uint128 index for index 0", () => {
		const elementKey = computeArrayElementKey("LSP5ReceivedAssets[]", 0);
		const indexPart = slice(elementKey, 16, 32);
		expect(indexPart).toBe("0x00000000000000000000000000000000");
	});

	it("last 16 bytes are uint128 index for index 1", () => {
		const elementKey = computeArrayElementKey("LSP5ReceivedAssets[]", 1);
		const indexPart = slice(elementKey, 16, 32);
		expect(indexPart).toBe("0x00000000000000000000000000000001");
	});

	it("handles large indices", () => {
		const elementKey = computeArrayElementKey("Test[]", 1000000n);
		const indexPart = slice(elementKey, 16, 32);
		expect(BigInt(indexPart)).toBe(1000000n);
	});

	it("produces a 32-byte result", () => {
		const result = computeArrayElementKey("Test[]", 42);
		expect(result).toHaveLength(66);
	});
});

describe("computeMappingKey", () => {
	it("first 10 bytes from keccak256(keyName)", () => {
		const keyHash = keccak256(stringToHex("LSP5ReceivedAssetsMap"));
		const expectedPrefix = slice(keyHash, 0, 10);
		const mappingKey = computeMappingKey(
			"LSP5ReceivedAssetsMap",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		const actualPrefix = slice(mappingKey, 0, 10);
		expect(actualPrefix).toBe(expectedPrefix);
	});

	it("middle 2 bytes are 0x0000", () => {
		const mappingKey = computeMappingKey(
			"LSP5ReceivedAssetsMap",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		const middleBytes = slice(mappingKey, 10, 12);
		expect(middleBytes).toBe("0x0000");
	});

	it("uses address directly when 20 bytes", () => {
		const address = "0x1234567890abcdef1234567890abcdef12345678";
		const mappingKey = computeMappingKey("TestMap", address);
		const lastPart = slice(mappingKey, 12, 32);
		expect(lastPart).toBe(address);
	});

	it("hashes string mapKey to 20 bytes", () => {
		const mappingKey = computeMappingKey("TestMap", "SomeString");
		const expectedHash = slice(keccak256(stringToHex("SomeString")), 0, 20);
		const lastPart = slice(mappingKey, 12, 32);
		expect(lastPart).toBe(expectedHash);
	});

	it("produces a 32-byte result", () => {
		const result = computeMappingKey(
			"TestMap",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		expect(result).toHaveLength(66);
	});
});

describe("computeMappingWithGroupingKey", () => {
	it("produces a 32-byte result", () => {
		const result = computeMappingWithGroupingKey(
			"TestMapping",
			"GroupName",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		expect(result).toHaveLength(66);
	});

	it("first 6 bytes from keccak256(keyName)", () => {
		const keyHash = keccak256(stringToHex("TestMapping"));
		const expectedPrefix = slice(keyHash, 0, 6);
		const result = computeMappingWithGroupingKey(
			"TestMapping",
			"Group",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		const actualPrefix = slice(result, 0, 6);
		expect(actualPrefix).toBe(expectedPrefix);
	});

	it("next 4 bytes from keccak256(firstPart)", () => {
		const groupHash = keccak256(stringToHex("Group"));
		const expectedGroup = slice(groupHash, 0, 4);
		const result = computeMappingWithGroupingKey(
			"TestMapping",
			"Group",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		const actualGroup = slice(result, 6, 10);
		expect(actualGroup).toBe(expectedGroup);
	});

	it("has 0x0000 padding after group", () => {
		const result = computeMappingWithGroupingKey(
			"TestMapping",
			"Group",
			"0x1234567890abcdef1234567890abcdef12345678",
		);
		const padding = slice(result, 10, 12);
		expect(padding).toBe("0x0000");
	});

	it("uses address directly when 20 bytes", () => {
		const address = "0x1234567890abcdef1234567890abcdef12345678";
		const result = computeMappingWithGroupingKey(
			"TestMapping",
			"Group",
			address,
		);
		const lastPart = slice(result, 12, 32);
		expect(lastPart).toBe(address);
	});
});

describe("extractArrayPrefix", () => {
	it("extracts first 16 bytes from a data key", () => {
		const key =
			"0x6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b";
		const prefix = extractArrayPrefix(key);
		expect(prefix).toBe("0x6460ee3c0aac563ccbf76d6e1d07bada");
	});
});

describe("extractArrayIndex", () => {
	it("extracts uint128 index from last 16 bytes", () => {
		const elementKey = computeArrayElementKey("Test[]", 42n);
		const index = extractArrayIndex(elementKey);
		expect(index).toBe(42n);
	});

	it("roundtrip: computeArrayElementKey -> extractArrayIndex", () => {
		for (const idx of [0n, 1n, 42n, 255n, 1000000n]) {
			const elementKey = computeArrayElementKey("LSP5ReceivedAssets[]", idx);
			expect(extractArrayIndex(elementKey)).toBe(idx);
		}
	});

	it("extracts 0 for index 0", () => {
		const elementKey = computeArrayElementKey("Test[]", 0);
		expect(extractArrayIndex(elementKey)).toBe(0n);
	});
});
