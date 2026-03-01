/**
 * IPFS Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	cidToGatewayUrl,
	cidToIpfsUrl,
	extractCidFromIpfsUrl,
	isIpfsUrl,
	parseIpfsUrl,
} from "./ipfs";

describe("IPFS utilities", () => {
	describe("extractCidFromIpfsUrl", () => {
		it("should extract CID from ipfs:// URL", () => {
			expect(extractCidFromIpfsUrl("ipfs://QmTest123")).toBe("QmTest123");
		});

		it("should extract CID from gateway URL", () => {
			expect(
				extractCidFromIpfsUrl("https://gateway.ipfs.io/ipfs/QmTest123"),
			).toBe("QmTest123");
		});

		it("should throw for data URIs", () => {
			expect(() =>
				extractCidFromIpfsUrl("data:image/png;base64,iVBORw0"),
			).toThrow("Data URIs cannot be fetched from IPFS");
		});

		it("should return original string if no IPFS pattern found", () => {
			expect(extractCidFromIpfsUrl("QmTest123")).toBe("QmTest123");
		});
	});

	describe("parseIpfsUrl", () => {
		const gateway = "https://api.universalprofile.cloud/ipfs/";

		it("should parse ipfs:// URL with string gateway", () => {
			const result = parseIpfsUrl("ipfs://QmTest123", gateway);
			expect(result).toBe("https://api.universalprofile.cloud/ipfs/QmTest123");
		});

		it("should parse ipfs:// URL with function gateway", () => {
			const result = parseIpfsUrl("ipfs://QmTest123", () => gateway);
			expect(result).toBe("https://api.universalprofile.cloud/ipfs/QmTest123");
		});

		it("should return non-IPFS URLs as-is", () => {
			const url = "https://example.com/image.png";
			expect(parseIpfsUrl(url, gateway)).toBe(url);
		});
	});

	describe("isIpfsUrl", () => {
		it("should return true for ipfs:// URLs", () => {
			expect(isIpfsUrl("ipfs://QmTest123")).toBe(true);
		});

		it("should return true for gateway URLs", () => {
			expect(isIpfsUrl("https://gateway.ipfs.io/ipfs/QmTest123")).toBe(true);
		});

		it("should return false for non-IPFS URLs", () => {
			expect(isIpfsUrl("https://example.com")).toBe(false);
		});
	});

	describe("cidToIpfsUrl", () => {
		it("should create IPFS URL from CID", () => {
			expect(cidToIpfsUrl("QmTest123")).toBe("ipfs://QmTest123");
		});
	});

	describe("cidToGatewayUrl", () => {
		it("should create gateway URL from CID", () => {
			const gateway = "https://api.universalprofile.cloud/ipfs/";
			expect(cidToGatewayUrl("QmTest123", gateway)).toBe(
				"https://api.universalprofile.cloud/ipfs/QmTest123",
			);
		});
	});
});
