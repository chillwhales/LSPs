/**
 * LSP29 Encrypted Assets Zod Schemas
 *
 * Defines validation schemas for the v2.0.0 LSP29 structure:
 * - Provider-first encryption (provider + method + params + condition + encryptedKey)
 * - Per-backend chunk references (ipfs.cids, lumera.actionIds, s3.keys, arweave.transactionIds)
 *
 * @see LSP-29-EncryptedAssets.md for full specification
 */

import { z } from 'zod';

import { LSP29_METHODS, LSP29_PROVIDERS } from './constants';

// ============================================================================
// Shared Validation Patterns
// ============================================================================

/** EVM address format: 0x followed by exactly 40 hex characters */
const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const EVM_ADDRESS_MESSAGE = 'Must be a valid EVM address (0x + 40 hex chars)';

// ============================================================================
// File Schema
// ============================================================================

/**
 * File metadata schema
 * Technical metadata about the encrypted file
 */
export const lsp29FileSchema = z.object({
  /** MIME type of the original file (e.g., "video/mp4") */
  type: z.string({
    required_error: 'File type is required',
    invalid_type_error: 'File type must be a string',
  }),
  /** Original filename */
  name: z.string({
    required_error: 'File name is required',
    invalid_type_error: 'File name must be a string',
  }),
  /** Original file size in bytes (before encryption) */
  size: z.number({
    required_error: 'File size is required',
    invalid_type_error: 'File size must be a number',
  }),
  /** Unix timestamp (ms) of file's last modification */
  lastModified: z
    .number({
      invalid_type_error: 'File lastModified must be a number',
    })
    .optional(),
  /** Hash of the original file content (SHA-256, hex) */
  hash: z.string({
    required_error: 'File hash is required',
    invalid_type_error: 'File hash must be a string',
  }),
});

// ============================================================================
// Per-Backend Chunk Schemas
// ============================================================================

/**
 * IPFS chunk references
 * Array of Content Identifiers (CIDs) for encrypted content chunks
 */
export const lsp29IpfsChunksSchema = z.object({
  cids: z.array(z.string().min(1)).min(1),
});

/**
 * Lumera/Pastel Cascade chunk references
 * Array of Cascade action IDs for encrypted content chunks
 */
export const lsp29LumeraChunksSchema = z.object({
  actionIds: z.array(z.string().min(1)).min(1),
});

/**
 * S3 chunk references
 * Array of S3 object keys plus bucket and region identifiers
 */
export const lsp29S3ChunksSchema = z.object({
  keys: z.array(z.string().min(1)).min(1),
  bucket: z.string().min(1),
  region: z.string().min(1),
});

/**
 * Arweave chunk references
 * Array of Arweave transaction IDs for encrypted content chunks
 */
export const lsp29ArweaveChunksSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1),
});

// ============================================================================
// Combined Chunks Schema
// ============================================================================

/**
 * LSP29 chunks schema — per-backend arrays of chunk references
 *
 * Each backend stores its own array of chunk identifiers independently.
 * Chunk counts MAY differ between backends (backends may chunk differently).
 * At least one backend must have chunk entries.
 *
 * @example
 * ```typescript
 * const chunks = {
 *   ipfs: { cids: ['QmX...', 'QmY...'] },
 *   lumera: { actionIds: ['abc123'] },
 *   iv: 'base64-iv-string',
 *   totalSize: 1048576,
 * };
 * ```
 */
export const lsp29ChunksSchema = z
  .object({
    /** IPFS chunk references */
    ipfs: lsp29IpfsChunksSchema.optional(),
    /** Lumera/Pastel Cascade chunk references */
    lumera: lsp29LumeraChunksSchema.optional(),
    /** S3 chunk references */
    s3: lsp29S3ChunksSchema.optional(),
    /** Arweave chunk references */
    arweave: lsp29ArweaveChunksSchema.optional(),
    /** Initialization vector for symmetric encryption (base64) */
    iv: z.string().min(1),
    /** Total size of encrypted content in bytes */
    totalSize: z.number().positive(),
  })
  .refine((data) => data.ipfs || data.lumera || data.s3 || data.arweave, {
    message: 'At least one storage backend must have chunk entries',
  });

// ============================================================================
// Encryption Params Schemas (Discriminated Union)
// ============================================================================

/**
 * Digital Asset Balance encryption parameters
 * Require holding a minimum balance of LSP7 tokens or LSP8 NFTs
 */
export const lsp29DigitalAssetBalanceParamsSchema = z.object({
  method: z.literal('digital-asset-balance'),
  /** Digital asset contract address (LSP7 or LSP8) */
  tokenAddress: z.string().regex(EVM_ADDRESS_REGEX, EVM_ADDRESS_MESSAGE),
  /** Required balance as string (for BigInt compatibility), must be > 0 */
  requiredBalance: z.string().refine((val) => {
    try {
      return BigInt(val) > 0n;
    } catch {
      return false;
    }
  }, 'Required balance must be a positive integer string'),
});

/**
 * LSP8 Ownership encryption parameters
 * Require owning a specific LSP8 NFT by token ID
 */
export const lsp29Lsp8OwnershipParamsSchema = z.object({
  method: z.literal('lsp8-ownership'),
  /** LSP8 token contract address */
  tokenAddress: z.string().regex(EVM_ADDRESS_REGEX, EVM_ADDRESS_MESSAGE),
  /** Required token ID as string */
  requiredTokenId: z.string().min(1),
});

