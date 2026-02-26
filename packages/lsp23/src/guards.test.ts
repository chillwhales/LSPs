/**
 * LSP23 Type Guard Tests
 *
 * Tests for runtime type guard validation of LSP23 deployment schemas.
 * Validates both positive cases (valid structs) and negative cases 
 * (missing fields, wrong types, invalid formats, etc.).
 */

import { describe, expect, it } from 'vitest';
import {
  isUniversalProfileInitStruct,
  isKeyManagerInitStruct,
  isDeployParams,
} from './guards';
import type {
  UniversalProfileInitStruct,
  KeyManagerInitStruct,
  DeployParams,
} from './types';

// ============================================================================
// Test Fixtures
// ============================================================================

const validAddress = '0x1234567890123456789012345678901234567890';
const validHex = '0xabcdef1234567890';
const validSalt = '0x' + '12'.repeat(32); // 32-byte hex string
const validBigInt = BigInt(1000000000000000000); // 1 ETH in wei

const validUniversalProfileInitStruct: UniversalProfileInitStruct = {
  salt: validSalt,
  fundingAmount: validBigInt,
  implementationContract: validAddress,
  initializationCalldata: validHex,
};

const validKeyManagerInitStruct: KeyManagerInitStruct = {
  fundingAmount: validBigInt,
  implementationContract: validAddress,
  addPrimaryContractAddress: true,
  initializationCalldata: validHex,
  extraInitializationParams: validHex,
};

const validDeployParams: DeployParams = {
  universalProfileInitStruct: validUniversalProfileInitStruct,
  keyManagerInitStruct: validKeyManagerInitStruct,
  initializeEncodedBytes: validHex,
};

const minimalValidUniversalProfileInitStruct: UniversalProfileInitStruct = {
  salt: validSalt,
  fundingAmount: BigInt(0),
  implementationContract: validAddress,
  initializationCalldata: '0x',
};

const minimalValidKeyManagerInitStruct: KeyManagerInitStruct = {
  fundingAmount: BigInt(0),
  implementationContract: validAddress,
  addPrimaryContractAddress: false,
  initializationCalldata: '0x',
  extraInitializationParams: '0x',
};

// ============================================================================
// isUniversalProfileInitStruct Tests
// ============================================================================

