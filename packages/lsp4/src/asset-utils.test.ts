import { describe, it, expect, vi, beforeEach } from "vitest";
import { getImageUrl, getAssetDisplayName } from "./asset-utils";
import { VERIFICATION_METHODS, type Image } from "@chillwhales/lsp2";

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
