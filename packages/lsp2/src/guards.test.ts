/**
 * LSP2 Type Guard Tests
 *
 * Tests for runtime type guard validation of LSP2 shared primitives.
 * Validates both positive cases (valid inputs) and negative cases 
 * (missing fields, wrong types, etc.).
 */

import { describe, expect, it } from 'vitest';
import {
  isImageSchema,
  isLinkSchema,
  isTagSchema,
  isAssetSchema,
} from './guards';
import { VERIFICATION_METHODS } from './constants';
import type { Image, Link, Tag, Asset } from './types';

// ============================================================================
// Test Fixtures
// ============================================================================

const validVerification = {
  data: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

const validImage: Image = {
  url: 'https://example.com/image.png',
  width: 1024,
  height: 768,
  verification: validVerification,
};

const validAsset: Asset = {
  url: 'https://example.com/asset.pdf',
  fileType: 'application/pdf',
  verification: validVerification,
};

const validLink: Link = {
  title: 'Example Link',
  url: 'https://example.com',
};

const validTag: Tag = 'art';

// ============================================================================
// isImageSchema Tests
// ============================================================================

describe('isImageSchema', () => {
  it('should return true for valid image objects', () => {
    expect(isImageSchema(validImage)).toBe(true);
  });

  it('should return true for images with different verification methods', () => {
    const imageWithUtf8 = {
      ...validImage,
      verification: {
        ...validVerification,
        method: VERIFICATION_METHODS.HASH_KECCAK256_UTF8,
      },
    };
    expect(isImageSchema(imageWithUtf8)).toBe(true);
  });

  it('should return false for objects missing required fields', () => {
    const missingUrl = { width: 1024, height: 768, verification: validVerification };
    const missingWidth = { url: 'test.png', height: 768, verification: validVerification };
    const missingHeight = { url: 'test.png', width: 1024, verification: validVerification };
    const missingVerification = { url: 'test.png', width: 1024, height: 768 };

    expect(isImageSchema(missingUrl)).toBe(false);
    expect(isImageSchema(missingWidth)).toBe(false);
    expect(isImageSchema(missingHeight)).toBe(false);
    expect(isImageSchema(missingVerification)).toBe(false);
  });

  it('should return false for objects with invalid field types', () => {
    const invalidUrl = { ...validImage, url: 123 };
    const invalidWidth = { ...validImage, width: 'not a number' };
    const invalidHeight = { ...validImage, height: 'not a number' };
    const invalidVerification = { ...validImage, verification: 'invalid' };

    expect(isImageSchema(invalidUrl)).toBe(false);
    expect(isImageSchema(invalidWidth)).toBe(false);
    expect(isImageSchema(invalidHeight)).toBe(false);
    expect(isImageSchema(invalidVerification)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isImageSchema(null)).toBe(false);
    expect(isImageSchema(undefined)).toBe(false);
    expect(isImageSchema('string')).toBe(false);
    expect(isImageSchema(123)).toBe(false);
    expect(isImageSchema([])).toBe(false);
    expect(isImageSchema(true)).toBe(false);
  });
});

// ============================================================================
// isLinkSchema Tests
// ============================================================================

describe('isLinkSchema', () => {
  it('should return true for valid link objects', () => {
    expect(isLinkSchema(validLink)).toBe(true);
  });

  it('should return true for various valid URL formats', () => {
    const httpLink = { title: 'HTTP Link', url: 'http://example.com' };
    const pathLink = { title: 'Path Link', url: 'https://example.com/path' };
    const subdomainLink = { title: 'Subdomain', url: 'https://sub.example.com' };
    const portLink = { title: 'Port Link', url: 'https://example.com:8080' };

    expect(isLinkSchema(httpLink)).toBe(true);
    expect(isLinkSchema(pathLink)).toBe(true);
    expect(isLinkSchema(subdomainLink)).toBe(true);
    expect(isLinkSchema(portLink)).toBe(true);
  });

  it('should return false for objects missing required fields', () => {
    const missingTitle = { url: 'https://example.com' };
    const missingUrl = { title: 'Example' };

    expect(isLinkSchema(missingTitle)).toBe(false);
    expect(isLinkSchema(missingUrl)).toBe(false);
  });

  it('should return false for objects with invalid field types', () => {
    const invalidTitle = { title: 123, url: 'https://example.com' };
    const invalidUrl = { title: 'Example', url: 123 };
    const invalidUrlFormat = { title: 'Example', url: 'not a url' };
    const missingProtocol = { title: 'Example', url: 'example.com' };

    expect(isLinkSchema(invalidTitle)).toBe(false);
    expect(isLinkSchema(invalidUrl)).toBe(false);
    expect(isLinkSchema(invalidUrlFormat)).toBe(false);
    expect(isLinkSchema(missingProtocol)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isLinkSchema(null)).toBe(false);
    expect(isLinkSchema(undefined)).toBe(false);
    expect(isLinkSchema('string')).toBe(false);
    expect(isLinkSchema(123)).toBe(false);
    expect(isLinkSchema([])).toBe(false);
    expect(isLinkSchema(true)).toBe(false);
  });
});

// ============================================================================
// isTagSchema Tests
// ============================================================================

describe('isTagSchema', () => {
  it('should return true for valid string tags', () => {
    const validTags = [
      'art',
      'nft',
      'digital-asset',
      'music',
      'gaming',
      '123',
      'tag with spaces',
      '',
    ];

    for (const tag of validTags) {
      expect(isTagSchema(tag)).toBe(true);
    }
  });

  it('should return false for non-string values', () => {
    const invalidTags = [
      123,
      null,
      undefined,
      {},
      [],
      true,
      false,
    ];

    for (const tag of invalidTags) {
      expect(isTagSchema(tag)).toBe(false);
    }
  });
});

// ============================================================================
// isAssetSchema Tests
// ============================================================================

describe('isAssetSchema', () => {
  it('should return true for valid asset objects', () => {
    expect(isAssetSchema(validAsset)).toBe(true);
  });

  it('should return true for assets with different file types', () => {
    const imageAsset = { ...validAsset, fileType: 'image/png' };
    const videoAsset = { ...validAsset, fileType: 'video/mp4' };
    const audioAsset = { ...validAsset, fileType: 'audio/mp3' };

    expect(isAssetSchema(imageAsset)).toBe(true);
    expect(isAssetSchema(videoAsset)).toBe(true);
    expect(isAssetSchema(audioAsset)).toBe(true);
  });

  it('should return true for assets with different verification methods', () => {
    const assetWithUtf8 = {
      ...validAsset,
      verification: {
        ...validVerification,
        method: VERIFICATION_METHODS.HASH_KECCAK256_UTF8,
      },
    };
    expect(isAssetSchema(assetWithUtf8)).toBe(true);
  });

  it('should return false for objects missing required fields', () => {
    const missingUrl = { fileType: 'application/pdf', verification: validVerification };
    const missingFileType = { url: 'test.pdf', verification: validVerification };
    const missingVerification = { url: 'test.pdf', fileType: 'application/pdf' };

    expect(isAssetSchema(missingUrl)).toBe(false);
    expect(isAssetSchema(missingFileType)).toBe(false);
    expect(isAssetSchema(missingVerification)).toBe(false);
  });

  it('should return false for objects with invalid field types', () => {
    const invalidUrl = { ...validAsset, url: 123 };
    const invalidFileType = { ...validAsset, fileType: 123 };
    const invalidVerification = { ...validAsset, verification: 'invalid' };

    expect(isAssetSchema(invalidUrl)).toBe(false);
    expect(isAssetSchema(invalidFileType)).toBe(false);
    expect(isAssetSchema(invalidVerification)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isAssetSchema(null)).toBe(false);
    expect(isAssetSchema(undefined)).toBe(false);
    expect(isAssetSchema('string')).toBe(false);
    expect(isAssetSchema(123)).toBe(false);
    expect(isAssetSchema([])).toBe(false);
    expect(isAssetSchema(true)).toBe(false);
  });
});