describe('isUniversalProfileInitStruct', () => {
  it('should return true for valid Universal Profile init structs', () => {
    expect(isUniversalProfileInitStruct(validUniversalProfileInitStruct)).toBe(true);
  });

  it('should return true for minimal valid structs with zero funding and empty hex', () => {
    expect(isUniversalProfileInitStruct(minimalValidUniversalProfileInitStruct)).toBe(true);
  });

  it('should return true for structs with large funding amounts', () => {
    const largeFunding = {
      ...validUniversalProfileInitStruct,
      fundingAmount: BigInt('1000000000000000000000'), // 1000 ETH
    };
    expect(isUniversalProfileInitStruct(largeFunding)).toBe(true);
  });

  it('should return true for various valid addresses', () => {
    const validAddresses = [
      '0x0000000000000000000000000000000000000000', // zero address
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
      '0x742d35Cc6634C0532925a3b8D67aD2F64C10cD42', // checksummed
      '0x742d35cc6634c0532925a3b8d67ad2f64c10cd42', // lowercase
    ];

    for (const address of validAddresses) {
      const struct = {
        ...validUniversalProfileInitStruct,
        implementationContract: address,
      };
      expect(isUniversalProfileInitStruct(struct)).toBe(true);
    }
  });

  it('should return true for various valid hex calldata', () => {
    const validCalldata = [
      '0x',
      '0x1234',
      '0xabcdef',
      '0x' + 'ff'.repeat(100),
    ];

    for (const calldata of validCalldata) {
      const struct = {
        ...validUniversalProfileInitStruct,
        initializationCalldata: calldata,
      };
      expect(isUniversalProfileInitStruct(struct)).toBe(true);
    }
  });

  it('should return false for objects missing required fields', () => {
    const missingSalt = { ...validUniversalProfileInitStruct };
    delete (missingSalt as any).salt;

    const missingFunding = { ...validUniversalProfileInitStruct };
    delete (missingFunding as any).fundingAmount;

    const missingImplementation = { ...validUniversalProfileInitStruct };
    delete (missingImplementation as any).implementationContract;

    const missingCalldata = { ...validUniversalProfileInitStruct };
    delete (missingCalldata as any).initializationCalldata;

    expect(isUniversalProfileInitStruct(missingSalt)).toBe(false);
    expect(isUniversalProfileInitStruct(missingFunding)).toBe(false);
    expect(isUniversalProfileInitStruct(missingImplementation)).toBe(false);
    expect(isUniversalProfileInitStruct(missingCalldata)).toBe(false);
  });

  it('should return false for objects with invalid field types', () => {
    const invalidSalt = { ...validUniversalProfileInitStruct, salt: 123 };
    const invalidFunding = { ...validUniversalProfileInitStruct, fundingAmount: '1000' };
    const invalidAddress = { ...validUniversalProfileInitStruct, implementationContract: 123 };
    const invalidCalldata = { ...validUniversalProfileInitStruct, initializationCalldata: 123 };

    expect(isUniversalProfileInitStruct(invalidSalt)).toBe(false);
    expect(isUniversalProfileInitStruct(invalidFunding)).toBe(false);
    expect(isUniversalProfileInitStruct(invalidAddress)).toBe(false);
    expect(isUniversalProfileInitStruct(invalidCalldata)).toBe(false);
  });

  it('should return false for objects with invalid salt format', () => {
    const invalidSalts = [
      { ...validUniversalProfileInitStruct, salt: '0x123' }, // too short
      { ...validUniversalProfileInitStruct, salt: '0x' + '12'.repeat(33) }, // too long
      { ...validUniversalProfileInitStruct, salt: '12'.repeat(32) }, // missing 0x
      { ...validUniversalProfileInitStruct, salt: '0xgg' + '12'.repeat(31) }, // invalid hex
    ];

    for (const struct of invalidSalts) {
      expect(isUniversalProfileInitStruct(struct)).toBe(false);
    }
  });

  it('should return false for objects with invalid address format', () => {
    const invalidAddresses = [
      { ...validUniversalProfileInitStruct, implementationContract: '0x123' }, // too short
      { ...validUniversalProfileInitStruct, implementationContract: '1234567890123456789012345678901234567890' }, // missing 0x
      { ...validUniversalProfileInitStruct, implementationContract: '0xgg34567890123456789012345678901234567890' }, // invalid hex
    ];

    for (const struct of invalidAddresses) {
      expect(isUniversalProfileInitStruct(struct)).toBe(false);
    }
  });

  it('should return false for objects with invalid hex calldata', () => {
    const invalidCalldata = [
      { ...validUniversalProfileInitStruct, initializationCalldata: '123' }, // missing 0x
      { ...validUniversalProfileInitStruct, initializationCalldata: '0xgg' }, // invalid hex
    ];

    for (const struct of invalidCalldata) {
      expect(isUniversalProfileInitStruct(struct)).toBe(false);
    }
  });

  it('should return false for non-objects', () => {
    expect(isUniversalProfileInitStruct(null)).toBe(false);
    expect(isUniversalProfileInitStruct(undefined)).toBe(false);
    expect(isUniversalProfileInitStruct('string')).toBe(false);
    expect(isUniversalProfileInitStruct(123)).toBe(false);
    expect(isUniversalProfileInitStruct([])).toBe(false);
    expect(isUniversalProfileInitStruct(true)).toBe(false);
  });

  it('should return false for empty objects', () => {
    expect(isUniversalProfileInitStruct({})).toBe(false);
  });
});

// ============================================================================
// isKeyManagerInitStruct Tests
// ============================================================================

