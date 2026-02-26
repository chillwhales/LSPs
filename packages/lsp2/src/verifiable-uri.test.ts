import { concat, Hex, hexToString, keccak256, stringToHex } from "viem";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  computeVerificationHash,
  decodeVerifiableUri,
  encodeVerifiableUri,
  isVerifiableUri,
  parseVerifiableUri,
} from "./verifiable-uri";

// ============================================================================
// Test Data
// ============================================================================

const simpleData = { name: "Test", value: 123 };
const simpleDataJson = JSON.stringify(simpleData);
const simpleDataHash = keccak256(stringToHex(simpleDataJson));

const testIpfsUrl = "ipfs://QmTest123456789abcdef";

const testSchema = z.object({
  name: z.string(),
  value: z.number(),
});

// ============================================================================
// encodeVerifiableUri Tests
// ============================================================================

describe("encodeVerifiableUri", () => {
  it("should produce valid hex output starting with 0x0000", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);

    expect(encoded.startsWith("0x0000")).toBe(true);
  });

  it("should contain correct method ID 0x8019f9b1 for keccak256(bytes)", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);

    const methodId = encoded.slice(6, 14);
    expect(methodId).toBe("8019f9b1");
  });

  it("should include hash length prefix 0x0020", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);

    const hashLength = encoded.slice(14, 18);
    expect(hashLength).toBe("0020");
  });

  it("should embed correctly computed hash", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);

    const embeddedHash = ("0x" + encoded.slice(18, 82)) as Hex;
    expect(embeddedHash.toLowerCase()).toBe(simpleDataHash.toLowerCase());
  });

  it("should correctly encode URL", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);

    const urlHex = ("0x" + encoded.slice(82)) as Hex;
    const decodedUrl = hexToString(urlHex);
    expect(decodedUrl).toBe(testIpfsUrl);
  });

  it("should work with various object types", () => {
    const nestedData = {
      outer: {
        inner: {
          value: [1, 2, 3],
        },
      },
    };

    const encoded = encodeVerifiableUri(nestedData, testIpfsUrl);
    expect(encoded.startsWith("0x0000")).toBe(true);

    const expectedHash = keccak256(stringToHex(JSON.stringify(nestedData)));
    const embeddedHash = ("0x" + encoded.slice(18, 82)) as Hex;
    expect(embeddedHash.toLowerCase()).toBe(expectedHash.toLowerCase());
  });

  it("should handle empty objects", () => {
    const encoded = encodeVerifiableUri({}, testIpfsUrl);
    expect(encoded.startsWith("0x0000")).toBe(true);
  });

  it("should handle arrays", () => {
    const encoded = encodeVerifiableUri([1, 2, 3], testIpfsUrl);
    expect(encoded.startsWith("0x0000")).toBe(true);
  });
});

// ============================================================================
// parseVerifiableUri Tests
// ============================================================================

describe("parseVerifiableUri", () => {
  it("should correctly extract method, hash, and URL", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
    const parsed = parseVerifiableUri(encoded);

    expect(parsed.verificationMethod).toBe("0x8019f9b1");
    expect(parsed.verificationData.toLowerCase()).toBe(
      simpleDataHash.toLowerCase(),
    );
    expect(parsed.url).toBe(testIpfsUrl);
  });

  it("should throw Error on value too short", () => {
    const shortValue = "0x00008019f9b10020" as Hex;

    expect(() => parseVerifiableUri(shortValue)).toThrow(Error);
    expect(() => parseVerifiableUri(shortValue)).toThrow(/too short/);
  });

  it("should throw Error on invalid reserved prefix", () => {
    const wrongPrefix =
      "0xffff8019f9b100200000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;

    expect(() => parseVerifiableUri(wrongPrefix)).toThrow(Error);
    expect(() => parseVerifiableUri(wrongPrefix)).toThrow(/reserved prefix/);
  });

  it("should handle URLs with special characters", () => {
    const specialUrl = "ipfs://QmTest?query=value&other=123";
    const encoded = encodeVerifiableUri(simpleData, specialUrl);
    const parsed = parseVerifiableUri(encoded);

    expect(parsed.url).toBe(specialUrl);
  });
});

// ============================================================================
// decodeVerifiableUri Tests
// ============================================================================

