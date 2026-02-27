/**
 * LSP29 Encrypted Assets TypeScript Types
 *
 * Types are inferred from Zod schemas via z.infer for single source of truth.
 * Re-exports constant-derived types for convenience.
 *
 * @see LSP-29-EncryptedAssets.md for full specification
 */

import type { z } from "zod";

import type {
	LSP29_BACKENDS,
	LSP29_METHODS,
	LSP29_PROVIDERS,
} from "./constants";
import type {
	lsp29ArweaveChunksSchema,
	lsp29ChunksSchema,
	lsp29DigitalAssetBalanceParamsSchema,
	lsp29EncryptedAssetInnerSchema,
	lsp29EncryptedAssetSchema,
	lsp29EncryptionParamsSchema,
	lsp29EncryptionSchema,
	lsp29FileSchema,
	lsp29IpfsChunksSchema,
	lsp29Lsp8OwnershipParamsSchema,
	lsp29Lsp26FollowerParamsSchema,
	lsp29LumeraChunksSchema,
	lsp29S3ChunksSchema,
	lsp29TimeLockedParamsSchema,
} from "./schemas";

// ============================================================================
// Constant-Derived Types
// ============================================================================

/** Union type of supported encryption provider identifiers */
export type LSP29Provider = (typeof LSP29_PROVIDERS)[number];

/** Union type of supported access control method identifiers */
export type LSP29Method = (typeof LSP29_METHODS)[number];

/** Union type of supported storage backend identifiers */
export type LSP29Backend = (typeof LSP29_BACKENDS)[number];

/** UI metadata for an encryption access control method */
export interface EncryptionMethodMetadata {
	label: string;
	description: string;
}

// ============================================================================
// File Types
// ============================================================================

/** File metadata for the encrypted original */
export type LSP29File = z.infer<typeof lsp29FileSchema>;

// ============================================================================
// Chunk Types
// ============================================================================

/** IPFS chunk references */
export type LSP29IpfsChunks = z.infer<typeof lsp29IpfsChunksSchema>;

/** Lumera/Pastel Cascade chunk references */
export type LSP29LumeraChunks = z.infer<typeof lsp29LumeraChunksSchema>;

/** S3 chunk references */
export type LSP29S3Chunks = z.infer<typeof lsp29S3ChunksSchema>;

/** Arweave chunk references */
export type LSP29ArweaveChunks = z.infer<typeof lsp29ArweaveChunksSchema>;

/** Combined chunks with per-backend arrays and encryption IV */
export type LSP29Chunks = z.infer<typeof lsp29ChunksSchema>;

// ============================================================================
// Encryption Parameter Types
// ============================================================================

/** Digital Asset Balance access control parameters */
export type LSP29DigitalAssetBalanceParams = z.infer<
	typeof lsp29DigitalAssetBalanceParamsSchema
>;

/** LSP8 NFT Ownership access control parameters */
export type LSP29Lsp8OwnershipParams = z.infer<
	typeof lsp29Lsp8OwnershipParamsSchema
>;

/** LSP26 Follower access control parameters */
export type LSP29Lsp26FollowerParams = z.infer<
	typeof lsp29Lsp26FollowerParamsSchema
>;

/** Time-Locked access control parameters */
export type LSP29TimeLockedParams = z.infer<typeof lsp29TimeLockedParamsSchema>;

/** Discriminated union of all encryption parameter variants */
export type LSP29EncryptionParams = z.infer<typeof lsp29EncryptionParamsSchema>;

// ============================================================================
// Encryption Types
// ============================================================================

/** Provider-first encryption metadata */
export type LSP29Encryption = z.infer<typeof lsp29EncryptionSchema>;

// ============================================================================
// Asset Types
// ============================================================================

/** Inner encrypted asset metadata (without the LSP29EncryptedAsset wrapper) */
export type LSP29EncryptedAssetInner = z.infer<
	typeof lsp29EncryptedAssetInnerSchema
>;

/** Root encrypted asset with LSP29EncryptedAsset wrapper key */
export type LSP29EncryptedAsset = z.infer<typeof lsp29EncryptedAssetSchema>;

/** Subset of asset fields needed for encryption/decryption operations */
export type LSP29EncryptionData = Pick<
	LSP29EncryptedAssetInner,
	"file" | "encryption" | "chunks"
>;