/**
 * LSP26 Follower encryption parameters
 * Require following specific Universal Profiles on-chain
 */
export const lsp29Lsp26FollowerParamsSchema = z.object({
  method: z.literal('lsp26-follower'),
  /** Array of Universal Profile addresses that must be followed */
  followedAddresses: z.array(z.string().regex(EVM_ADDRESS_REGEX, EVM_ADDRESS_MESSAGE)).min(1),
});

/**
 * Time-Locked encryption parameters
 * Content unlocks after a specific date/time
 */
export const lsp29TimeLockedParamsSchema = z.object({
  method: z.literal('time-locked'),
  /** Unix timestamp (seconds) when content becomes accessible */
  unlockTimestamp: z.string().min(1),
});

/**
 * Encryption parameters discriminated union
 *
 * The `method` field serves as the discriminator for type narrowing.
 * Each variant contains method-specific parameters needed for access control verification.
 *
 * @example
 * ```typescript
 * const params = {
 *   method: 'digital-asset-balance' as const,
 *   tokenAddress: '0x1234...',
 *   requiredBalance: '1000000',
 * };
 * ```
 */
export const lsp29EncryptionParamsSchema = z.discriminatedUnion('method', [
  lsp29DigitalAssetBalanceParamsSchema,
  lsp29Lsp8OwnershipParamsSchema,
  lsp29Lsp26FollowerParamsSchema,
  lsp29TimeLockedParamsSchema,
]);

// ============================================================================
// Encryption Schema
// ============================================================================

/**
 * LSP29 encryption schema — provider-first structure
 *
 * Separates the encryption provider from the access control method,
 * enabling provider-agnostic method definitions and extensibility.
 *
 * - `provider`: Which encryption network (taco, lit)
 * - `method`: Which access control check (digital-asset-balance, lsp8-ownership, etc.)
 * - `params`: User-facing parameters for the method (token address, balance, etc.)
 * - `condition`: Full provider-native condition object, stored as-is for external dApp interop
 * - `encryptedKey`: Provider-specific encrypted key data (messageKit for TACo, etc.)
 *
 * @example
 * ```typescript
 * const encryption = {
 *   provider: 'taco',
 *   method: 'digital-asset-balance',
 *   params: { method: 'digital-asset-balance', tokenAddress: '0x...', requiredBalance: '100' },
 *   condition: { /* TACo CompoundCondition * / },
 *   encryptedKey: { messageKit: '0x...' },
 * };
 * ```
 */
export const lsp29EncryptionSchema = z
  .object({
    /** Encryption provider network */
    provider: z.enum(LSP29_PROVIDERS),
    /** Access control method (provider-agnostic) */
    method: z.enum(LSP29_METHODS),
    /** Method-specific parameters for access control verification */
    params: lsp29EncryptionParamsSchema,
    /** Provider-native condition object (stored as-is for external interop) */
    condition: z.unknown(),
    /** Provider-specific encrypted key data */
    encryptedKey: z.record(z.unknown()),
  })
  .refine((data) => data.method === data.params.method, {
    message: 'encryption.method must match encryption.params.method',
    path: ['method'],
  });

// ============================================================================
// LSP29 Encrypted Asset Schema
// ============================================================================

/**
 * LSP29 encrypted asset inner schema (v2.0.0)
 *
 * Contains all metadata fields for an encrypted asset.
 * Version bumped to 2.0.0 due to breaking schema changes
 * (provider-first encryption, per-backend chunks).
 */
export const lsp29EncryptedAssetInnerSchema = z.object({
  /** Schema version — 2.0.0 for new encryption + chunks structure */
  version: z.literal('2.0.0'),
  /** Unique content identifier chosen by creator */
  id: z.string({
    required_error: 'ID is required',
    invalid_type_error: 'ID must be a string',
  }),
  /** Human-readable title for the content */
  title: z.string({
    required_error: 'Title is required',
    invalid_type_error: 'Title must be a string',
  }),
  /** Human-readable description of the content */
  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .optional(),
  /** Social feed images for content preview (LSP4 images format) */
  images: z
    .array(
      z.array(
        z.object({
          url: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
          type: z.string().optional(),
        }),
      ),
    )
    .optional(),
  /** Version number starting at 1, incremented for each update */
  revision: z
    .number({
      required_error: 'Revision is required',
      invalid_type_error: 'Revision must be a number',
    })
    .int('Revision must be an integer')
    .positive('Revision must be positive'),
  /** ISO 8601 timestamp when this revision was created */
  createdAt: z
    .string({
      required_error: 'Created at is required',
      invalid_type_error: 'Created at must be a string',
    })
    .datetime({ offset: true, message: 'Created at must be a valid ISO 8601 datetime' }),
  /** Technical metadata about the encrypted file */
  file: lsp29FileSchema,
  /** Encryption metadata for decryption */
  encryption: lsp29EncryptionSchema,
  /** Chunked storage information */
  chunks: lsp29ChunksSchema,
});

/**
 * LSP29 encrypted asset schema (root wrapper)
 *
 * The top-level schema wraps the inner asset with an `LSP29EncryptedAsset` key,
 * following the LSP convention for typed metadata objects.
 */
export const lsp29EncryptedAssetSchema = z.object({
  LSP29EncryptedAsset: lsp29EncryptedAssetInnerSchema,
});
