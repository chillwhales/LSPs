/**
 * Constants Tests
 */

import { describe, expect, it } from "vitest";
import {
	ASSET_FILE_MAX_SIZE,
	ASSET_MIME_TYPES,
	AUDIO_MIME_TYPES,
	CHAIN_ID,
	DEAD_ADDRESS,
	DOCUMENT_MIME_TYPES,
	IMAGE_FILE_MAX_SIZE,
	IMAGE_MIME_TYPES,
	IMAGE_SIZES,
	IMPLEMENTATIONS,
	IPFS_GATEWAY,
	LSP23_FACTORY_ADDRESS,
	MULTICALL3_ADDRESS,
	RPC_URL,
	UUID_PATTERN,
	VIDEO_MIME_TYPES,
} from "./constants";

describe("constants", () => {
	describe("addresses", () => {
		it("should export valid addresses", () => {
			expect(DEAD_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(MULTICALL3_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(LSP23_FACTORY_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("should export implementation addresses", () => {
			expect(IMPLEMENTATIONS.UNIVERSAL_PROFILE).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(IMPLEMENTATIONS.LSP6_KEY_MANAGER).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});

	describe("network config", () => {
		it("should export LUKSO mainnet chain ID", () => {
			expect(CHAIN_ID).toBe(42);
		});

		it("should export RPC URL", () => {
			expect(RPC_URL).toContain("lukso");
		});

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

	describe("upload limits", () => {
		it("should export image file max size (5MB)", () => {
			expect(IMAGE_FILE_MAX_SIZE).toBe(5 * 1024 * 1024);
		});

		it("should export asset file max size (100MB)", () => {
			expect(ASSET_FILE_MAX_SIZE).toBe(100 * 1024 * 1024);
		});

		it("should export image sizes", () => {
			expect(IMAGE_SIZES).toContain(180);
			expect(IMAGE_SIZES).toContain(1024);
		});
	});

	describe("patterns", () => {
		it("should export UUID pattern", () => {
			const regex = new RegExp(`^${UUID_PATTERN}$`);
			expect(regex.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
			expect(regex.test("not-a-uuid")).toBe(false);
		});
	});
});
