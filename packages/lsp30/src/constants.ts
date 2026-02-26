/**
 * LSP30 Multi-Storage URI Constants
 *
 * These constants mirror LSP2 verification constants locally to avoid
 * external dependencies (this package is standalone).
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

// ============================================================================
// Byte-Level Constants
// ============================================================================

/**
 * Reserved prefix for LSP30 Multi-Storage URI (2 bytes)
 * Distinguishes LSP30 from LSP2 VerifiableURI (0x0000)
 */
export const LSP30_RESERVED_PREFIX = "0x0030" as const;

/**
 * Verification method ID for keccak256(bytes)
 * Computed as: bytes4(keccak256('keccak256(bytes)')) = 0x8019f9b1
 * Same as LSP2 — verification model is identical
 */
export const KECCAK256_BYTES_METHOD_ID = "0x8019f9b1" as const;

/**
 * Length of a keccak256 hash in bytes (32 bytes = 0x0020)
 */
export const HASH_LENGTH_PREFIX = "0x0020" as const;

/**
 * Minimum length of a valid LSP30 URI value in hex characters
 * 2 (prefix) + 4 (method ID) + 2 (hash length) + 32 (hash) = 40 bytes = 80 hex chars + '0x' prefix
 * Note: A valid LSP30 URI will always be longer (entries JSON adds more), but 82 is the structural minimum
 */
export const MIN_LSP30_URI_LENGTH = 82;

// ============================================================================
// Backend Constants
// ============================================================================

/**
 * Closed set of supported storage backends
 * Adding a backend requires a schema update — this is intentional for validation safety
 */
export const LSP30_BACKENDS = ["ipfs", "s3", "lumera", "arweave"] as const;

/**
 * Minimum number of entries required in an LSP30 multi-storage URI
 * Single-backend content should use LSP2 VerifiableURI instead
 */
export const LSP30_MIN_ENTRIES = 2;
