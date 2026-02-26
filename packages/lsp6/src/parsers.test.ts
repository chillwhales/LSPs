import type { Hex } from "viem";
import { describe, expect, it } from "vitest";

import {
  allowedCallMatches,
  isHexEqual,
  parseAllowedCalls,
  parseCompactBytesArray,
} from "./parsers";

const TEST_ADDRESS = "0x1234567890AbcdEF1234567890aBcdef12345678" as const;

describe("isHexEqual", () => {
  it("returns true for matching hex (case-insensitive)", () => {
    expect(isHexEqual("0xAbCd" as Hex, "0xabcd" as Hex)).toBe(true);
  });

  it("returns false for non-matching hex", () => {
    expect(isHexEqual("0xAbCd" as Hex, "0x1234" as Hex)).toBe(false);
  });
});

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
});

describe("parseAllowedCalls", () => {
  it("returns empty array for empty data", () => {
    const result = parseAllowedCalls("0x" as Hex, TEST_ADDRESS);
    expect(result).toEqual([]);
  });
});
