/**
 * LSP3 Universal Profile Metadata Utilities
 *
 * Pure functions for working with LSP3 profile metadata.
 */

import { findBestImage, type ImageSize } from "@chillwhales/lsp2";
import type { LSP3Profile } from "./types";

/**
 * Extract profile image URL from Universal Profile metadata.
 * Uses the `profileImage` field and optionally finds the closest image to target dimensions.
 *
 * @param metadata - Universal Profile metadata (expects a `profileImage` array)
 * @param parseUrl - Function to parse/transform the URL (e.g., IPFS parsing)
 * @param options - Optional target dimensions { width, height }
 * @returns Parsed URL from `metadata.profileImage` or undefined if no image
 *
 * @example
 * ```typescript
 * // Get first available profile image
 * getProfileImageUrl(profile, parseIpfsUrl)
 *
 * // Get profile image closest to 64x64
 * getProfileImageUrl(profile, parseIpfsUrl, { width: 64, height: 64 })
 * ```
 */
export function getProfileImageUrl(
	metadata: LSP3Profile,
	parseUrl: (url: string) => string,
	options?: Partial<ImageSize>,
): string | undefined {
	const profileImage = findBestImage(metadata.profileImage, options);
	if (profileImage?.url) {
		return parseUrl(profileImage.url);
	}
	return undefined;
}

/**
 * Get display name for Universal Profile.
 * Falls back to 'Anonymous' if no name.
 *
 * @param metadata - Universal Profile metadata
 * @returns Display name string
 */
export function getProfileDisplayName(metadata: LSP3Profile): string {
	return metadata.name || "Anonymous";
}
