/**
 * LSP4 Schema Validation Tests
 *
 * Tests for LSP4 Digital Asset Metadata schemas:
 * - Attribute schema validation (string, number, boolean types)
 * - LSP4 metadata schema validation  
 * - Required fields, type checking, and edge cases
 */

import { describe, expect, it } from 'vitest';
import {
  attributesSchema,
  lsp4MetadataSchema,
} from './schemas';
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
  title: 'Official Website',
  url: 'https://example.com',
};

// ============================================================================
// Attributes Schema Tests
// ============================================================================

describe('attributesSchema', () => {
  describe('string attributes', () => {
    const validStringAttribute = {
      key: 'color',
      value: 'blue',
      type: 'string',
    };

    it('should accept valid string attributes', () => {
      const result = attributesSchema.safeParse(validStringAttribute);
      expect(result.success).toBe(true);
    });

    it('should accept string attributes with various values', () => {
      const testCases = [
        { key: 'name', value: 'Test Token', type: 'string' },
        { key: 'description', value: 'A special digital asset', type: 'string' },
        { key: 'empty', value: '', type: 'string' },
        { key: 'spaces', value: '   whitespace   ', type: 'string' },
        { key: 'special', value: 'Special chars: @#$%^&*()', type: 'string' },
        { key: 'unicode', value: '🎨 Art Token 💎', type: 'string' },
      ];

      for (const testCase of testCases) {
        const result = attributesSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      }
    });

    it('should reject string attributes with missing fields', () => {
      const missingKey = { value: 'test', type: 'string' };
      const missingValue = { key: 'test', type: 'string' };
      const missingType = { key: 'test', value: 'test' };

      expect(attributesSchema.safeParse(missingKey).success).toBe(false);
      expect(attributesSchema.safeParse(missingValue).success).toBe(false);
      expect(attributesSchema.safeParse(missingType).success).toBe(false);
    });

    it('should reject string attributes with invalid field types', () => {
      const invalidKey = { key: 123, value: 'test', type: 'string' };
      const invalidValue = { key: 'test', value: 123, type: 'string' };
      const invalidType = { key: 'test', value: 'test', type: 'number' }; // type mismatch

      expect(attributesSchema.safeParse(invalidKey).success).toBe(false);
      expect(attributesSchema.safeParse(invalidValue).success).toBe(false);
      expect(attributesSchema.safeParse(invalidType).success).toBe(false);
    });

    it('should provide meaningful error messages for string attributes', () => {
      const result = attributesSchema.safeParse({ key: 123, value: 'test', type: 'string' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('Invalid value, not a string');
      }
    });
  });

  describe('number attributes', () => {
    const validNumberAttribute = {
      key: 'price',
      value: '100.50',
      type: 'number',
    };

    it('should accept valid number attributes', () => {
      const result = attributesSchema.safeParse(validNumberAttribute);
      expect(result.success).toBe(true);
    });

    it('should accept various numeric string formats', () => {
      const testCases = [
        { key: 'integer', value: '42', type: 'number' },
        { key: 'float', value: '99.99', type: 'number' },
        { key: 'negative', value: '-10.5', type: 'number' },
        { key: 'zero', value: '0', type: 'number' },
        { key: 'scientific', value: '1e5', type: 'number' },
        { key: 'decimal', value: '0.00001', type: 'number' },
      ];

      for (const testCase of testCases) {
        const result = attributesSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      }
    });

    it('should reject non-numeric string values', () => {
      const invalidCases = [
        { key: 'price', value: 'not a number', type: 'number' },
        { key: 'price', value: '', type: 'number' },
        { key: 'price', value: '  ', type: 'number' },
        { key: 'price', value: 'abc123', type: 'number' },
        { key: 'price', value: '12.34.56', type: 'number' },
        { key: 'price', value: 'NaN', type: 'number' },
        { key: 'price', value: 'Infinity', type: 'number' },
      ];

      for (const testCase of invalidCases) {
        const result = attributesSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      }
    });

    it('should reject actual number values (must be string)', () => {
      const actualNumber = { key: 'price', value: 100.50, type: 'number' };
      const result = attributesSchema.safeParse(actualNumber);
      expect(result.success).toBe(false);
    });

    it('should provide meaningful error messages for number attributes', () => {
      const result = attributesSchema.safeParse({ key: 'price', value: 'not a number', type: 'number' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('Invalid value, not a number');
      }
    });
  });

  describe('boolean attributes', () => {
    it('should accept valid boolean attributes', () => {
      const trueAttribute = { key: 'isRare', value: true, type: 'boolean' };
      const falseAttribute = { key: 'isActive', value: false, type: 'boolean' };

      expect(attributesSchema.safeParse(trueAttribute).success).toBe(true);
      expect(attributesSchema.safeParse(falseAttribute).success).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const invalidCases = [
        { key: 'isActive', value: 'true', type: 'boolean' },
        { key: 'isActive', value: 'false', type: 'boolean' },
        { key: 'isActive', value: 1, type: 'boolean' },
        { key: 'isActive', value: 0, type: 'boolean' },
        { key: 'isActive', value: null, type: 'boolean' },
        { key: 'isActive', value: undefined, type: 'boolean' },
        { key: 'isActive', value: [], type: 'boolean' },
        { key: 'isActive', value: {}, type: 'boolean' },
      ];

      for (const testCase of invalidCases) {
        const result = attributesSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      }
    });

    it('should provide meaningful error messages for boolean attributes', () => {
      const result = attributesSchema.safeParse({ key: 'isActive', value: 'true', type: 'boolean' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('Invalid value, not a boolean');
      }
    });
  });

  describe('discriminated union behavior', () => {
    it('should provide better error messages with discriminated union', () => {
      // Test with invalid type to ensure discriminated union behavior
      const invalidType = { key: 'test', value: 'test', type: 'invalid' };
      const result = attributesSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it('should quickly identify the correct variant based on type field', () => {
      // This tests that the discriminated union can quickly identify the variant
      const stringVariant = { key: 'test', value: 'test', type: 'string' };
      const numberVariant = { key: 'test', value: '123', type: 'number' };
      const booleanVariant = { key: 'test', value: true, type: 'boolean' };

      expect(attributesSchema.safeParse(stringVariant).success).toBe(true);
      expect(attributesSchema.safeParse(numberVariant).success).toBe(true);
      expect(attributesSchema.safeParse(booleanVariant).success).toBe(true);
    });
  });

  describe('general validation', () => {
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

      for (const value of nonObjects) {
        const result = attributesSchema.safeParse(value);
        expect(result.success).toBe(false);
      }
    });
  });
});

// ============================================================================
// LSP4 Metadata Schema Tests
// ============================================================================

describe('lsp4MetadataSchema', () => {
  const validMetadata = {
    name: 'Test Digital Asset',
    description: 'A test token for validation',
    category: 'art',
    links: [validLink],
    icon: [validImage],
    images: [[validImage]],
    assets: [validAsset],
    attributes: [
      { key: 'color', value: 'blue', type: 'string' },
      { key: 'price', value: '100', type: 'number' },
      { key: 'isRare', value: true, type: 'boolean' },
    ],
  };

  it('should accept valid complete metadata', () => {
    const result = lsp4MetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  describe('nullable field validation', () => {
    it('should accept null values for nullable fields', () => {
      const metadataWithNulls = {
        ...validMetadata,
        name: null,
        description: null,
        category: null,
      };
      const result = lsp4MetadataSchema.safeParse(metadataWithNulls);
      expect(result.success).toBe(true);
    });

    it('should reject invalid types for nullable fields', () => {
      const testCases = [
        { ...validMetadata, name: 123 },
        { ...validMetadata, description: {} },
        { ...validMetadata, category: [] },
      ];

      for (const testCase of testCases) {
        const result = lsp4MetadataSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('array field validation', () => {
    it('should accept empty arrays for all array fields', () => {
      const emptyArraysMetadata = {
        name: 'Test',
        description: 'Test description',
        category: 'test',
        links: [],
        icon: [],
        images: [],
        assets: [],
        attributes: [],
      };
      const result = lsp4MetadataSchema.safeParse(emptyArraysMetadata);
      expect(result.success).toBe(true);
    });

    it('should reject non-array values for array fields', () => {
      const testCases = [
        { ...validMetadata, links: 'not an array' },
        { ...validMetadata, icon: null },
        { ...validMetadata, images: {} },
        { ...validMetadata, assets: 123 },
        { ...validMetadata, attributes: 'invalid' },
      ];

      for (const testCase of testCases) {
        const result = lsp4MetadataSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      }
    });

    it('should validate array contents', () => {
      const invalidLinkContent = {
        ...validMetadata,
        links: [{ title: 'test' }], // missing url
      };
      
      const invalidAttributeContent = {
        ...validMetadata,
        attributes: [{ key: 'test' }], // missing value and type
      };

      expect(lsp4MetadataSchema.safeParse(invalidLinkContent).success).toBe(false);
      expect(lsp4MetadataSchema.safeParse(invalidAttributeContent).success).toBe(false);
    });
  });

  describe('nested array validation (images)', () => {
    it('should accept multiple image sets', () => {
      const multipleImageSets = {
        ...validMetadata,
        images: [
          [validImage],
          [
            { ...validImage, url: 'https://example.com/image2.png' },
            { ...validImage, url: 'https://example.com/image3.png' },
          ],
          [], // empty image set should be allowed
        ],
      };
      const result = lsp4MetadataSchema.safeParse(multipleImageSets);
      expect(result.success).toBe(true);
    });

    it('should reject invalid nested image structure', () => {
      const invalidNestedImages = {
        ...validMetadata,
        images: [
          'not an array', // should be array of images
        ],
      };
      const result = lsp4MetadataSchema.safeParse(invalidNestedImages);
      expect(result.success).toBe(false);
    });

    it('should validate nested image contents', () => {
      const invalidImageInNest = {
        ...validMetadata,
        images: [
          [{ url: 123 }], // invalid image object
        ],
      };
      const result = lsp4MetadataSchema.safeParse(invalidImageInNest);
      expect(result.success).toBe(false);
    });
  });

  describe('required fields', () => {
    it('should reject metadata with missing required fields', () => {
      const requiredFields = ['name', 'description', 'category', 'links', 'icon', 'images', 'assets', 'attributes'];
      
      for (const field of requiredFields) {
        const incomplete = { ...validMetadata };
        delete (incomplete as any)[field];
        const result = lsp4MetadataSchema.safeParse(incomplete);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('minimal valid metadata', () => {
    it('should accept minimal valid metadata', () => {
      const minimalMetadata = {
        name: null,
        description: null,
        category: null,
        links: [],
        icon: [],
        images: [],
        assets: [],
        attributes: [],
      };
      const result = lsp4MetadataSchema.safeParse(minimalMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('complex real-world scenarios', () => {
    it('should handle complex metadata with multiple attribute types', () => {
      const complexMetadata = {
        name: 'Complex NFT',
        description: 'A complex digital asset with various attributes',
        category: 'collectible',
        links: [
          { title: 'Official Site', url: 'https://example.com' },
          { title: 'Documentation', url: 'https://docs.example.com' },
        ],
        icon: [
          { ...validImage, width: 64, height: 64 },
        ],
        images: [
          [{ ...validImage, width: 1024, height: 1024 }],
          [
            { ...validImage, width: 512, height: 512 },
            { ...validImage, width: 256, height: 256 },
          ],
        ],
        assets: [
          validAsset,
          { ...validAsset, fileType: 'video/mp4', url: 'https://example.com/video.mp4' },
        ],
        attributes: [
          { key: 'rarity', value: 'legendary', type: 'string' },
          { key: 'power', value: '9000', type: 'number' },
          { key: 'isAnimated', value: true, type: 'boolean' },
          { key: 'element', value: 'fire', type: 'string' },
          { key: 'level', value: '85', type: 'number' },
          { key: 'isTransferable', value: false, type: 'boolean' },
        ],
      };
      
      const result = lsp4MetadataSchema.safeParse(complexMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('general validation', () => {
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

      for (const value of nonObjects) {
        const result = lsp4MetadataSchema.safeParse(value);
        expect(result.success).toBe(false);
      }
    });

    it('should provide meaningful error messages', () => {
      const result = lsp4MetadataSchema.safeParse({ name: 123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors.some(error => error.includes('Name must be a string'))).toBe(true);
      }
    });
  });
});