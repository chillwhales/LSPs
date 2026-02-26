/**
 * LSP3 Schema Validation Tests
 *
 * Tests for LSP3 Universal Profile metadata schema validation:
 * - Profile metadata structure and required fields
 * - Nullable fields (name, description)
 * - Array fields (tags, links, avatar, profileImage, backgroundImage)
 * - Integration with LSP2 primitive schemas
 */

import { describe, expect, it } from 'vitest';
import { lsp3ProfileSchema } from './schemas';
import { VERIFICATION_METHODS } from '@chillwhales/lsp2';

// ============================================================================
// Test Fixtures
// ============================================================================

const validVerification = {
  data: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

const validImage = {
  url: 'https://example.com/image.png',
  width: 1024,
  height: 768,
  verification: validVerification,
};

const validAsset = {
  url: 'https://example.com/asset.pdf',
  fileType: 'application/pdf',
  verification: validVerification,
};

const validLink = {
  title: 'Example Link',
  url: 'https://example.com',
};

const validLsp3Profile = {
  name: 'John Doe',
  description: 'A Universal Profile user',
  tags: ['developer', 'blockchain'],
  links: [validLink],
  avatar: [validAsset],
  profileImage: [validImage],
  backgroundImage: [validImage],
};

// ============================================================================
// lsp3ProfileSchema Tests
// ============================================================================

describe('lsp3ProfileSchema', () => {
  it('should accept valid complete LSP3 profile objects', () => {
    const result = lsp3ProfileSchema.safeParse(validLsp3Profile);
    expect(result.success).toBe(true);
  });

  it('should accept profiles with null name and description', () => {
    const profileWithNulls = {
      ...validLsp3Profile,
      name: null,
      description: null,
    };
    const result = lsp3ProfileSchema.safeParse(profileWithNulls);
    expect(result.success).toBe(true);
  });

  it('should accept profiles with empty arrays', () => {
    const profileWithEmptyArrays = {
      name: 'Test User',
      description: 'Test description',
      tags: [],
      links: [],
      avatar: [],
      profileImage: [],
      backgroundImage: [],
    };
    const result = lsp3ProfileSchema.safeParse(profileWithEmptyArrays);
    expect(result.success).toBe(true);
  });

  it('should accept profiles with multiple items in arrays', () => {
    const profileWithMultiples = {
      ...validLsp3Profile,
      tags: ['art', 'nft', 'digital-asset', 'music'],
      links: [
        validLink,
        { title: 'Another Link', url: 'https://another.com' },
        { title: 'Third Link', url: 'https://third.com' },
      ],
      avatar: [
        validAsset,
        { ...validAsset, url: 'https://example.com/avatar2.pdf' },
      ],
      profileImage: [
        validImage,
        { ...validImage, url: 'https://example.com/profile2.png' },
      ],
      backgroundImage: [
        validImage,
        { ...validImage, url: 'https://example.com/bg2.png' },
      ],
    };
    const result = lsp3ProfileSchema.safeParse(profileWithMultiples);
    expect(result.success).toBe(true);
  });

  it('should reject profiles missing required fields', () => {
    const missingFields = [
      { ...validLsp3Profile, name: undefined }, // name is missing
      { ...validLsp3Profile, description: undefined }, // description is missing
      { ...validLsp3Profile, tags: undefined }, // tags is missing
      { ...validLsp3Profile, links: undefined }, // links is missing
      { ...validLsp3Profile, avatar: undefined }, // avatar is missing
      { ...validLsp3Profile, profileImage: undefined }, // profileImage is missing
      { ...validLsp3Profile, backgroundImage: undefined }, // backgroundImage is missing
    ];

    for (const profile of missingFields) {
      // Remove the undefined field completely
      const cleanProfile = Object.fromEntries(
        Object.entries(profile).filter(([, value]) => value !== undefined)
      );
      const result = lsp3ProfileSchema.safeParse(cleanProfile);
      expect(result.success).toBe(false);
    }
  });

  it('should reject profiles with invalid field types', () => {
    const invalidTypes = [
      { ...validLsp3Profile, name: 123 }, // name should be string or null
      { ...validLsp3Profile, name: {} }, // name should be string or null
      { ...validLsp3Profile, description: 123 }, // description should be string or null
      { ...validLsp3Profile, description: {} }, // description should be string or null
      { ...validLsp3Profile, tags: 'not an array' }, // tags should be array
      { ...validLsp3Profile, tags: 123 }, // tags should be array
      { ...validLsp3Profile, links: 'not an array' }, // links should be array
      { ...validLsp3Profile, links: {} }, // links should be array
      { ...validLsp3Profile, avatar: 'not an array' }, // avatar should be array
      { ...validLsp3Profile, avatar: null }, // avatar should be array
      { ...validLsp3Profile, profileImage: 'not an array' }, // profileImage should be array
      { ...validLsp3Profile, profileImage: {} }, // profileImage should be array
      { ...validLsp3Profile, backgroundImage: 'not an array' }, // backgroundImage should be array
      { ...validLsp3Profile, backgroundImage: false }, // backgroundImage should be array
    ];

    for (const profile of invalidTypes) {
      const result = lsp3ProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    }
  });

  it('should reject profiles with invalid array items', () => {
    const invalidArrayItems = [
      { ...validLsp3Profile, tags: [123] }, // tags should contain strings
      { ...validLsp3Profile, tags: [null] }, // tags should contain strings
      { ...validLsp3Profile, tags: [{}] }, // tags should contain strings
      { ...validLsp3Profile, links: [{ invalid: 'field' }] }, // links should contain valid link objects
      { ...validLsp3Profile, links: ['string'] }, // links should contain objects
      { ...validLsp3Profile, avatar: [{ invalid: 'field' }] }, // avatar should contain valid asset objects
      { ...validLsp3Profile, avatar: ['string'] }, // avatar should contain objects
      { ...validLsp3Profile, profileImage: [{ invalid: 'field' }] }, // profileImage should contain valid image objects
      { ...validLsp3Profile, profileImage: ['string'] }, // profileImage should contain objects
      { ...validLsp3Profile, backgroundImage: [{ invalid: 'field' }] }, // backgroundImage should contain valid image objects
      { ...validLsp3Profile, backgroundImage: [null] }, // backgroundImage should contain objects
    ];

    for (const profile of invalidArrayItems) {
      const result = lsp3ProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    }
  });

  it('should provide meaningful error messages for invalid types', () => {
    const invalidProfile = { ...validLsp3Profile, name: 123 };
    const result = lsp3ProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name must be a string');
    }
  });

  it('should provide meaningful error messages for invalid description', () => {
    const invalidProfile = { ...validLsp3Profile, description: 123 };
    const result = lsp3ProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description must be a string');
    }
  });

  it('should provide meaningful error messages for invalid arrays', () => {
    const invalidProfile = { ...validLsp3Profile, tags: 'not an array' };
    const result = lsp3ProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid value, not an array');
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
      const result = lsp3ProfileSchema.safeParse(nonObject);
      expect(result.success).toBe(false);
    }
  });

  it('should reject empty objects', () => {
    const result = lsp3ProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});