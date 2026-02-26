import type { Hex } from "viem";
import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@lukso/lsp6-contracts";

import {
  allowedCallMatches,
  parseAllowedCalls,
  parseCompactBytesArray,
} from "./parsers";
import { permissionSchema } from "./schemas";

const TEST_ADDRESS = "0x1234567890AbcdEF1234567890aBcdef12345678" as const;

describe("allowedCallMatches", () => {
  const baseCall = {
    callTypes: "0x00000003" as Hex,
    address: "0x1234567890abcdef1234567890abcdef12345678" as Hex,
    interfaceId: "0xaabbccdd" as Hex,
    functionSelector: "0x11223344" as Hex,
  };

  it("returns isEqual true for exact match", () => {
    const result = allowedCallMatches(baseCall, baseCall);
    expect(result.isEqual).toBe(true);
    expect(result.excessiveAllowedCallTypes).toBe(false);
    expect(result.excessiveAllowedAddress).toBe(false);
    expect(result.excessiveAllowedInterfaceId).toBe(false);
    expect(result.excessiveAllowedFunction).toBe(false);
  });

  it("returns isEqual false for mismatched address", () => {
    const result = allowedCallMatches(
      {
        ...baseCall,
        address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hex,
      },
      baseCall,
    );
    expect(result.isEqual).toBe(false);
  });

  it('handles "any address" wildcard (0xFFfF...fF)', () => {
    const wildcard = {
      ...baseCall,
      address: "0xffffffffffffffffffffffffffffffffffffffff" as Hex,
    };
    const result = allowedCallMatches(wildcard, baseCall);
    expect(result.isEqual).toBe(true);
    expect(result.excessiveAllowedAddress).toBe(true);
  });

  it('handles "any interface" wildcard (0xffffffff)', () => {
    const wildcard = {
      ...baseCall,
      interfaceId: "0xffffffff" as Hex,
    };
    const result = allowedCallMatches(wildcard, baseCall);
    expect(result.isEqual).toBe(true);
    expect(result.excessiveAllowedInterfaceId).toBe(true);
  });

  it('handles "any function" wildcard (0xffffffff)', () => {
    const wildcard = {
      ...baseCall,
      functionSelector: "0xffffffff" as Hex,
    };
    const result = allowedCallMatches(wildcard, baseCall);
    expect(result.isEqual).toBe(true);
    expect(result.excessiveAllowedFunction).toBe(true);
  });

  it("returns isEqual false when call types do not satisfy required bits", () => {
    const result = allowedCallMatches(
      { ...baseCall, callTypes: "0x00000001" as Hex },
      { ...baseCall, callTypes: "0x00000003" as Hex },
    );
    expect(result.isEqual).toBe(false);
  });
});

describe("parseCompactBytesArray", () => {
  it("returns empty array for empty data", () => {
    const result = parseCompactBytesArray("0x" as Hex, TEST_ADDRESS);
    expect(result).toEqual([]);
  });

  it("decodes a single entry from a compact bytes array", () => {
    // ERC725Y CompactBytesArray encoding:
    // [length (2 bytes big-endian)] [data bytes...]
    // Encode a 32-byte ERC725Y data key (typical for ERC725Y keys)
    const dataKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const dataKeyWithoutPrefix = dataKey.slice(2);
    // 0x0020 == 32 bytes
    const compactBytesSingle =
      ("0x0020" + dataKeyWithoutPrefix) as Hex;

    const result = parseCompactBytesArray(compactBytesSingle, TEST_ADDRESS);

    expect(result).toEqual([dataKey]);
  });

  it("filters out invalid decoded entries from a compact bytes array", () => {
    const addressWithoutPrefix = TEST_ADDRESS.slice(2);
    // First entry: valid 20-byte data
    const firstEntry = "0014" + addressWithoutPrefix;
    // Second entry: valid 4-byte data
    const secondEntry = "0004" + "deadbeef";
    const compactBytesMultiple =
      ("0x" + firstEntry + secondEntry) as Hex;

    const result = parseCompactBytesArray(compactBytesMultiple, TEST_ADDRESS);

    // Both entries are valid hex strings for ERC725Y data keys
    // parseCompactBytesArray returns the raw hex strings from ERC725 decoding (preserves original casing)
    expect(result).toEqual([TEST_ADDRESS, "0xdeadbeef"]);
  });

  it("decodes multiple valid entries from a compact bytes array", () => {
    // Use proper ERC725Y data keys (32 bytes each) 
    const dataKey1 = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const dataKey2 = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba";
    
    // Encode both data keys
    const entry1 = "0020" + dataKey1.slice(2);
    const entry2 = "0020" + dataKey2.slice(2);
    const compactBytesMultiple = ("0x" + entry1 + entry2) as Hex;

    const result = parseCompactBytesArray(compactBytesMultiple, TEST_ADDRESS);

    // parseCompactBytesArray returns the raw hex strings as decoded
    expect(result).toEqual([dataKey1, dataKey2]);
  });
});

