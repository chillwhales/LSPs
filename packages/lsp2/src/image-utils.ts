/**
 * LSP2 Image Utilities
 *
 * Functions for finding optimal images from LSP metadata arrays.
 * Used by downstream LSP3/LSP4 packages for profile and asset images.
 */

import type { Image, ImagesMatrix } from "./types";

/**
 * Image size in pixels
 */
export interface ImageSize {
	/** Width in pixels */
	width: number;
	/** Height in pixels */
	height: number;
}

/**
 * Find the best matching image from an array based on target dimensions.
 * If no dimensions provided, returns the first image.
 *
 * @param images - Array of images with url, width, height
 * @param options - Optional target dimensions
 * @returns The best matching image or undefined
 */
export function findBestImage(
	images: Image[] | undefined,
	options?: Partial<ImageSize>,
): Image | undefined {
	if (!images || images.length === 0) {
		return undefined;
	}

	if (options?.width != null && options?.height != null) {
		return findClosestImage(images, options.width, options.height) ?? undefined;
	}

	return images[0];
}

/**
 * Finds the image closest to the target resolution
 *
 * Uses Euclidean distance in resolution space.
 *
 * @param images - Array of image objects
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @returns The closest image object or null if no images provided
 */
export function findClosestImage(
	images: Image[],
	targetWidth: number,
	targetHeight: number,
): Image | null {
	if (!images || images.length === 0) {
		return null;
	}

	const calculateDistance = (width: number, height: number): number => {
		return Math.sqrt((width - targetWidth) ** 2 + (height - targetHeight) ** 2);
	};

	let closestImage: Image | null = null;
	let minDistance = Infinity;

	for (const image of images) {
		const distance = calculateDistance(image.width, image.height);

		if (distance < minDistance) {
			minDistance = distance;
			closestImage = image;
		}
	}

	return closestImage;
}

// ============================================================================
// Extended Image Utilities (extracted from chillwhales/marketplace)
// ============================================================================

/**
 * Find the smallest image by area (width × height)
 *
 * @param images - Array of images to search
 * @returns The smallest image by area, or null if array is empty
 *
 * @example
 * ```typescript
 * const smallest = findSmallestImage(metadata.images.flat());
 * // Returns the image with the smallest width × height
 * ```
 */
export function findSmallestImage(images: Image[]): Image | null {
	if (images.length === 0) return null;
	if (images.length === 1) return images[0];

	let smallest = images[0];
	let smallestArea = smallest.width * smallest.height;

	for (let i = 1; i < images.length; i++) {
		const area = images[i].width * images[i].height;
		if (area < smallestArea) {
			smallest = images[i];
			smallestArea = area;
		}
	}

	return smallest;
}

/**
 * Find the biggest image by area (width × height)
 *
 * @param images - Array of images to search
 * @returns The biggest image by area, or null if array is empty
 *
 * @example
 * ```typescript
 * const biggest = findBiggestImage(metadata.images.flat());
 * // Returns the image with the largest width × height
 * ```
 */
export function findBiggestImage(images: Image[]): Image | null {
	if (images.length === 0) return null;
	if (images.length === 1) return images[0];

	let biggest = images[0];
	let biggestArea = biggest.width * biggest.height;

	for (let i = 1; i < images.length; i++) {
		const area = images[i].width * images[i].height;
		if (area > biggestArea) {
			biggest = images[i];
			biggestArea = area;
		}
	}

	return biggest;
}

/**
 * Find the smallest image that is at least as large as the target dimensions.
 * Falls back to the biggest available image if none meet the minimum size.
 *
 * Useful when you need a "good enough" image that won't be upscaled.
 *
 * @param images - Array of images to search
 * @param targetWidth - Minimum required width
 * @param targetHeight - Minimum required height
 * @returns The optimal image, or null if array is empty
 *
 * @example
 * ```typescript
 * // Get smallest image that's at least 256×256
 * const img = findOptimalImage(images, 256, 256);
 * ```
 */
export function findOptimalImage(
	images: Image[],
	targetWidth: number,
	targetHeight: number,
): Image | null {
	if (!images || images.length === 0) {
		return null;
	}

	const largeEnough = images.filter(
		(img) => img.width >= targetWidth && img.height >= targetHeight,
	);

	if (largeEnough.length > 0) {
		return findSmallestImage(largeEnough);
	}

	return findBiggestImage(images);
}

/**
 * Find image closest to target using area difference as the distance metric.
 *
 * This may be more appropriate than Euclidean distance when aspect ratio
 * is less important than total pixel count.
 *
 * @param images - Array of images to search
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @returns The closest image by area, or null if array is empty
 *
 * @example
 * ```typescript
 * const img = findClosestImageByArea(images, 800, 600);
 * ```
 */
export function findClosestImageByArea(
	images: Image[],
	targetWidth: number,
	targetHeight: number,
): Image | null {
	if (!images || images.length === 0) {
		return null;
	}

	const targetArea = targetWidth * targetHeight;

	let closestImage: Image | null = null;
	let minDistance = Infinity;

	for (const image of images) {
		const distance = Math.abs(image.width * image.height - targetArea);

		if (distance < minDistance) {
			minDistance = distance;
			closestImage = image;
		}
	}

	return closestImage;
}

/**
 * Find image closest to target using a weighted combination of
 * aspect ratio difference and area difference.
 *
 * Weights: 30% aspect ratio match, 70% area match.
 *
 * @param images - Array of images to search
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @returns The closest image by aspect ratio + area, or null if array is empty
 *
 * @example
 * ```typescript
 * const img = findClosestImageByAspectRatio(images, 1920, 1080);
 * ```
 */
export function findClosestImageByAspectRatio(
	images: Image[],
	targetWidth: number,
	targetHeight: number,
): Image | null {
	if (!images || images.length === 0) {
		return null;
	}

	const targetRatio = targetWidth / targetHeight;

	let closestImage: Image | null = null;
	let minDistance = Infinity;

	for (const image of images) {
		const ratio = image.width / image.height;
		const ratioDiff = Math.abs(ratio - targetRatio);
		const areaDiff = Math.abs(
			image.width * image.height - targetWidth * targetHeight,
		);
		const distance = ratioDiff * 0.3 + areaDiff * 0.7;

		if (distance < minDistance) {
			minDistance = distance;
			closestImage = image;
		}
	}

	return closestImage;
}

/**
 * Get the first preview image URL from a nested images matrix.
 *
 * Takes the first image from the first group in a nested array (e.g., from
 * LSP4 `images` field which is `Image[][]`).
 *
 * @param images - Nested array of images (e.g., `metadata.images`)
 * @param parseUrl - Function to parse/transform the URL (e.g., IPFS gateway resolution)
 * @returns Parsed URL string or null if no valid image found
 *
 * @example
 * ```typescript
 * const url = getPreviewImageUrl(metadata.images, parseIpfsUrl);
 * if (url) {
 *   return <Image src={url} alt="Preview" />;
 * }
 * ```
 */
export function getPreviewImageUrl(
	images: ImagesMatrix | undefined,
	parseUrl: (url: string) => string,
): string | null {
	if (!images || images.length === 0 || images[0].length === 0) {
		return null;
	}
	return parseUrl(images[0][0].url);
}
