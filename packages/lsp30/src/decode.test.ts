import { Hex, keccak256, stringToHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { decodeLsp30Uri, parseLsp30Uri } from './decode';
import { computeContentHash, encodeLsp30Uri } from './encode';

// ============================================================================
// Test Data
// ============================================================================

const testEntries = [
  { backend: 'ipfs' as const, cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' },
  {
    backend: 's3' as const,
    bucket: 'my-bucket',
    key: 'content/file.bin',
    region: 'us-east-1',
  },
];

const testContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
const testContentHash = keccak256(testContent);

// Pre-encode for reuse in tests
const validEncoded = encodeLsp30Uri(testEntries, testContentHash);

// ============================================================================
// parseLsp30Uri Tests
// ============================================================================

describe('parseLsp30Uri', () => {
  it('should extract verificationMethod, verificationData, and entries from valid encoded hex', () => {
    const parsed = parseLsp30Uri(validEncoded);

    expect(parsed.verificationMethod).toBe('0x8019f9b1');
    expect(parsed.verificationData.toLowerCase()).toBe(testContentHash.toLowerCase());
    expect(parsed.entries).toEqual(testEntries);
  });

  it('should throw on value too short', () => {
    const shortValue = '0x00308019f9b10020' as Hex;

    expect(() => parseLsp30Uri(shortValue)).toThrow(Error);
    expect(() => parseLsp30Uri(shortValue)).toThrow(/too short/);
  });

  it('should throw on wrong prefix (0x0000 = LSP2, not LSP30)', () => {
    // Build an LSP2-prefixed value that is long enough
    const lsp2Prefix =
      '0x00008019f9b100200000000000000000000000000000000000000000000000000000000000000000697066733a2f2f516d54657374' as Hex;

    expect(() => parseLsp30Uri(lsp2Prefix)).toThrow(Error);
    expect(() => parseLsp30Uri(lsp2Prefix)).toThrow(/prefix/);
  });

  it('should throw on invalid JSON in entries portion', () => {
    // Manually construct a value with valid header but garbage after the hash
    const invalidJsonHex = stringToHex('not valid json {{{');
    const manualValue = ('0x0030' +
      '8019f9b1' +
      '0020' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      invalidJsonHex.slice(2)) as Hex; // strip '0x' prefix

    expect(() => parseLsp30Uri(manualValue)).toThrow(Error);
  });

  it('should return correct entry objects with backend-specific fields preserved', () => {
    const entriesWithAll = [
      { backend: 'ipfs' as const, cid: 'QmSpecificCid' },
      { backend: 's3' as const, bucket: 'prod', key: 'data/file.enc', region: 'eu-west-1' },
      { backend: 'lumera' as const, actionId: 'action-123' },
      { backend: 'arweave' as const, transactionId: 'tx-abc' },
    ];
    const hash = keccak256(new Uint8Array([1]));
    const encoded = encodeLsp30Uri(entriesWithAll, hash);
    const parsed = parseLsp30Uri(encoded);

    expect(parsed.entries).toEqual(entriesWithAll);
    expect(parsed.entries[0]).toHaveProperty('cid', 'QmSpecificCid');
    expect(parsed.entries[1]).toHaveProperty('bucket', 'prod');
    expect(parsed.entries[2]).toHaveProperty('actionId', 'action-123');
    expect(parsed.entries[3]).toHaveProperty('transactionId', 'tx-abc');
  });
});

// ============================================================================
// decodeLsp30Uri Tests
// ============================================================================

describe('decodeLsp30Uri', () => {
  it('should verify hash matches content bytes and return validated entries', () => {
    const result = decodeLsp30Uri(validEncoded, testContent);

    expect(result.entries).toEqual(testEntries);
    expect(result.verificationData.toLowerCase()).toBe(testContentHash.toLowerCase());
  });

  it('should throw on hash mismatch (tampered content)', () => {
    const tamperedContent = new Uint8Array([1, 2, 3, 4, 5]); // Different from testContent

    expect(() => decodeLsp30Uri(validEncoded, tamperedContent)).toThrow(Error);
    expect(() => decodeLsp30Uri(validEncoded, tamperedContent)).toThrow(/hash mismatch/);
  });

  it('should throw on Zod validation failure (malformed entries in hex)', () => {
    // Construct value with valid header + matching hash but entries that fail Zod validation
    const invalidEntries = [{ backend: 'unknown', something: 'test' }];
    const invalidEntriesHex = stringToHex(JSON.stringify(invalidEntries));
    const contentForHash = new Uint8Array([99]);
    const contentHash = keccak256(contentForHash);
    const crafted = ('0x0030' +
      '8019f9b1' +
      '0020' +
      contentHash.slice(2) +
      invalidEntriesHex.slice(2)) as Hex;

    expect(() => decodeLsp30Uri(crafted, contentForHash)).toThrow(Error);
  });
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe('round-trip', () => {
  it('should preserve all entry data through encode → parse', () => {
    const entries = [
      { backend: 'ipfs' as const, cid: 'QmRoundTrip123' },
      { backend: 's3' as const, bucket: 'test', key: 'path/to/file.bin', region: 'ap-south-1' },
    ];
    const content = new Uint8Array([10, 20, 30]);
    const hash = computeContentHash(content);

    const encoded = encodeLsp30Uri(entries, hash);
    const parsed = parseLsp30Uri(encoded);

    expect(parsed.entries).toEqual(entries);
    expect(parsed.verificationMethod).toBe('0x8019f9b1');
    expect(parsed.verificationData.toLowerCase()).toBe(hash.toLowerCase());
  });

  it('should preserve all entry data through encode → decode with correct content', () => {
    const entries = [
      { backend: 'lumera' as const, actionId: 'cascade-123' },
      { backend: 'arweave' as const, transactionId: 'ar-tx-456' },
    ];
    const content = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const hash = computeContentHash(content);

    const encoded = encodeLsp30Uri(entries, hash);
    const decoded = decodeLsp30Uri(encoded, content);

    expect(decoded.entries).toEqual(entries);
  });

  it('should handle complex entries through full round-trip', () => {
    const entries = [
      {
        backend: 'ipfs' as const,
        cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      },
      {
        backend: 's3' as const,
        bucket: 'prod-content',
        key: 'encrypted/2024/q1/data.bin',
        region: 'eu-west-1',
      },
      { backend: 'lumera' as const, actionId: 'action-789-xyz' },
      { backend: 'arweave' as const, transactionId: 'ABCDEF123456' },
    ];
    const content = new Uint8Array(256);
    for (let i = 0; i < 256; i++) content[i] = i;
    const hash = computeContentHash(content);

    const encoded = encodeLsp30Uri(entries, hash);
    const parsed = parseLsp30Uri(encoded);
    const decoded = decodeLsp30Uri(encoded, content);

    expect(parsed.entries).toEqual(entries);
    expect(decoded.entries).toEqual(entries);
  });
});
