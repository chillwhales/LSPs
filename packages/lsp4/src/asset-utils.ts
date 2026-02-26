/**
 * LSP4 Digital Asset Metadata Utilities
 *
 * Pure functions for working with LSP4 digital asset metadata (LSP7/LSP8).
 */

import type { Image } from "@chillwhales/lsp2";
import { LSP4Metadata } from "./types";

/**
 * Gets the best image URL from pre-extracted LSP4 Image objects.
 * By default prefers image over icon (for content display).
 * Use preferIcon: true to prefer icon (for compact displays).
 *
 * @param options.image - Pre-extracted image object (from images[0][0])
 * @param options.icon - Pre-extracted icon object (from icon[0])
 * @param options.preferIcon - If true, prefer icon over image (default: false)
 * @param options.parseUrl - Function to parse/transform the URL (e.g., IPFS parsing)
 * @returns Parsed URL or undefined if no image found
 *
 * @example
 * ```typescript
 * // With destructured metadata: images: [[image]], icon: [icon]
 * const imageUrl = getImageUrl({ image, icon, parseUrl });
 * const iconUrl = getImageUrl({ image, icon, preferIcon: true, parseUrl });
 * ```
 */
export function getImageUrl(options: {
  image?: Image | null;
  icon?: Image | null;
  preferIcon?: boolean;
  parseUrl: (url: string) => string;
}): string | undefined {
  const { image, icon, preferIcon = false, parseUrl } = options;
  const primary = preferIcon ? icon : image;
  const fallback = preferIcon ? image : icon;

  if (primary?.url) {
    return parseUrl(primary.url);
  }

  if (fallback?.url) {
    return parseUrl(fallback.url);
  }

  return undefined;
}

/**
 * Get display name for Digital Asset.
 * Uses name, falls back to 'Digital Asset'.
 *
 * @param metadata - Object with optional name field
 * @returns Display name string
 */
export function getAssetDisplayName(metadata: LSP4Metadata): string {
  return metadata.name || "Digital Asset";
}