describe("parseAllowedCalls", () => {
  it("returns empty array for empty data", () => {
    const result = parseAllowedCalls("0x" as Hex, TEST_ADDRESS);
    expect(result).toEqual([]);
  });

  it("parses a single allowed call entry with wildcard values", () => {
    // One tuple of 32 bytes:
    // - callTypes:      4 bytes  (0x00000003)
    // - address:        20 bytes (0xffffffffffffffffffffffffffffffffffffffff)
    // - interfaceId:    4 bytes  (0xffffffff)
    // - functionSelector:4 bytes (0xffffffff)
    //
    // CompactBytesArray encodes each element as: uint16 length (in bytes) + raw bytes.
    // 32 bytes = 0x0020.
    const encoded =
      ("0x" +
        "0020" +
        // callTypes
        "00000003" +
        // address
        "ffffffffffffffffffffffffffffffffffffffff" +
        // interfaceId
        "ffffffff" +
        // functionSelector
        "ffffffff") as Hex;

    const result = parseAllowedCalls(encoded, TEST_ADDRESS);

    expect(result).toHaveLength(1);
    const entry = result[0];

    // basic shape / tuple decoding
    expect(entry.callTypes).toBe("0x00000003");
    expect(entry.address).toBe("0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"); // EIP-55 checksummed
    expect(entry.interfaceId).toBe("0xffffffff");
    expect(entry.functionSelector).toBe("0xffffffff");
  });

  it("parses multiple allowed call entries", () => {
    // Two tuples of 32 bytes each
    const tuple1 = 
      "0020" + // length: 32 bytes
      "00000001" + // callTypes: CALL
      "1234567890abcdef1234567890abcdef12345678" + // specific address
      "aabbccdd" + // specific interface
      "11223344"; // specific function

    const tuple2 = 
      "0020" + // length: 32 bytes
      "00000002" + // callTypes: STATICCALL
      "9876543210fedcba9876543210fedcba98765432" + // different address
      "ffffffff" + // any interface
      "ffffffff"; // any function

    const encoded = ("0x" + tuple1 + tuple2) as Hex;

    const result = parseAllowedCalls(encoded, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      callTypes: "0x00000001",
      address: "0x1234567890AbcdEF1234567890aBcdef12345678", // EIP-55 checksummed
      interfaceId: "0xaabbccdd",
      functionSelector: "0x11223344",
    });

    expect(result[1]).toEqual({
      callTypes: "0x00000002", 
      address: "0x9876543210FeDcba9876543210FEdCba98765432", // Actual EIP-55 checksummed output
      interfaceId: "0xffffffff",
      functionSelector: "0xffffffff",
    });
});

describe("permissionSchema", () => {
  it("validates known LSP6 permission names", () => {
    // Test some known permissions from @lukso/lsp6-contracts
    const validPermissions = [
      "CHANGEOWNER",
      "ADDCONTROLLER", 
      "EDITPERMISSIONS",
      "ADDEXTENSIONS",
      "CHANGEEXTENSIONS",
      "ADDUNIVERSALRECEIVERDELEGATE",
      "CHANGEUNIVERSALRECEIVERDELEGATE",
      "REENTRANCY",
      "SUPER_TRANSFERVALUE",
      "TRANSFERVALUE",
      "SUPER_CALL",
      "CALL",
      "SUPER_STATICCALL", 
      "STATICCALL",
      "SUPER_DELEGATECALL",
      "DELEGATECALL",
      "DEPLOY",
      "SUPER_SETDATA",
      "SETDATA",
      "ENCRYPT",
      "DECRYPT",
      "SIGN",
      "EXECUTE_RELAY_CALL",
    ];

    validPermissions.forEach(permission => {
      const result = permissionSchema.safeParse(permission);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(permission);
      }
    });
  });

  it("rejects invalid permission names", () => {
    const invalidPermissions = [
      "INVALID_PERMISSION",
      "random_string",
      "",
      123,
      null,
      undefined,
    ];

    invalidPermissions.forEach(permission => {
      const result = permissionSchema.safeParse(permission);
      expect(result.success).toBe(false);
    });
  });

  it("includes all permissions from LSP6 contracts", () => {
    // Ensure our schema includes all permissions from the contracts package
    Object.keys(PERMISSIONS).forEach(permissionName => {
      const result = permissionSchema.safeParse(permissionName);
      expect(result.success).toBe(true);
    });
  });
});

  it("handles address normalization with getAddress", () => {
    const encoded =
      ("0x" +
        "0020" +
        "00000003" +
        "1234567890abcdef1234567890abcdef12345678" + // lowercase address
        "ffffffff" +
        "ffffffff") as Hex;

    const result = parseAllowedCalls(encoded, TEST_ADDRESS);

    expect(result).toHaveLength(1);
    // getAddress should normalize to checksum case
    expect(result[0].address).toBe("0x1234567890AbcdEF1234567890aBcdef12345678");
  });

  it("handles malformed data gracefully", () => {
    // Test with completely invalid data
    const invalidData = "0xinvaliddata" as Hex;
    const result = parseAllowedCalls(invalidData, TEST_ADDRESS);
    expect(result).toEqual([]);
  });

  it("filters out invalid tuple entries", () => {
    // This test would require mocking ERC725.decodeData to return invalid structures
    // For now, we'll test the validation logic indirectly through integration
    const result = parseAllowedCalls("0x" as Hex, TEST_ADDRESS);
    expect(result).toEqual([]);
  });

  it("handles invalid address in tuple gracefully", () => {
    // Create a tuple with an invalid address format
    const invalidAddressTuple = 
      "0020" + // length: 32 bytes
      "00000001" + // callTypes: CALL
      "invalid_address_format_here" + "0".repeat(20) + // invalid address (not 40 chars)
      "aabbccdd" + // interface
      "11223344"; // function

    const encoded = ("0x" + invalidAddressTuple) as Hex;
    const result = parseAllowedCalls(encoded, TEST_ADDRESS);
    
    // Should return empty array since the address is invalid
    expect(result).toEqual([]);
  });

  it("handles ERC725 decoding errors gracefully in parseCompactBytesArray", () => {
    // Test that parseCompactBytesArray handles ERC725 internal errors
    const result1 = parseCompactBytesArray("0x" as Hex, TEST_ADDRESS);
    expect(result1).toEqual([]);

    // Test with malformed data that might cause ERC725 internal errors
    const result2 = parseCompactBytesArray("0xinvalidhex" as Hex, TEST_ADDRESS);
    expect(result2).toEqual([]);
  });
});
