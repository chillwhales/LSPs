/**
 * Image Utility Tests
 *
 * Consolidated tests from @chillwhales/lsp2 image-utils and utils/images.
 * Tests for image utility functions with edge cases:
 * - Empty arrays, single images, multiple images
 * - Accurate distance calculations for closest image selection
 * - Target dimension matching and fallback behavior
 */

import type { Image } from "@chillwhales/lsp2";
import { describe, expect, it } from "vitest";
import {
	findBestImage,
	findBiggestImage,
	findClosestImage,
	findClosestImageByArea,
	findClosestImageByAspectRatio,
	findOptimalImage,
	findSmallestImage,
	getPreviewImageUrl,
} from "./images";

// ============================================================================
// Test Fixtures
// ============================================================================

const STUB_VERIFICATION = {
	method: "keccak256(utf8)" as const,
	data: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
};

const createImage = (
	width: number,
	height: number,
	url = `https://example.com/image-${width}x${height}.png`,
): Image => ({
	url,
	width,
	height,
	verification: STUB_VERIFICATION,
});

const sampleImages: Image[] = [
	createImage(100, 100, "https://example.com/small.png"),
	createImage(500, 300, "https://example.com/medium.png"),
	createImage(1920, 1080, "https://example.com/large.png"),
	createImage(4000, 3000, "https://example.com/xlarge.png"),
];

