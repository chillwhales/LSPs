/**
 * LSP2 ERC725Y JSON Schema Constants
 *
 * @see https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md
 */

// ============================================================================
// Verification Methods
// ============================================================================

/**
 * LSP2 VerifiableURI verification methods
 */
export enum VERIFICATION_METHODS {
  HASH_KECCAK256_UTF8 = "keccak256(utf8)",
  HASH_KECCAK256_BYTES = "keccak256(bytes)",
  ECDSA = "ecdsa",
}

// ============================================================================
// Mapping Keys
// ============================================================================

/** Separator used in LSP2 mapping keys */
export const MAPPING_SEPARATOR = "0x0000";

/**
 * Verification method ID for keccak256(bytes)
 * Computed as: bytes4(keccak256('keccak256(bytes)')) = 0x8019f9b1
 */
export const KECCAK256_BYTES_METHOD_ID = "0x8019f9b1" as const;

/**
 * Reserved bytes prefix (2 bytes of zeros) for VerifiableURI
 */
export const RESERVED_PREFIX = "0x0000" as const;

/**
 * Length of a keccak256 hash in bytes (32 bytes = 0x0020)
 */
export const HASH_LENGTH_PREFIX = "0x0020" as const;

/**
 * Minimum length of a valid VerifiableURI value in bytes
 * 2 (reserved) + 4 (method ID) + 2 (hash length) + 32 (hash) = 40 bytes = 80 hex chars + '0x'
 */
export const MIN_VERIFIABLE_URI_LENGTH = 82;