describe('isKeyManagerInitStruct', () => {
  it('should return true for valid Key Manager init structs', () => {
    expect(isKeyManagerInitStruct(validKeyManagerInitStruct)).toBe(true);
  });

  it('should return true for minimal valid structs with zero funding and empty hex', () => {
    expect(isKeyManagerInitStruct(minimalValidKeyManagerInitStruct)).toBe(true);
  });

  it('should return true for both true and false values for addPrimaryContractAddress', () => {
    const withTrue = {
      ...validKeyManagerInitStruct,
      addPrimaryContractAddress: true,
    };
    const withFalse = {
      ...validKeyManagerInitStruct,
      addPrimaryContractAddress: false,
    };

    expect(isKeyManagerInitStruct(withTrue)).toBe(true);
    expect(isKeyManagerInitStruct(withFalse)).toBe(true);
  });

  it('should return true for various valid hex values', () => {
    const validHexValues = [
      '0x',
      '0x1234',
      '0xabcdef',
      '0x' + 'aa'.repeat(50),
    ];

    for (const hex of validHexValues) {
      const struct1 = {
        ...validKeyManagerInitStruct,
        initializationCalldata: hex,
      };
      const struct2 = {
        ...validKeyManagerInitStruct,
        extraInitializationParams: hex,
      };
      expect(isKeyManagerInitStruct(struct1)).toBe(true);
      expect(isKeyManagerInitStruct(struct2)).toBe(true);
    }
  });

  it('should return false for objects missing required fields', () => {
    const missingFunding = { ...validKeyManagerInitStruct };
    delete (missingFunding as any).fundingAmount;

    const missingImplementation = { ...validKeyManagerInitStruct };
    delete (missingImplementation as any).implementationContract;

    const missingAddPrimary = { ...validKeyManagerInitStruct };
    delete (missingAddPrimary as any).addPrimaryContractAddress;

    const missingCalldata = { ...validKeyManagerInitStruct };
    delete (missingCalldata as any).initializationCalldata;

    const missingExtraParams = { ...validKeyManagerInitStruct };
    delete (missingExtraParams as any).extraInitializationParams;

    expect(isKeyManagerInitStruct(missingFunding)).toBe(false);
    expect(isKeyManagerInitStruct(missingImplementation)).toBe(false);
    expect(isKeyManagerInitStruct(missingAddPrimary)).toBe(false);
    expect(isKeyManagerInitStruct(missingCalldata)).toBe(false);
    expect(isKeyManagerInitStruct(missingExtraParams)).toBe(false);
  });

  it('should return false for objects with invalid field types', () => {
    const invalidFunding = { ...validKeyManagerInitStruct, fundingAmount: '1000' };
    const invalidAddress = { ...validKeyManagerInitStruct, implementationContract: 123 };
    const invalidBoolean = { ...validKeyManagerInitStruct, addPrimaryContractAddress: 'true' };
    const invalidCalldata = { ...validKeyManagerInitStruct, initializationCalldata: 123 };
    const invalidExtraParams = { ...validKeyManagerInitStruct, extraInitializationParams: null };

    expect(isKeyManagerInitStruct(invalidFunding)).toBe(false);
    expect(isKeyManagerInitStruct(invalidAddress)).toBe(false);
    expect(isKeyManagerInitStruct(invalidBoolean)).toBe(false);
    expect(isKeyManagerInitStruct(invalidCalldata)).toBe(false);
    expect(isKeyManagerInitStruct(invalidExtraParams)).toBe(false);
  });

  it('should return false for objects with invalid hex format', () => {
    const invalidHex = [
      { ...validKeyManagerInitStruct, initializationCalldata: '123' }, // missing 0x
      { ...validKeyManagerInitStruct, initializationCalldata: '0xgg' }, // invalid hex
      { ...validKeyManagerInitStruct, extraInitializationParams: 'abcd' }, // missing 0x
      { ...validKeyManagerInitStruct, extraInitializationParams: '0xyz' }, // invalid hex
    ];

    for (const struct of invalidHex) {
      expect(isKeyManagerInitStruct(struct)).toBe(false);
    }
  });

  it('should return false for objects with invalid boolean values', () => {
    const invalidBooleans = [
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: 'true' },
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: 1 },
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: 0 },
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: null },
      { ...validKeyManagerInitStruct, addPrimaryContractAddress: undefined },
    ];

    for (const struct of invalidBooleans) {
      expect(isKeyManagerInitStruct(struct)).toBe(false);
    }
  });

  it('should return false for non-objects', () => {
    expect(isKeyManagerInitStruct(null)).toBe(false);
    expect(isKeyManagerInitStruct(undefined)).toBe(false);
    expect(isKeyManagerInitStruct('string')).toBe(false);
    expect(isKeyManagerInitStruct(123)).toBe(false);
    expect(isKeyManagerInitStruct([])).toBe(false);
    expect(isKeyManagerInitStruct(true)).toBe(false);
  });

  it('should return false for empty objects', () => {
    expect(isKeyManagerInitStruct({})).toBe(false);
  });
});

// ============================================================================
// isDeployParams Tests
// ============================================================================

