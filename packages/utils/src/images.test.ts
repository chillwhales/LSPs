/**
 * Image Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	findBiggestImage,
	findClosestImageByArea,
	findClosestImageByAspectRatio,
	findOptimalImage,
	findSmallestImage,
} from "./images";

const IMAGES = [
	{ url: "small.png", width: 50, height: 50 },
	{ url: "medium.png", width: 200, height: 200 },
	{ url: "large.png", width: 800, height: 800 },
];

const IMAGES_ASPECT = [
	{ url: "wide.png", width: 320, height: 180 },
	{ url: "square.png", width: 100, height: 100 },
	{ url: "tall.png", width: 180, height: 320 },
];

describe("findSmallestImage", () => {
	it("should find the smallest image by area", () => {
		const result = findSmallestImage(IMAGES);
		expect(result?.url).toBe("small.png");
	});

	it("should return null for empty array", () => {
		expect(findSmallestImage([])).toBeNull();
	});

	it("should return the only image for single-element array", () => {
		const result = findSmallestImage([IMAGES[0]]);
		expect(result?.url).toBe("small.png");
	});
});

describe("findBiggestImage", () => {
	it("should find the biggest image by area", () => {
		const result = findBiggestImage(IMAGES);
		expect(result?.url).toBe("large.png");
	});

	it("should return null for empty array", () => {
		expect(findBiggestImage([])).toBeNull();
	});

	it("should return the only image for single-element array", () => {
		const result = findBiggestImage([IMAGES[2]]);
		expect(result?.url).toBe("large.png");
	});
});

describe("findClosestImageByArea", () => {
	it("should find the closest image by area", () => {
		const result = findClosestImageByArea(IMAGES, 150, 150);
		expect(result?.url).toBe("medium.png");
	});

	it("should return null for empty array", () => {
		expect(findClosestImageByArea([], 100, 100)).toBeNull();
	});

	it("should find exact match", () => {
		const result = findClosestImageByArea(IMAGES, 200, 200);
		expect(result?.url).toBe("medium.png");
	});
});

describe("findOptimalImage", () => {
	it("should find smallest image large enough", () => {
		const result = findOptimalImage(IMAGES, 150, 150);
		expect(result?.url).toBe("medium.png");
	});

	it("should fall back to biggest if none large enough", () => {
		const result = findOptimalImage(IMAGES, 1000, 1000);
		expect(result?.url).toBe("large.png");
	});

	it("should return null for empty array", () => {
		expect(findOptimalImage([], 100, 100)).toBeNull();
	});
});

describe("findClosestImageByAspectRatio", () => {
	it("should prefer matching aspect ratio", () => {
		const result = findClosestImageByAspectRatio(IMAGES_ASPECT, 640, 360);
		expect(result?.url).toBe("wide.png");
	});

	it("should return null for empty array", () => {
		expect(findClosestImageByAspectRatio([], 100, 100)).toBeNull();
	});
});
