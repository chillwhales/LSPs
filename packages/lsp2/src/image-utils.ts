/**
 * LSP2 Image Utilities
 *
 * Functions for finding optimal images from LSP metadata arrays.
 * Used by downstream LSP3/LSP4 packages for profile and asset images.
 */

import type { Image } from "./types";

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
