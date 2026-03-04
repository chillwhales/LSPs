/**
 * Constants Tests
 */

import { describe, expect, it } from "vitest";
import {
	ASSET_MIME_TYPES,
	AUDIO_MIME_TYPES,
	DEAD_ADDRESS,
	DOCUMENT_MIME_TYPES,
	IMAGE_MIME_TYPES,
	IPFS_GATEWAY,
	MULTICALL3_ADDRESS,
	VIDEO_MIME_TYPES,
} from "./constants";

describe("constants", () => {
	describe("addresses", () => {
		it("should export valid addresses", () => {
			expect(DEAD_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(MULTICALL3_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});

	describe("network config", () => {
		it("should export IPFS gateway", () => {
			expect(IPFS_GATEWAY).toContain("ipfs");
		});
	});

	describe("MIME types", () => {
		it("should have video MIME types", () => {
			expect(VIDEO_MIME_TYPES).toContain("video/mp4");
			expect(VIDEO_MIME_TYPES.length).toBeGreaterThan(0);
		});

		it("should have audio MIME types", () => {
			expect(AUDIO_MIME_TYPES).toContain("audio/mpeg");
		});

		it("should have image MIME types", () => {
			expect(IMAGE_MIME_TYPES).toContain("image/png");
			expect(IMAGE_MIME_TYPES).toContain("image/jpeg");
		});

		it("should have document MIME types", () => {
			expect(DOCUMENT_MIME_TYPES).toContain("application/pdf");
		});

		it("should combine all asset MIME types", () => {
			expect(ASSET_MIME_TYPES.length).toBe(
				VIDEO_MIME_TYPES.length +
					AUDIO_MIME_TYPES.length +
					IMAGE_MIME_TYPES.length +
					DOCUMENT_MIME_TYPES.length,
			);
		});
	});
});
