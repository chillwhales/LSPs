/**
 * LSP30 Multi-Storage URI Zod Schemas
 *
 * Validates multi-storage entries with a discriminated union on the `backend` field.
 * Four backend types: ipfs, s3, lumera, arweave — each with backend-specific identifier fields.
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

import { z } from "zod";

import { LSP30_MIN_ENTRIES } from "./constants";

// ============================================================================
// Backend-Specific Entry Schemas
// ============================================================================

/**
 * IPFS storage entry
 * Identified by a Content Identifier (CID)
 */
export const lsp30IpfsEntrySchema = z.object({
	backend: z.literal("ipfs"),
	/** IPFS content identifier (CIDv0 or CIDv1) */
	cid: z.string().min(1, "CID is required"),
});

/**
 * S3 storage entry
 * Identified by bucket, key, and region
 */
export const lsp30S3EntrySchema = z.object({
	backend: z.literal("s3"),
	/** S3 bucket name */
	bucket: z.string().min(1, "Bucket is required"),
	/** S3 object key */
	key: z.string().min(1, "Key is required"),
	/** AWS region (e.g., "us-east-1") */
	region: z.string().min(1, "Region is required"),
});

/**
 * Lumera/Pastel Cascade storage entry
 * Identified by a Cascade action ID
 */
export const lsp30LumeraEntrySchema = z.object({
	backend: z.literal("lumera"),
	/** Lumera/Pastel Cascade action ID */
	actionId: z.string().min(1, "Action ID is required"),
});

/**
 * Arweave storage entry
 * Identified by a transaction ID
 */
export const lsp30ArweaveEntrySchema = z.object({
	backend: z.literal("arweave"),
	/** Arweave transaction ID */
	transactionId: z.string().min(1, "Transaction ID is required"),
});

// ============================================================================
// Discriminated Union Schema
// ============================================================================

/**
 * LSP30 entry schema — discriminated union on `backend` field
 *
 * Each entry represents a single storage backend with its backend-specific identifiers.
 * The `backend` field determines which additional fields are required.
 *
 * @example
 * ```typescript
 * const ipfsEntry = { backend: 'ipfs', cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' };
 * const s3Entry = { backend: 's3', bucket: 'my-bucket', key: 'content/file.bin', region: 'us-east-1' };
 * ```
 */
export const lsp30EntrySchema = z.discriminatedUnion("backend", [
	lsp30IpfsEntrySchema,
	lsp30S3EntrySchema,
	lsp30LumeraEntrySchema,
	lsp30ArweaveEntrySchema,
]);

// ============================================================================
// Entries Array Schema
// ============================================================================

/**
 * LSP30 entries array — minimum 2 entries required
 *
 * Single-backend content should use LSP2 VerifiableURI instead.
 * The entries array is unordered — resolvers select based on viewer preference.
 */
export const lsp30EntriesSchema = z
	.array(lsp30EntrySchema)
	.min(
		LSP30_MIN_ENTRIES,
		"LSP30 requires at least 2 storage entries — use LSP2 VerifiableURI for single-backend content",
	);

// ============================================================================
// Full URI Data Schema
// ============================================================================

/**
 * LSP30 URI data schema — input for encoding an LSP30 multi-storage URI
 *
 * Contains the pre-computed content verification hash and the entries array.
 * The hash covers the content bytes (identical across all backends), not the entries JSON.
 */
export const lsp30UriDataSchema = z.object({
	/** keccak256 hash of content bytes, 0x-prefixed 64-char hex string */
	verificationHash: z
		.string()
		.regex(/^0x[0-9a-fA-F]{64}$/, "Must be a 0x-prefixed 64-char hex hash"),
	/** Storage backend entries (minimum 2) */
	entries: lsp30EntriesSchema,
});
