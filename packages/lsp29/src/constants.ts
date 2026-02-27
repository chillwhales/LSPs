/**
 * LSP29 Encrypted Assets Constants
 *
 * ERC725Y data keys, encryption providers, access control methods,
 * storage backends, and UI metadata for the LSP29 standard.
 *
 * @see LSP-29-EncryptedAssets.md for full specification
 */

import type { EncryptionMethodMetadata, LSP29Method } from "./types";

// ============================================================================
// LSP29 Data Keys
// ============================================================================

/**
 * ERC725Y data key prefixes for LSP29 encrypted asset storage
 *
 * - `LSP29EncryptedAssets[]`: Array of encrypted asset entries (index + length)
 * - `LSP29EncryptedAssetsMap`: Mapping prefix for content ID → array index
 * - `LSP29EncryptedAssetRevisionCount`: Mapping prefix for content ID → revision count
 */
export const LSP29DataKeys = {
	"LSP29EncryptedAssets[]": {
		index: "0x1965f98377ddff08e78c93d820cc8de4",
		length:
			"0x1965f98377ddff08e78c93d820cc8de4eeb331e684b7724bce0debb1958386c3",
	},
	LSP29EncryptedAssetsMap: "0x2b9a7a38a67cedc507c2",
	LSP29EncryptedAssetRevisionCount: "0xb41f63e335c22bded814",
} as const;

/**
 * Separator used in ERC725Y mapping key construction (2 bytes)
 * Used between the mapping prefix and the key-specific suffix
 */
export const MAPPING_SEPARATOR = "0x0000" as const;

// ============================================================================
// Encryption Providers
// ============================================================================

/**
 * Supported encryption providers
 *
 * - `taco`: Threshold Access Control (TACo) — current primary provider
 * - `lit`: Lit Protocol — legacy provider (no longer active)
 */
export const LSP29_PROVIDERS = ["taco", "lit"] as const;

// ============================================================================
// Access Control Methods
// ============================================================================

/**
 * Provider-agnostic access control method identifiers
 *
 * These method names are independent of the encryption provider.
 * The provider field determines which network handles the encryption;
 * the method field determines which on-chain condition is checked.
 *
 * - `digital-asset-balance`: Require holding a minimum balance of LSP7 tokens or LSP8 NFTs
 * - `lsp8-ownership`: Require owning a specific LSP8 NFT by token ID
 * - `lsp26-follower`: Require following specific Universal Profiles on-chain
 * - `time-locked`: Content unlocks after a specific date/time
 */
export const LSP29_METHODS = [
	"digital-asset-balance",
	"lsp8-ownership",
	"lsp26-follower",
	"time-locked",
] as const;

// ============================================================================
// Storage Backends
// ============================================================================

/**
 * Closed set of supported storage backends for encrypted content chunks
 *
 * Matches LSP30's backend set by convention (not by import).
 * Adding a backend requires a schema update.
 */
export const LSP29_BACKENDS = ["ipfs", "s3", "lumera", "arweave"] as const;

// ============================================================================
// Encryption Method Metadata
// ============================================================================

/**
 * Human-readable metadata for each access control method
 *
 * Keyed by provider-agnostic method name (not the old compound `taco-*-v1` strings).
 * Used for displaying method information in the UI.
 */
export const ENCRYPTION_METHOD_METADATA: Record<
	LSP29Method,
	EncryptionMethodMetadata
> = {
	"digital-asset-balance": {
		label: "Digital Asset Balance",
		description:
			"Require holding a minimum balance of LSP7 tokens or LSP8 NFTs",
	},
	"lsp8-ownership": {
		label: "LSP8 NFT Ownership",
		description: "Require owning a specific NFT by token ID",
	},
	"lsp26-follower": {
		label: "On-Chain Follower",
		description: "Require following specific Universal Profiles",
	},
	"time-locked": {
		label: "Time-Locked",
		description: "Content unlocks after a specific date/time",
	},
};
