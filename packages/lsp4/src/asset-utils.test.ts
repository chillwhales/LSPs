import { type Image, VERIFICATION_METHODS } from "@chillwhales/lsp2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAssetDisplayName,
	getAssetImageUrl,
	getImageUrl,
	getNftDisplayName,
	getNftImageUrl,
} from "./asset-utils";
import type { LSP4Metadata, NftMetadata } from "./types";

const verification = {
	data: "0x",
	method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

function makeImage(url: string, size = 100): Image {
	return { url, width: size, height: size, verification };
}

describe("getImageUrl", () => {
	const parseUrl = vi.fn((url: string) => `parsed:${url}`);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns undefined when no image and no icon", () => {
		expect(getImageUrl({ parseUrl })).toBeUndefined();
	});

	it("prefers image over icon by default", () => {
		const image = makeImage("ipfs://img");
		const icon = makeImage("ipfs://icon");
		const result = getImageUrl({ image, icon, parseUrl });
		expect(result).toBe("parsed:ipfs://img");
	});

	it("falls back to icon when no image", () => {
		const icon = makeImage("ipfs://icon");
		const result = getImageUrl({ icon, parseUrl });
		expect(result).toBe("parsed:ipfs://icon");
	});

	it("prefers icon when preferIcon is true", () => {
		const image = makeImage("ipfs://img");
		const icon = makeImage("ipfs://icon");
		const result = getImageUrl({ image, icon, preferIcon: true, parseUrl });
		expect(result).toBe("parsed:ipfs://icon");
	});

	it("falls back to image when preferIcon is true but no icon", () => {
		const image = makeImage("ipfs://img");
		const result = getImageUrl({ image, preferIcon: true, parseUrl });
		expect(result).toBe("parsed:ipfs://img");
	});

	it("calls parseUrl with the correct URL", () => {
		const image = makeImage("ipfs://abc");
		getImageUrl({ image, parseUrl });
		expect(parseUrl).toHaveBeenCalledWith("ipfs://abc");
	});

	it("returns undefined when image has null url", () => {
		expect(getImageUrl({ image: null, icon: null, parseUrl })).toBeUndefined();
	});
});

describe("getAssetDisplayName", () => {
	it("returns name when present", () => {
		expect(getAssetDisplayName({ name: "Asset" })).toBe("Asset");
	});

	it("returns Digital Asset when name is not present", () => {
		expect(getAssetDisplayName({})).toBe("Digital Asset");
	});

	it("returns Digital Asset when name is null", () => {
		expect(getAssetDisplayName({ name: null })).toBe("Digital Asset");
	});

	it("returns Digital Asset when name is empty string", () => {
		expect(getAssetDisplayName({ name: "" })).toBe("Digital Asset");
	});

	it("handles various metadata properties", () => {
		expect(
			getAssetDisplayName({
				name: "My Token",
				description: "A test token",
				category: "collectible",
			}),
		).toBe("My Token");
	});
});

// ============================================================================
// getAssetImageUrl Tests
// ============================================================================

describe("getAssetImageUrl", () => {
	const parseUrl = vi.fn((url: string) => `parsed:${url}`);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns undefined when no icon and no images", () => {
		const metadata = {
			icon: [],
			images: [],
		} as unknown as LSP4Metadata;
		expect(getAssetImageUrl(metadata, parseUrl)).toBeUndefined();
	});

	it("prefers icon over images", () => {
		const metadata = {
			icon: [makeImage("ipfs://icon")],
			images: [[makeImage("ipfs://img")]],
		} as unknown as LSP4Metadata;
		expect(getAssetImageUrl(metadata, parseUrl)).toBe("parsed:ipfs://icon");
	});

	it("falls back to images when no icon", () => {
		const metadata = {
			icon: [],
			images: [[makeImage("ipfs://img")]],
		} as unknown as LSP4Metadata;
		expect(getAssetImageUrl(metadata, parseUrl)).toBe("parsed:ipfs://img");
	});

	it("accepts target dimensions", () => {
		const metadata = {
			icon: [makeImage("ipfs://icon-sm", 50), makeImage("ipfs://icon-lg", 200)],
			images: [],
		} as unknown as LSP4Metadata;
		const result = getAssetImageUrl(metadata, parseUrl, {
			width: 180,
			height: 180,
		});
		expect(result).toBe("parsed:ipfs://icon-lg");
	});
});

// ============================================================================
// getNftImageUrl Tests
// ============================================================================

describe("getNftImageUrl", () => {
	const parseUrl = vi.fn((url: string) => `parsed:${url}`);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns undefined when no images and no icon", () => {
		const metadata = {
			icon: [],
			images: [],
		} as unknown as LSP4Metadata;
		expect(getNftImageUrl(metadata, parseUrl)).toBeUndefined();
	});

	it("prefers images over icon", () => {
		const metadata = {
			icon: [makeImage("ipfs://icon")],
			images: [[makeImage("ipfs://img")]],
		} as unknown as LSP4Metadata;
		expect(getNftImageUrl(metadata, parseUrl)).toBe("parsed:ipfs://img");
	});

	it("falls back to icon when no images", () => {
		const metadata = {
			icon: [makeImage("ipfs://icon")],
			images: [],
		} as unknown as LSP4Metadata;
		expect(getNftImageUrl(metadata, parseUrl)).toBe("parsed:ipfs://icon");
	});
});

// ============================================================================
// getNftDisplayName Tests
// ============================================================================

describe("getNftDisplayName", () => {
	it("returns tokenName with NUMBER format and ID", () => {
		const metadata = {
			tokenName: "CoolCats",
			tokenIdFormat: "NUMBER",
			formattedTokenId: "42",
		} as NftMetadata;
		expect(getNftDisplayName(metadata)).toBe("CoolCats #42");
	});

	it("returns tokenName with non-NUMBER format and ID", () => {
		const metadata = {
			tokenName: "Art",
			tokenIdFormat: "STRING",
			formattedTokenId: "abc123",
		} as NftMetadata;
		expect(getNftDisplayName(metadata)).toBe("Art abc123");
	});

	it("returns tokenName only when no formattedTokenId", () => {
		const metadata = {
			tokenName: "MyNFT",
		} as NftMetadata;
		expect(getNftDisplayName(metadata)).toBe("MyNFT");
	});

	it("falls back to NFT when no tokenName", () => {
		const metadata = {} as NftMetadata;
		expect(getNftDisplayName(metadata)).toBe("NFT");
	});

	it("falls back to NFT with token ID when no tokenName", () => {
		const metadata = {
			tokenIdFormat: "NUMBER",
			formattedTokenId: "1",
		} as NftMetadata;
		expect(getNftDisplayName(metadata)).toBe("NFT #1");
	});
});
