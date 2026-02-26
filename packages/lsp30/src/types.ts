/**
 * LSP30 Multi-Storage URI TypeScript Types
 *
 * Entry types are inferred from Zod schemas via z.infer.
 * ParsedLsp30Uri is a manual interface representing the parsed on-chain byte shape
 * (not user input, so no Zod schema needed).
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

import type { Hex } from 'viem';
import type { z } from 'zod';

import type { LSP30_BACKENDS } from './constants';
import type {
  lsp30ArweaveEntrySchema,
  lsp30EntriesSchema,
  lsp30EntrySchema,
  lsp30IpfsEntrySchema,
  lsp30LumeraEntrySchema,
  lsp30S3EntrySchema,
  lsp30UriDataSchema,
} from './schemas';

// ============================================================================
// Backend Type
// ============================================================================

/** Union of supported storage backend identifiers */
export type Lsp30Backend = (typeof LSP30_BACKENDS)[number];

// ============================================================================
// Entry Types (inferred from Zod schemas)
// ============================================================================

/** IPFS storage entry */
export type Lsp30IpfsEntry = z.infer<typeof lsp30IpfsEntrySchema>;

/** S3 storage entry */
export type Lsp30S3Entry = z.infer<typeof lsp30S3EntrySchema>;

/** Lumera/Pastel Cascade storage entry */
export type Lsp30LumeraEntry = z.infer<typeof lsp30LumeraEntrySchema>;

/** Arweave storage entry */
export type Lsp30ArweaveEntry = z.infer<typeof lsp30ArweaveEntrySchema>;

/** Discriminated union of all storage entry types */
export type Lsp30Entry = z.infer<typeof lsp30EntrySchema>;

/** Array of storage entries (minimum 2) */
export type Lsp30Entries = z.infer<typeof lsp30EntriesSchema>;

/** Input data for encoding an LSP30 multi-storage URI */
export type Lsp30UriData = z.infer<typeof lsp30UriDataSchema>;

// ============================================================================
// Parsed URI Type
// ============================================================================

/**
 * Output of parsing an LSP30 multi-storage URI from on-chain bytes
 * Used by parseLsp30Uri (implemented in Plan 02)
 */
export interface ParsedLsp30Uri {
  /** Verification method (4 bytes, e.g., 0x8019f9b1 for keccak256(bytes)) */
  verificationMethod: Hex;
  /** Verification data (keccak256 hash of content bytes) */
  verificationData: Hex;
  /** Decoded and validated storage entries */
  entries: Lsp30Entry[];
}
