/**
 * LSP31 Multi-Storage URI TypeScript Types
 *
 * Entry types are inferred from Zod schemas via z.infer.
 * ParsedLsp31Uri is a manual interface representing the parsed on-chain byte shape
 * (not user input, so no Zod schema needed).
 *
 * @see LSP-31-MultiStorageURI.md for full specification
 */

import type { Hex } from "viem";
import type { z } from "zod";

import type { LSP31_BACKENDS } from "./constants";
import type {
	lsp31ArweaveEntrySchema,
	lsp31EntriesSchema,
	lsp31EntrySchema,
	lsp31IpfsEntrySchema,
	lsp31LumeraEntrySchema,
	lsp31S3EntrySchema,
	lsp31UriDataSchema,
} from "./schemas";

// ============================================================================
// Backend Type
// ============================================================================

/** Union of supported storage backend identifiers */
export type Lsp31Backend = (typeof LSP31_BACKENDS)[number];

// ============================================================================
// Entry Types (inferred from Zod schemas)
// ============================================================================

/** IPFS storage entry */
export type Lsp31IpfsEntry = z.infer<typeof lsp31IpfsEntrySchema>;

/** S3 storage entry */
export type Lsp31S3Entry = z.infer<typeof lsp31S3EntrySchema>;

/** Lumera/Pastel Cascade storage entry */
export type Lsp31LumeraEntry = z.infer<typeof lsp31LumeraEntrySchema>;

/** Arweave storage entry */
export type Lsp31ArweaveEntry = z.infer<typeof lsp31ArweaveEntrySchema>;

/** Discriminated union of all storage entry types */
export type Lsp31Entry = z.infer<typeof lsp31EntrySchema>;

/** Array of storage entries (minimum 2) */
export type Lsp31Entries = z.infer<typeof lsp31EntriesSchema>;

/** Input data for encoding an LSP31 multi-storage URI */
export type Lsp31UriData = z.infer<typeof lsp31UriDataSchema>;

// ============================================================================
// Parsed URI Type
// ============================================================================

/**
 * Output of parsing an LSP31 multi-storage URI from on-chain bytes
 * Used by parseLsp31Uri (implemented in Plan 02)
 */
export interface ParsedLsp31Uri {
	/** Verification method (4 bytes, e.g., 0x8019f9b1 for keccak256(bytes)) */
	verificationMethod: Hex;
	/** Verification data (keccak256 hash of content bytes) */
	verificationData: Hex;
	/** Decoded and validated storage entries */
	entries: Lsp31Entry[];
}