describe("decodeVerifiableUri", () => {
  it("should return typed object and URL for valid input", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
    const result = decodeVerifiableUri(encoded, simpleDataJson, testSchema);

    expect(result.data).toEqual(simpleData);
    expect(result.url).toBe(testIpfsUrl);
  });

  it("should throw Error on hash mismatch", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
    const tamperedJson = JSON.stringify({ name: "Tampered", value: 999 });

    expect(() =>
      decodeVerifiableUri(encoded, tamperedJson, testSchema),
    ).toThrow(Error);
    expect(() =>
      decodeVerifiableUri(encoded, tamperedJson, testSchema),
    ).toThrow(/hash mismatch/);
  });

  it("should throw Error on invalid VerifiableURI format", () => {
    const invalidHex = "0x1234" as Hex;

    expect(() =>
      decodeVerifiableUri(invalidHex, simpleDataJson, testSchema),
    ).toThrow(Error);
  });

  it("should throw Error on schema validation failure", () => {
    const wrongData = { wrong: "data" };
    const encoded = encodeVerifiableUri(wrongData, testIpfsUrl);
    const wrongJson = JSON.stringify(wrongData);

    expect(() => decodeVerifiableUri(encoded, wrongJson, testSchema)).toThrow(
      Error,
    );
    expect(() => decodeVerifiableUri(encoded, wrongJson, testSchema)).toThrow(
      /Schema validation failed/,
    );
  });

  it("should throw Error on invalid JSON content", () => {
    const invalidJson = "not valid json {{{";
    const invalidJsonHex = stringToHex(invalidJson);
    const invalidJsonHash = keccak256(invalidJsonHex);

    const urlHex = stringToHex(testIpfsUrl);
    const manualEncoded = concat([
      "0x0000",
      "0x8019f9b1",
      "0x0020",
      invalidJsonHash,
      urlHex,
    ]);

    expect(() => decodeVerifiableUri(manualEncoded, invalidJson)).toThrow(
      Error,
    );
    expect(() => decodeVerifiableUri(manualEncoded, invalidJson)).toThrow(
      /Invalid JSON/,
    );
  });

  it("should work without schema (returns untyped)", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
    const result = decodeVerifiableUri<typeof simpleData>(
      encoded,
      simpleDataJson,
    );

    expect(result.data).toEqual(simpleData);
    expect(result.url).toBe(testIpfsUrl);
  });

  it("should throw on unsupported verification method", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
    const modified = ("0x0000ffffffff" + encoded.slice(14)) as Hex;

    expect(() => decodeVerifiableUri(modified, simpleDataJson)).toThrow(Error);
    expect(() => decodeVerifiableUri(modified, simpleDataJson)).toThrow(
      /Unsupported verification method/,
    );
  });
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe("round-trip", () => {
  it("should encode and decode to same data", () => {
    const originalData = {
      LSP29EncryptedAsset: {
        version: "1.0.0",
        id: "test-content",
        title: "Test Content",
        revision: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        file: {
          type: "image/png",
          name: "test.png",
          size: 1024,
          hash: "0xabc123",
        },
        encryption: {
          method: "lit-digital-asset-balance-v1",
          ciphertext: "encrypted",
          dataToEncryptHash: "hash",
          accessControlConditions: [],
          decryptionCode: "code",
          decryptionParams: {
            tokenAddress: "0x1234567890123456789012345678901234567890",
            requiredBalance: "1000",
          },
        },
        chunks: {
          cids: ["QmTest"],
          iv: "testiv",
          totalSize: 1024,
        },
      },
    };

    const ipfsUrl = "ipfs://QmRoundTripTest";
    const jsonString = JSON.stringify(originalData);

    const encoded = encodeVerifiableUri(originalData, ipfsUrl);
    const decoded = decodeVerifiableUri<typeof originalData>(
      encoded,
      jsonString,
    );

    expect(decoded.data).toEqual(originalData);
    expect(decoded.url).toBe(ipfsUrl);
  });

  it("should preserve exact JSON structure", () => {
    const data = { a: 1, b: { c: [1, 2, 3] } };
    const jsonString = JSON.stringify(data);
    const ipfsUrl = "ipfs://QmPreserveStructure";

    const encoded = encodeVerifiableUri(data, ipfsUrl);
    const decoded = decodeVerifiableUri<typeof data>(encoded, jsonString);

    expect(JSON.stringify(decoded.data)).toBe(jsonString);
  });
});

// ============================================================================
// computeVerificationHash Tests
// ============================================================================

describe("computeVerificationHash", () => {
  it("should compute correct keccak256 hash", () => {
    const hash = computeVerificationHash(simpleData);
    expect(hash).toBe(simpleDataHash);
  });

  it("should produce different hashes for different data", () => {
    const hash1 = computeVerificationHash({ value: 1 });
    const hash2 = computeVerificationHash({ value: 2 });

    expect(hash1).not.toBe(hash2);
  });
});

// ============================================================================
// isVerifiableUri Tests
// ============================================================================

describe("isVerifiableUri", () => {
  it("should return true for valid VerifiableURI", () => {
    const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
    expect(isVerifiableUri(encoded)).toBe(true);
  });

  it("should return false for value too short", () => {
    expect(isVerifiableUri("0x1234" as Hex)).toBe(false);
  });

  it("should return false for wrong prefix", () => {
    const wrongPrefix =
      "0xffff8019f9b1002000000000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;
    expect(isVerifiableUri(wrongPrefix)).toBe(false);
  });

  it("should return true for valid structure regardless of content", () => {
    const validStructure =
      "0x00008019f9b1002000000000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374" as Hex;
    expect(isVerifiableUri(validStructure)).toBe(true);
  });
});