describe('isDeployParams', () => {
  it('should return true for valid complete deployment parameters', () => {
    expect(isDeployParams(validDeployParams)).toBe(true);
  });

  it('should return true for deployment params with minimal valid nested structs', () => {
    const minimalParams = {
      universalProfileInitStruct: minimalValidUniversalProfileInitStruct,
      keyManagerInitStruct: minimalValidKeyManagerInitStruct,
      initializeEncodedBytes: '0x',
    };
    expect(isDeployParams(minimalParams)).toBe(true);
  });

  it('should return true for deployment params with zero funding amounts', () => {
    const zeroFundingParams = {
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
    expect(isDeployParams(zeroFundingParams)).toBe(true);
  });

  it('should return true for deployment params with large funding amounts', () => {
    const largeFundingParams = {
      ...validDeployParams,
      universalProfileInitStruct: {
        ...validUniversalProfileInitStruct,
        fundingAmount: BigInt('1000000000000000000000'),
      },
      keyManagerInitStruct: {
        ...validKeyManagerInitStruct,
        fundingAmount: BigInt('500000000000000000000'),
      },
    };
    expect(isDeployParams(largeFundingParams)).toBe(true);
  });

  it('should return false for objects missing required top-level fields', () => {
    const missingUpStruct = { ...validDeployParams };
    delete (missingUpStruct as any).universalProfileInitStruct;

    const missingKmStruct = { ...validDeployParams };
    delete (missingKmStruct as any).keyManagerInitStruct;

    const missingInitBytes = { ...validDeployParams };
    delete (missingInitBytes as any).initializeEncodedBytes;

    expect(isDeployParams(missingUpStruct)).toBe(false);
    expect(isDeployParams(missingKmStruct)).toBe(false);
    expect(isDeployParams(missingInitBytes)).toBe(false);
  });

  it('should return false for objects with invalid nested Universal Profile struct', () => {
    const invalidUpStruct = {
      ...validDeployParams,
      universalProfileInitStruct: {
        ...validUniversalProfileInitStruct,
        salt: '0x123', // invalid salt
      },
    };
    expect(isDeployParams(invalidUpStruct)).toBe(false);
  });

  it('should return false for objects with invalid nested Key Manager struct', () => {
    const invalidKmStruct = {
      ...validDeployParams,
      keyManagerInitStruct: {
        ...validKeyManagerInitStruct,
        addPrimaryContractAddress: 'true', // invalid boolean
      },
    };
    expect(isDeployParams(invalidKmStruct)).toBe(false);
  });

  it('should return false for objects with invalid initializeEncodedBytes', () => {
    const invalidBytes = [
      { ...validDeployParams, initializeEncodedBytes: '123' }, // missing 0x
      { ...validDeployParams, initializeEncodedBytes: '0xgg' }, // invalid hex
      { ...validDeployParams, initializeEncodedBytes: 123 }, // not a string
      { ...validDeployParams, initializeEncodedBytes: null },
    ];

    for (const params of invalidBytes) {
      expect(isDeployParams(params)).toBe(false);
    }
  });

  it('should return false for objects with invalid nested struct types', () => {
    const invalidNested = [
      { ...validDeployParams, universalProfileInitStruct: 'not an object' },
      { ...validDeployParams, universalProfileInitStruct: 123 },
      { ...validDeployParams, universalProfileInitStruct: null },
      { ...validDeployParams, keyManagerInitStruct: 'not an object' },
      { ...validDeployParams, keyManagerInitStruct: [] },
      { ...validDeployParams, keyManagerInitStruct: null },
    ];

    for (const params of invalidNested) {
      expect(isDeployParams(params)).toBe(false);
    }
  });

  it('should return false for non-objects', () => {
    expect(isDeployParams(null)).toBe(false);
    expect(isDeployParams(undefined)).toBe(false);
    expect(isDeployParams('string')).toBe(false);
    expect(isDeployParams(123)).toBe(false);
    expect(isDeployParams([])).toBe(false);
    expect(isDeployParams(true)).toBe(false);
  });

  it('should return false for empty objects', () => {
    expect(isDeployParams({})).toBe(false);
  });

  it('should return false for objects with partial nested structures', () => {
    const partialStructs = [
      {
        ...validDeployParams,
        universalProfileInitStruct: { salt: validSalt }, // missing other fields
      },
      {
        ...validDeployParams,
        keyManagerInitStruct: { fundingAmount: BigInt(0) }, // missing other fields
      },
    ];

    for (const params of partialStructs) {
      expect(isDeployParams(params)).toBe(false);
    }
  });
});