const singleImage: Image[] = [
	createImage(800, 600, "https://example.com/single.png"),
];

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
		expect(result?.url).toBe("https://example.com/small.png");
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
		expect(result?.url).toBe("https://example.com/medium.png");
	});

	it("should handle single image arrays", () => {
		const result = findBestImage(singleImage);
		expect(result).toBe(singleImage[0]);
		expect(result?.url).toBe("https://example.com/single.png");
	});

	it("should handle single image with target dimensions", () => {
		const result = findBestImage(singleImage, { width: 1000, height: 1000 });
		expect(result).toBe(singleImage[0]);
		expect(result?.url).toBe("https://example.com/single.png");
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
		expect(result?.url).toBe("https://example.com/medium.png");
	});

	it("should calculate Euclidean distance correctly", () => {
		// Target: 1900x1000
		// large (1920x1080): sqrt((1900-1920)^2 + (1000-1080)^2) = sqrt(400 + 6400) = ~82
		const result = findClosestImage(sampleImages, 1900, 1000);
		expect(result?.url).toBe("https://example.com/large.png");
	});

	it("should handle target dimensions smaller than all images", () => {
		const result = findClosestImage(sampleImages, 50, 50);
		expect(result?.url).toBe("https://example.com/small.png");
	});

	it("should handle target dimensions larger than all images", () => {
		const result = findClosestImage(sampleImages, 5000, 4000);
		expect(result?.url).toBe("https://example.com/xlarge.png");
	});

	it("should handle zero target dimensions", () => {
		const result = findClosestImage(sampleImages, 0, 0);
		expect(result?.url).toBe("https://example.com/small.png");
	});

	it("should handle negative target dimensions", () => {
		const result = findClosestImage(sampleImages, -100, -100);
		expect(result?.url).toBe("https://example.com/small.png");
	});

	it("should prefer first image when distances are equal", () => {
		const equalDistanceImages: Image[] = [
			createImage(100, 100, "https://example.com/first.png"),
			createImage(300, 300, "https://example.com/second.png"),
		];

		const result = findClosestImage(equalDistanceImages, 200, 200);
		expect(result?.url).toBe("https://example.com/first.png");
	});

	it("should handle large dimension differences", () => {
		const extremeImages: Image[] = [
			createImage(1, 1, "https://example.com/tiny.png"),
			createImage(10000, 10000, "https://example.com/huge.png"),
		];

		const resultTiny = findClosestImage(extremeImages, 10, 10);
		expect(resultTiny?.url).toBe("https://example.com/tiny.png");

		const resultHuge = findClosestImage(extremeImages, 9000, 9000);
		expect(resultHuge?.url).toBe("https://example.com/huge.png");
	});

	it("should handle aspect ratio differences correctly", () => {
		const aspectRatioImages: Image[] = [
			createImage(1000, 500, "https://example.com/wide.png"),
			createImage(500, 1000, "https://example.com/tall.png"),
			createImage(707, 707, "https://example.com/square.png"),
		];

		const result = findClosestImage(aspectRatioImages, 700, 700);
		expect(result?.url).toBe("https://example.com/square.png");
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
		const result = findSmallestImage(sampleImages);
		expect(result?.url).toBe("https://example.com/small.png");
	});

	it("should handle images with same area", () => {
		const sameArea: Image[] = [
			createImage(200, 50, "https://example.com/wide.png"),
			createImage(100, 100, "https://example.com/square.png"),
		];
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
		expect(result?.url).toBe("https://example.com/xlarge.png");
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
		const result = findClosestImageByArea(sampleImages, 500, 300);
		expect(result?.url).toBe("https://example.com/medium.png");
	});

	it("should work with non-matching target", () => {
		const result = findClosestImageByArea(sampleImages, 400, 250);
		expect(result?.url).toBe("https://example.com/medium.png");
	});

	it("should find exact match", () => {
		const result = findClosestImageByArea(sampleImages, 200, 200);
		// Area 40000 — closest to small.png (10000) vs medium.png (150000)
		expect(result?.url).toBe("https://example.com/small.png");
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
		const result = findOptimalImage(sampleImages, 200, 200);
		expect(result?.url).toBe("https://example.com/medium.png");
	});

	it("should fall back to biggest when none large enough", () => {
		const result = findOptimalImage(sampleImages, 5000, 5000);
		expect(result?.url).toBe("https://example.com/xlarge.png");
	});

	it("should handle exact match", () => {
		const result = findOptimalImage(sampleImages, 100, 100);
		expect(result?.url).toBe("https://example.com/small.png");
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
			createImage(1000, 500, "https://example.com/wide.png"),
			createImage(500, 500, "https://example.com/square.png"),
			createImage(800, 600, "https://example.com/standard.png"),
		];

		const result = findClosestImageByAspectRatio(images, 1920, 1080);
		expect(result).not.toBeNull();
	});

	it("should prefer images matching both ratio and area", () => {
		const images: Image[] = [
			createImage(1920, 1080, "https://example.com/match.png"),
			createImage(100, 100, "https://example.com/tiny.png"),
		];

		const result = findClosestImageByAspectRatio(images, 1920, 1080);
		expect(result?.url).toBe("https://example.com/match.png");
	});

	it("should prefer matching aspect ratio", () => {
		const aspectImages: Image[] = [
			createImage(320, 180, "https://example.com/wide.png"),
			createImage(100, 100, "https://example.com/square.png"),
			createImage(180, 320, "https://example.com/tall.png"),
		];
		const result = findClosestImageByAspectRatio(aspectImages, 640, 360);
		expect(result?.url).toBe("https://example.com/wide.png");
	});
});

// ============================================================================
// getPreviewImageUrl Tests
// ============================================================================

describe("getPreviewImageUrl", () => {
	const parseUrl = (url: string) =>
		url.replace("https://ipfs.io/ipfs/", "https://gateway/");

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
				createImage(100, 100, "https://ipfs.io/ipfs/Qm123"),
				createImage(200, 200, "https://ipfs.io/ipfs/Qm456"),
			],
		];
		const result = getPreviewImageUrl(images, parseUrl);
		expect(result).toBe("https://gateway/Qm123");
	});

	it("should use first group only", () => {
		const images = [
			[createImage(100, 100, "https://ipfs.io/ipfs/first")],
			[createImage(200, 200, "https://ipfs.io/ipfs/second")],
		];
		const result = getPreviewImageUrl(images, parseUrl);
		expect(result).toBe("https://gateway/first");
	});
});
