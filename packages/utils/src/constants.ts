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
 * LSP23 Linked Contracts Factory
 * Used for deploying Universal Profiles and Key Managers
 */
export const LSP23_FACTORY_ADDRESS =
	"0x2300000A84D25dF63081feAa37ba6b62C4c89a30" as const;

/**
 * LSP23 Post Deployment Module
 * Handles post-deployment setup for Universal Profiles
 */
export const LSP23_POST_DEPLOYMENT_MODULE =
	"0x000000000066093407b6704B89793beFfD0D8F00" as const;

/**
 * Universal Receiver Delegate
 * Default implementation for handling incoming assets/notifications
 */
export const UNIVERSAL_RECEIVER_ADDRESS =
	"0x7870C5B8BC9572A8001C3f96f7ff59961B23500D" as const;

/**
 * LSP26 Follower System
 * On-chain follower/following system for Universal Profiles
 */
export const LSP26_FOLLOWER_SYSTEM_ADDRESS =
	"0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA" as const;

// ============================================================================
// Implementation Contracts
// ============================================================================

/**
 * Standard implementation contracts for proxy patterns
 */
export const IMPLEMENTATIONS = {
	/** Universal Profile implementation contract */
	UNIVERSAL_PROFILE: "0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F" as const,
	/** LSP6 Key Manager implementation contract */
	LSP6_KEY_MANAGER: "0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4" as const,
} as const;

// ============================================================================
// Network Configuration
// ============================================================================

/**
 * Default LUKSO network chain ID (Mainnet: 42, Testnet: 4201)
 */
export const CHAIN_ID = 42;

/**
 * Default RPC endpoint URL for LUKSO mainnet
 */
export const RPC_URL = "https://rpc.lukso.sigmacore.io";

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

// ============================================================================
// File Upload Constants
// ============================================================================

/**
 * Standard image sizes for responsive images
 */
export const IMAGE_SIZES = [180, 320, 640, 1024] as const;

/**
 * Maximum file size for image uploads: 5MB
 */
export const IMAGE_FILE_MAX_SIZE = 5 * 1024 * 1024;

/**
 * Maximum file size for asset uploads: 100MB
 */
export const ASSET_FILE_MAX_SIZE = 100 * 1024 * 1024;

/**
 * UUID pattern string for use in regex construction
 */
export const UUID_PATTERN =
	"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
