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
import {
	findBestImage,
	findBiggestImage,
	findClosestImage,
	findClosestImageByArea,
	findClosestImageByAspectRatio,
	findOptimalImage,
	findSmallestImage,
	getPreviewImageUrl,
} from "./image-utils";
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

// ============================================================================
// findSmallestImage Tests
// ============================================================================

describe("findSmallestImage", () => {
	it("should return null for empty arrays", () => {
		expect(findSmallestImage([])).toBeNull();
	});

	it("should return the single image for single-item arrays", () => {
		const result = findSmallestImage(singleImage);
		expect(result).toBe(singleImage[0]);
	});

	it("should find the smallest image by area", () => {
		// Areas: 100*100=10000, 500*300=150000, 1920*1080=2073600
		const result = findSmallestImage(sampleImages);
		expect(result?.url).toBe("small.png");
	});

	it("should handle images with same area", () => {
		const sameArea: Image[] = [
			createImage(200, 50, "wide.png"), // area = 10000
			createImage(100, 100, "square.png"), // area = 10000
		];
		// Should return the first one found with the smallest area
		const result = findSmallestImage(sameArea);
		expect(result).not.toBeNull();
	});
});

// ============================================================================
// findBiggestImage Tests
// ============================================================================

describe("findBiggestImage", () => {
	it("should return null for empty arrays", () => {
		expect(findBiggestImage([])).toBeNull();
	});

	it("should return the single image for single-item arrays", () => {
		const result = findBiggestImage(singleImage);
		expect(result).toBe(singleImage[0]);
	});

	it("should find the biggest image by area", () => {
		const result = findBiggestImage(sampleImages);
		expect(result?.url).toBe("xlarge.png");
	});
});

// ============================================================================
// findOptimalImage Tests
// ============================================================================

describe("findOptimalImage", () => {
	it("should return null for empty arrays", () => {
		expect(findOptimalImage([], 100, 100)).toBeNull();
	});

	it("should return null for null/undefined input", () => {
		expect(findOptimalImage(null as unknown as Image[], 100, 100)).toBeNull();
	});

	it("should return smallest image >= target", () => {
		// Target 200x200: 500x300 and 1920x1080 and 4000x3000 all qualify
		// Smallest qualifying is 500x300 (area 150000)
		const result = findOptimalImage(sampleImages, 200, 200);
		expect(result?.url).toBe("medium.png");
	});

	it("should fall back to biggest when none large enough", () => {
		// Target 5000x5000: none qualify
		const result = findOptimalImage(sampleImages, 5000, 5000);
		expect(result?.url).toBe("xlarge.png");
	});

	it("should handle exact match", () => {
		const result = findOptimalImage(sampleImages, 100, 100);
		expect(result?.url).toBe("small.png");
	});
});

// ============================================================================
// findClosestImageByArea Tests
// ============================================================================

describe("findClosestImageByArea", () => {
	it("should return null for empty arrays", () => {
		expect(findClosestImageByArea([], 100, 100)).toBeNull();
	});

	it("should return closest image by area difference", () => {
		// Target 500x300 = area 150000
		// Areas: 10000, 150000, 2073600, 12000000
		// Closest is 150000 (exact match)
		const result = findClosestImageByArea(sampleImages, 500, 300);
		expect(result?.url).toBe("medium.png");
	});

	it("should work with non-matching target", () => {
		// Target 400x250 = area 100000
		// Distances: |10000-100000|=90000, |150000-100000|=50000
		const result = findClosestImageByArea(sampleImages, 400, 250);
		expect(result?.url).toBe("medium.png");
	});
});

// ============================================================================
// findClosestImageByAspectRatio Tests
// ============================================================================

describe("findClosestImageByAspectRatio", () => {
	it("should return null for empty arrays", () => {
		expect(findClosestImageByAspectRatio([], 100, 100)).toBeNull();
	});

	it("should find image with best combined match", () => {
		const images: Image[] = [
			createImage(1000, 500, "wide.png"), // ratio 2.0
			createImage(500, 500, "square.png"), // ratio 1.0
			createImage(800, 600, "standard.png"), // ratio 1.33
		];

		// Target 1920x1080 = ratio 1.78, area 2073600
		// wide: ratioDiff 0.22, areaDiff 1573600 → 0.22*0.3+1573600*0.7
		// square: ratioDiff 0.78, areaDiff 1823600 → ...
		// standard: ratioDiff 0.44, areaDiff 1593600 → ...
		const result = findClosestImageByAspectRatio(images, 1920, 1080);
		expect(result).not.toBeNull();
	});

	it("should prefer images matching both ratio and area", () => {
		const images: Image[] = [
			createImage(1920, 1080, "match.png"),
			createImage(100, 100, "tiny.png"),
		];

		const result = findClosestImageByAspectRatio(images, 1920, 1080);
		expect(result?.url).toBe("match.png");
	});
});

// ============================================================================
// getPreviewImageUrl Tests
// ============================================================================

describe("getPreviewImageUrl", () => {
	const parseUrl = (url: string) => url.replace("ipfs://", "https://gateway/");

	it("should return null for undefined input", () => {
		expect(getPreviewImageUrl(undefined, parseUrl)).toBeNull();
	});

	it("should return null for empty outer array", () => {
		expect(getPreviewImageUrl([], parseUrl)).toBeNull();
	});

	it("should return null for empty inner array", () => {
		expect(getPreviewImageUrl([[]], parseUrl)).toBeNull();
	});

	it("should return first image URL parsed", () => {
		const images = [
			[
				createImage(100, 100, "ipfs://Qm123"),
				createImage(200, 200, "ipfs://Qm456"),
			],
		];
		const result = getPreviewImageUrl(images, parseUrl);
		expect(result).toBe("https://gateway/Qm123");
	});

	it("should use first group only", () => {
		const images = [
			[createImage(100, 100, "ipfs://first")],
			[createImage(200, 200, "ipfs://second")],
		];
		const result = getPreviewImageUrl(images, parseUrl);
		expect(result).toBe("https://gateway/first");
	});
});
