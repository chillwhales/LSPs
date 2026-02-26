import { describe, expect, it } from "vitest";

import {
  buildAllowedCallsKey,
  buildAllowedDataKeysKey,
  buildPermissionsKey,
} from "./key-builders";

const TEST_ADDRESS = "0x1234567890AbcdEF1234567890aBcdef12345678" as const;

describe("buildPermissionsKey", () => {
  it("returns a 32-byte hex string (66 chars with 0x prefix)", () => {
    const key = buildPermissionsKey(TEST_ADDRESS);
    expect(key).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("starts with the LSP6 permissions prefix", () => {
    const key = buildPermissionsKey(TEST_ADDRESS);
    // AddressPermissions:Permissions prefix = 0x4b80742de2bf82acb3630000
    expect(key.toLowerCase()).toContain("4b80742de2bf82acb363");
  });

  it("is deterministic — same input produces same output", () => {
    const key1 = buildPermissionsKey(TEST_ADDRESS);
    const key2 = buildPermissionsKey(TEST_ADDRESS);
    expect(key1).toBe(key2);
  });
});

describe("buildAllowedDataKeysKey", () => {
  it("returns a 32-byte hex string", () => {
    const key = buildAllowedDataKeysKey(TEST_ADDRESS);
    expect(key).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("starts with the allowed data keys prefix", () => {
    const key = buildAllowedDataKeysKey(TEST_ADDRESS);
    // AddressPermissions:AllowedERC725YDataKeys prefix = 0x4b80742de2bf866c29110000
    expect(key.toLowerCase()).toContain("4b80742de2bf866c2911");
  });
});

describe("buildAllowedCallsKey", () => {
  it("returns a 32-byte hex string", () => {
    const key = buildAllowedCallsKey(TEST_ADDRESS);
    expect(key).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("starts with the allowed calls prefix", () => {
    const key = buildAllowedCallsKey(TEST_ADDRESS);
    // AddressPermissions:AllowedCalls prefix = 0x4b80742de2bf393a64c70000
    expect(key.toLowerCase()).toContain("4b80742de2bf393a64c7");
  });
});

describe("key builders produce different keys", () => {
  it("all three produce different outputs for the same address", () => {
    const permKey = buildPermissionsKey(TEST_ADDRESS);
    const dataKeysKey = buildAllowedDataKeysKey(TEST_ADDRESS);
    const callsKey = buildAllowedCallsKey(TEST_ADDRESS);

    expect(permKey).not.toBe(dataKeysKey);
    expect(permKey).not.toBe(callsKey);
    expect(dataKeysKey).not.toBe(callsKey);
  });
});
