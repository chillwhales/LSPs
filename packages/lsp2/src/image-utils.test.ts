/**
 * LSP2 Image Utilities Tests
 *
 * Tests for image utility functions with edge cases:
 * - Empty arrays, single images, multiple images
 * - Accurate distance calculations for closest image selection
 * - Target dimension matching and fallback behavior
 */

import { describe, expect, it } from "vitest";
import { VERIFICATION_METHODS } from "./constants";
import { findBestImage, findClosestImage } from "./image-utils";
import type { Image } from "./types";

// ============================================================================
// Test Fixtures
// ============================================================================

const validVerification = {
	data: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

const createImage = (
	width: number,
	height: number,
	url = `image-${width}x${height}.png`,
): Image => ({
	url,
	width,
	height,
	verification: validVerification,
});

const sampleImages: Image[] = [
	createImage(100, 100, "small.png"),
	createImage(500, 300, "medium.png"),
	createImage(1920, 1080, "large.png"),
	createImage(4000, 3000, "xlarge.png"),
];

const singleImage: Image[] = [createImage(800, 600, "single.png")];

// ============================================================================
// findBestImage Tests
// ============================================================================

describe("findBestImage", () => {
	it("should return undefined for empty arrays", () => {
		expect(findBestImage([])).toBeUndefined();
		expect(findBestImage(undefined)).toBeUndefined();
	});

	it("should return first image when no options provided", () => {
		const result = findBestImage(sampleImages);
		expect(result).toBe(sampleImages[0]);
		expect(result?.url).toBe("small.png");
	});

	it("should return first image when options are provided but incomplete", () => {
		const resultWidthOnly = findBestImage(sampleImages, { width: 500 });
		const resultHeightOnly = findBestImage(sampleImages, { height: 300 });
		const resultEmpty = findBestImage(sampleImages, {});

		expect(resultWidthOnly).toBe(sampleImages[0]);
		expect(resultHeightOnly).toBe(sampleImages[0]);
		expect(resultEmpty).toBe(sampleImages[0]);
	});

	it("should find closest image when both width and height provided", () => {
		// Target: 480x320 should be closest to 500x300 (medium.png)
		const result = findBestImage(sampleImages, { width: 480, height: 320 });
		expect(result?.url).toBe("medium.png");
	});

	it("should handle single image arrays", () => {
		const result = findBestImage(singleImage);
		expect(result).toBe(singleImage[0]);
		expect(result?.url).toBe("single.png");
	});

	it("should handle single image with target dimensions", () => {
		const result = findBestImage(singleImage, { width: 1000, height: 1000 });
		expect(result).toBe(singleImage[0]);
		expect(result?.url).toBe("single.png");
	});
});

// ============================================================================
// findClosestImage Tests
// ============================================================================

describe("findClosestImage", () => {
	it("should return null for empty arrays", () => {
		expect(findClosestImage([], 100, 100)).toBeNull();
	});

	it("should return the single image for single-item arrays", () => {
		const result = findClosestImage(singleImage, 1000, 1000);
		expect(result).toBe(singleImage[0]);
	});

	it("should find exact matches", () => {
		const result = findClosestImage(sampleImages, 500, 300);
		expect(result?.url).toBe("medium.png");
	});

	it("should calculate Euclidean distance correctly", () => {
		// Target: 1900x1000
		// Distances:
		// small (100x100): sqrt((1900-100)^2 + (1000-100)^2) = sqrt(3240000 + 810000) = ~2012
		// medium (500x300): sqrt((1900-500)^2 + (1000-300)^2) = sqrt(1960000 + 490000) = ~1565
		// large (1920x1080): sqrt((1900-1920)^2 + (1000-1080)^2) = sqrt(400 + 6400) = ~82
		// xlarge (4000x3000): sqrt((1900-4000)^2 + (1000-3000)^2) = sqrt(4410000 + 4000000) = ~2898

		const result = findClosestImage(sampleImages, 1900, 1000);
		expect(result?.url).toBe("large.png"); // Closest to 1920x1080
	});

	it("should handle target dimensions smaller than all images", () => {
		// Target: 50x50 should be closest to 100x100 (small.png)
		const result = findClosestImage(sampleImages, 50, 50);
		expect(result?.url).toBe("small.png");
	});

	it("should handle target dimensions larger than all images", () => {
		// Target: 5000x4000 should be closest to 4000x3000 (xlarge.png)
		const result = findClosestImage(sampleImages, 5000, 4000);
		expect(result?.url).toBe("xlarge.png");
	});

	it("should handle zero target dimensions", () => {
		// Target: 0x0 should be closest to 100x100 (small.png)
		const result = findClosestImage(sampleImages, 0, 0);
		expect(result?.url).toBe("small.png");
	});

	it("should handle negative target dimensions", () => {
		// Target: -100x-100 should be closest to 100x100 (small.png)
		const result = findClosestImage(sampleImages, -100, -100);
		expect(result?.url).toBe("small.png");
	});

	it("should prefer first image when distances are equal", () => {
		// Create images equidistant from target
		const equalDistanceImages: Image[] = [
			createImage(100, 100, "first.png"),
			createImage(300, 300, "second.png"),
		];

		// Target: 200x200
		// Distance to first (100x100): sqrt(100^2 + 100^2) = sqrt(20000) ≈ 141.42
		// Distance to second (300x300): sqrt(100^2 + 100^2) = sqrt(20000) ≈ 141.42

		const result = findClosestImage(equalDistanceImages, 200, 200);
		expect(result?.url).toBe("first.png"); // Should prefer first due to iteration order
	});

	it("should handle large dimension differences", () => {
		const extremeImages: Image[] = [
			createImage(1, 1, "tiny.png"),
			createImage(10000, 10000, "huge.png"),
		];

		// Target closer to tiny
		const resultTiny = findClosestImage(extremeImages, 10, 10);
		expect(resultTiny?.url).toBe("tiny.png");

		// Target closer to huge
		const resultHuge = findClosestImage(extremeImages, 9000, 9000);
		expect(resultHuge?.url).toBe("huge.png");
	});

	it("should handle aspect ratio differences correctly", () => {
		const aspectRatioImages: Image[] = [
			createImage(1000, 500, "wide.png"), // 2:1 aspect ratio
			createImage(500, 1000, "tall.png"), // 1:2 aspect ratio
			createImage(707, 707, "square.png"), // 1:1 aspect ratio
		];

		// Target: 700x700 (square) should be closest to 707x707
		const result = findClosestImage(aspectRatioImages, 700, 700);
		expect(result?.url).toBe("square.png");
	});
});
