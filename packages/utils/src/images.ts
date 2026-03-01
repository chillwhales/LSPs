/**
 * Image Utility Functions
 *
 * Pure functions for working with image arrays and finding optimal images.
 * These are general-purpose image selection utilities that work with any
 * image array containing width, height, and url.
 *
 * Note: `findBestImage` and `findClosestImage` live in @chillwhales/lsp2
 * as they are tied to LSP2 Image types. The functions here provide
 * additional image selection strategies.
 */

/**
 * Minimal image type for image utility functions
 */
export interface ImageEntry {
	/** Image width in pixels */
	width: number;
	/** Image height in pixels */
	height: number;
	/** Image URL */
	url: string;
}

/**
 * Find the smallest image by area
 *
 * @param images - Array of images
 * @returns Smallest image or null
 *
 * @example
 * ```typescript
 * const images = [
 *   { url: 'a.png', width: 100, height: 100 },
 *   { url: 'b.png', width: 50, height: 50 },
 * ];
 * findSmallestImage(images) // { url: 'b.png', width: 50, height: 50 }
 * ```
 */
export function findSmallestImage<T extends ImageEntry>(images: T[]): T | null {
	if (images.length === 0) return null;
	if (images.length === 1) return images[0];

	return [...images].sort((a, b) => a.width * a.height - b.width * b.height)[0];
}

/**
 * Find the biggest image by area
 *
 * @param images - Array of images
 * @returns Biggest image or null
 *
 * @example
 * ```typescript
 * const images = [
 *   { url: 'a.png', width: 100, height: 100 },
 *   { url: 'b.png', width: 50, height: 50 },
 * ];
 * findBiggestImage(images) // { url: 'a.png', width: 100, height: 100 }
 * ```
 */
export function findBiggestImage<T extends ImageEntry>(images: T[]): T | null {
	if (images.length === 0) return null;
	if (images.length === 1) return images[0];

	return [...images].sort((a, b) => b.width * b.height - a.width * a.height)[0];
}

/**
 * Find image closest to target using area difference as distance metric
 *
 * This might be more appropriate for some use cases where aspect ratio is less important.
 *
 * @param images - Array of images
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @returns Closest image or null
 *
 * @example
 * ```typescript
 * const images = [
 *   { url: 'a.png', width: 100, height: 100 },
 *   { url: 'b.png', width: 200, height: 200 },
 * ];
 * findClosestImageByArea(images, 150, 150) // { url: 'a.png', ... }
 * ```
 */
export function findClosestImageByArea<T extends ImageEntry>(
	images: T[],
	targetWidth: number,
	targetHeight: number,
): T | null {
	if (!images || images.length === 0) {
		return null;
	}

	const targetArea = targetWidth * targetHeight;

	let closestImage: T | null = null;
	let minDistance = Infinity;

	for (const image of images) {
		const area = image.width * image.height;
		const distance = Math.abs(area - targetArea);

		if (distance < minDistance) {
			minDistance = distance;
			closestImage = image;
		}
	}

	return closestImage;
}

/**
 * Find the smallest image that is at least as large as the target dimensions.
 * Falls back to the biggest available image if none meet the minimum size.
 *
 * @param images - Array of images
 * @param targetWidth - Minimum required width
 * @param targetHeight - Minimum required height
 * @returns Best fitting image or null
 *
 * @example
 * ```typescript
 * const images = [
 *   { url: 'a.png', width: 100, height: 100 },
 *   { url: 'b.png', width: 200, height: 200 },
 *   { url: 'c.png', width: 400, height: 400 },
 * ];
 * findOptimalImage(images, 150, 150) // { url: 'b.png', ... }
 * ```
 */
export function findOptimalImage<T extends ImageEntry>(
	images: T[],
	targetWidth: number,
	targetHeight: number,
): T | null {
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
 * Find image closest to target considering aspect ratio
 *
 * Uses weighted combination of aspect ratio difference and area difference.
 *
 * @param images - Array of images
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @returns Closest image or null
 *
 * @example
 * ```typescript
 * const images = [
 *   { url: 'a.png', width: 160, height: 90 },   // 16:9
 *   { url: 'b.png', width: 100, height: 100 },   // 1:1
 * ];
 * findClosestImageByAspectRatio(images, 320, 180)
 * // { url: 'a.png', ... } (matches 16:9 ratio)
 * ```
 */
export function findClosestImageByAspectRatio<T extends ImageEntry>(
	images: T[],
	targetWidth: number,
	targetHeight: number,
): T | null {
	if (!images || images.length === 0) {
		return null;
	}

	const targetRatio = targetWidth / targetHeight;

	let closestImage: T | null = null;
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
