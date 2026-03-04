/**
 * General Constants
 *
 * Reusable constants for LUKSO ecosystem development.
 * Includes contract addresses, network configuration, and content type definitions.
 */

// ============================================================================
// Special Addresses
// ============================================================================

/**
 * Dead address for burning tokens
 * Standard Ethereum burn address
 */
export const DEAD_ADDRESS =
	"0x000000000000000000000000000000000000dEaD" as const;

// ============================================================================
// Protocol Infrastructure
// ============================================================================

/**
 * Multicall3 contract address
 * Allows batching multiple read calls in a single transaction
 */
export const MULTICALL3_ADDRESS =
	"0xcA11bde05977b3631167028862bE2a173976CA11" as const;

/**
 * Default IPFS gateway URL for content retrieval
 */
export const IPFS_GATEWAY = "https://api.universalprofile.cloud/ipfs/";

// ============================================================================
// Content Type Constants
// ============================================================================

/**
 * Supported video MIME types
 */
export const VIDEO_MIME_TYPES = [
	"video/mp4",
	"video/webm",
	"video/ogg",
	"video/quicktime",
	"video/x-msvideo",
	"video/x-matroska",
] as const;

/**
 * Supported audio MIME types
 */
export const AUDIO_MIME_TYPES = [
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"audio/aac",
	"audio/flac",
	"audio/webm",
] as const;

/**
 * Supported image MIME types
 */
export const IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"image/bmp",
	"image/tiff",
] as const;

/**
 * Supported document MIME types
 */
export const DOCUMENT_MIME_TYPES = [
	"text/plain",
	"text/markdown",
	"text/html",
	"application/pdf",
	"application/epub+zip",
	"application/json",
] as const;

/**
 * All supported asset MIME types
 */
export const ASSET_MIME_TYPES = [
	...VIDEO_MIME_TYPES,
	...AUDIO_MIME_TYPES,
	...IMAGE_MIME_TYPES,
	...DOCUMENT_MIME_TYPES,
] as const;
