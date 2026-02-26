/**
 * LSP23 Schema Validation Tests
 *
 * Tests for LSP23 Linked Contracts Factory schema validation:
 * - Universal Profile initialization struct validation
 * - Key Manager initialization struct validation  
 * - Complete deployment parameters validation
 * - Address, hex, and salt format validation
 * - BigInt and boolean field validation
 * - Error message verification
 */

import { describe, expect, it } from 'vitest';
import {
  universalProfileInitStructSchema,
  keyManagerInitStructSchema,
  deployParamsSchema,
} from './schemas';

// ============================================================================
// Test Fixtures
// ============================================================================

const validAddress = '0x1234567890123456789012345678901234567890';
const validHex = '0xabcdef1234567890';
const validSalt = '0x' + '12'.repeat(32); // 32-byte hex string
const validBigInt = BigInt(1000000000000000000); // 1 ETH in wei

const validUniversalProfileInitStruct = {
  salt: validSalt,
  fundingAmount: validBigInt,
  implementationContract: validAddress,
  initializationCalldata: validHex,
};

const validKeyManagerInitStruct = {
  fundingAmount: validBigInt,
  implementationContract: validAddress,
  addPrimaryContractAddress: true,
  initializationCalldata: validHex,
  extraInitializationParams: validHex,
};

const validDeployParams = {
  universalProfileInitStruct: validUniversalProfileInitStruct,
  keyManagerInitStruct: validKeyManagerInitStruct,
  initializeEncodedBytes: validHex,
};

// ============================================================================
// universalProfileInitStructSchema Tests
// ============================================================================

describe('universalProfileInitStructSchema', () => {
  it('should accept valid Universal Profile init structs', () => {
    const result = universalProfileInitStructSchema.safeParse(validUniversalProfileInitStruct);
    expect(result.success).toBe(true);
  });

  it('should accept zero funding amount', () => {
    const zeroFunding = {
      ...validUniversalProfileInitStruct,
      fundingAmount: BigInt(0),
    };
    const result = universalProfileInitStructSchema.safeParse(zeroFunding);
    expect(result.success).toBe(true);
  });

  it('should accept large funding amounts', () => {
    const largeFunding = {
      ...validUniversalProfileInitStruct,
      fundingAmount: BigInt('1000000000000000000000'), // 1000 ETH
    };
    const result = universalProfileInitStructSchema.safeParse(largeFunding);
    expect(result.success).toBe(true);
  });

  it('should reject structs missing required fields', () => {
    const missingFields = [
      { ...validUniversalProfileInitStruct, salt: undefined },
      { ...validUniversalProfileInitStruct, fundingAmount: undefined },
      { ...validUniversalProfileInitStruct, implementationContract: undefined },
      { ...validUniversalProfileInitStruct, initializationCalldata: undefined },
    ];

    for (const struct of missingFields) {
      // Remove undefined fields
      const cleanStruct = Object.fromEntries(
        Object.entries(struct).filter(([, value]) => value !== undefined)
      );
      const result = universalProfileInitStructSchema.safeParse(cleanStruct);
      expect(result.success).toBe(false);
    }
  });

  it('should reject structs with invalid salt format', () => {
    const invalidSalts = [
      { ...validUniversalProfileInitStruct, salt: '0x123' }, // too short
      { ...validUniversalProfileInitStruct, salt: '0x' + '12'.repeat(33) }, // too long
      { ...validUniversalProfileInitStruct, salt: '12'.repeat(32) }, // missing 0x prefix
      { ...validUniversalProfileInitStruct, salt: '0xgg' + '12'.repeat(31) }, // invalid hex chars
      { ...validUniversalProfileInitStruct, salt: 123 }, // not a string
    ];

    for (const struct of invalidSalts) {
      const result = universalProfileInitStructSchema.safeParse(struct);
      expect(result.success).toBe(false);
    }
  });

  it('should reject structs with invalid address format', () => {
    const invalidAddresses = [
      { ...validUniversalProfileInitStruct, implementationContract: '0x123' }, // too short
      { ...validUniversalProfileInitStruct, implementationContract: '1234567890123456789012345678901234567890' }, // missing 0x
      { ...validUniversalProfileInitStruct, implementationContract: '0xgg34567890123456789012345678901234567890' }, // invalid hex
      { ...validUniversalProfileInitStruct, implementationContract: 123 }, // not a string
    ];

    for (const struct of invalidAddresses) {
      const result = universalProfileInitStructSchema.safeParse(struct);
      expect(result.success).toBe(false);
    }
  });

  it('should reject structs with invalid funding amount types', () => {
    const invalidFunding = [
      { ...validUniversalProfileInitStruct, fundingAmount: '1000' }, // string instead of bigint
      { ...validUniversalProfileInitStruct, fundingAmount: 1000 }, // number instead of bigint
      { ...validUniversalProfileInitStruct, fundingAmount: null },
    ];

    for (const struct of invalidFunding) {
      const result = universalProfileInitStructSchema.safeParse(struct);
      expect(result.success).toBe(false);
    }
  });

  it('should reject structs with invalid hex calldata', () => {
    const invalidHex = [
      { ...validUniversalProfileInitStruct, initializationCalldata: '123' }, // missing 0x
      { ...validUniversalProfileInitStruct, initializationCalldata: '0xgg' }, // invalid hex
      { ...validUniversalProfileInitStruct, initializationCalldata: 123 }, // not a string
    ];

    for (const struct of invalidHex) {
      const result = universalProfileInitStructSchema.safeParse(struct);
      expect(result.success).toBe(false);
    }
  });

  it('should provide meaningful error messages for invalid salt', () => {
    const invalidSalt = { ...validUniversalProfileInitStruct, salt: '0x123' };
    const result = universalProfileInitStructSchema.safeParse(invalidSalt);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid value, not 32 bytes hex');
    }
  });

  it('should provide meaningful error messages for invalid address', () => {
    const invalidAddress = { ...validUniversalProfileInitStruct, implementationContract: '0x123' };
    const result = universalProfileInitStructSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid value, not an Address');
    }
  });
});

// ============================================================================
// keyManagerInitStructSchema Tests
// ============================================================================

describe('keyManagerInitStructSchema', () => {
  it('should accept valid Key Manager init structs', () => {
    const result = keyManagerInitStructSchema.safeParse(validKeyManagerInitStruct);
    expect(result.success).toBe(true);
  });

  it('should accept both true and false for addPrimaryContractAddress', () => {
    const withTrue = {
      ...validKeyManagerInitStruct,
      addPrimaryContractAddress: true,
    };
    const withFalse = {
      ...validKeyManagerInitStruct,
      addPrimaryContractAddress: false,
    };

    expect(keyManagerInitStructSchema.safeParse(withTrue).success).toBe(true);
    expect(keyManagerInitStructSchema.safeParse(withFalse).success).toBe(true);
  });

  it('should accept empty hex for extra initialization params', () => {
    const emptyExtraParams = {
      ...validKeyManagerInitStruct,
      extraInitializationParams: '0x',
    };
    const result = keyManagerInitStructSchema.safeParse(emptyExtraParams);
    expect(result.success).toBe(true);
  });

  it('should reject structs missing required fields', () => {
    const missingFields = [
      { ...validKeyManagerInitStruct, fundingAmount: undefined },
      { ...validKeyManagerInitStruct, implementationContract: undefined },
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: undefined },
      { ...validKeyManagerInitStruct, initializationCalldata: undefined },
      { ...validKeyManagerInitStruct, extraInitializationParams: undefined },
    ];

    for (const struct of missingFields) {
      // Remove undefined fields
      const cleanStruct = Object.fromEntries(
        Object.entries(struct).filter(([, value]) => value !== undefined)
      );
      const result = keyManagerInitStructSchema.safeParse(cleanStruct);
      expect(result.success).toBe(false);
    }
  });

  it('should reject structs with invalid boolean type', () => {
    const invalidBooleans = [
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: 'true' }, // string instead of boolean
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: 1 }, // number instead of boolean
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: null },
    ];

    for (const struct of invalidBooleans) {
      const result = keyManagerInitStructSchema.safeParse(struct);
      expect(result.success).toBe(false);
    }
  });

  it('should provide meaningful error messages for invalid boolean', () => {
    const invalidBoolean = { ...validKeyManagerInitStruct, addPrimaryContractAddress: 'true' };
    const result = keyManagerInitStructSchema.safeParse(invalidBoolean);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('addPrimaryContractAddress must be a boolean');
    }
  });

  it('should provide meaningful error messages for invalid funding amount', () => {
    const invalidFunding = { ...validKeyManagerInitStruct, fundingAmount: '1000' };
    const result = keyManagerInitStructSchema.safeParse(invalidFunding);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Funding amount must be a bigint');
    }
  });
});

// ============================================================================
// deployParamsSchema Tests
// ============================================================================

describe('deployParamsSchema', () => {
  it('should accept valid complete deployment parameters', () => {
    const result = deployParamsSchema.safeParse(validDeployParams);
    expect(result.success).toBe(true);
  });

  it('should accept deployment params with zero funding amounts', () => {
    const zeroFunding = {
      ...validDeployParams,
      universalProfileInitStruct: {
        ...validUniversalProfileInitStruct,
        fundingAmount: BigInt(0),
      },
      keyManagerInitStruct: {
        ...validKeyManagerInitStruct,
        fundingAmount: BigInt(0),
      },
    };
    const result = deployParamsSchema.safeParse(zeroFunding);
    expect(result.success).toBe(true);
  });

  it('should reject deployment params missing required fields', () => {
    const missingFields = [
      { ...validDeployParams, universalProfileInitStruct: undefined },
      { ...validDeployParams, keyManagerInitStruct: undefined },
      { ...validDeployParams, initializeEncodedBytes: undefined },
    ];

    for (const params of missingFields) {
      // Remove undefined fields
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );
      const result = deployParamsSchema.safeParse(cleanParams);
      expect(result.success).toBe(false);
    }
  });

  it('should reject deployment params with invalid nested structs', () => {
    const invalidNested = [
      {
        ...validDeployParams,
        universalProfileInitStruct: { ...validUniversalProfileInitStruct, salt: '0x123' }, // invalid salt
      },
      {
        ...validDeployParams,
        keyManagerInitStruct: { ...validKeyManagerInitStruct, addPrimaryContractAddress: 'true' }, // invalid boolean
      },
      {
        ...validDeployParams,
        initializeEncodedBytes: '123', // invalid hex
      },
    ];

    for (const params of invalidNested) {
      const result = deployParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    }
  });

  it('should reject non-objects', () => {
    const nonObjects = [
      null,
      undefined,
      'string',
      123,
      [],
      true,
      false,
    ];

    for (const nonObject of nonObjects) {
      const result = deployParamsSchema.safeParse(nonObject);
      expect(result.success).toBe(false);
    }
  });

  it('should reject empty objects', () => {
    const result = deployParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});