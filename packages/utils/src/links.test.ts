/**
 * Link Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	getHostname,
	getSocialPlatform,
	isSocialPlatformUrl,
	parseAndSortLinks,
	parseLink,
	parseLinks,
	sortLinks,
} from "./links";

describe("link utilities", () => {
	describe("getHostname", () => {
		it("should extract hostname", () => {
			expect(getHostname("https://github.com/user")).toBe("github.com");
		});

		it("should remove www prefix", () => {
			expect(getHostname("https://www.github.com/user")).toBe("github.com");
		});

		it("should return empty for invalid URLs", () => {
			expect(getHostname("invalid")).toBe("");
		});
	});

	describe("getSocialPlatform", () => {
		it("should identify known platforms", () => {
			expect(getSocialPlatform("github.com")).toBe("github");
			expect(getSocialPlatform("twitter.com")).toBe("twitter");
			expect(getSocialPlatform("x.com")).toBe("x");
		});

		it("should return undefined for unknown platforms", () => {
			expect(getSocialPlatform("example.com")).toBeUndefined();
		});
	});

	describe("isSocialPlatformUrl", () => {
		it("should identify social platform URLs", () => {
			expect(isSocialPlatformUrl("https://twitter.com/user")).toBe(true);
			expect(isSocialPlatformUrl("https://example.com")).toBe(false);
		});
	});

	describe("parseLink", () => {
		it("should parse valid link", () => {
			const result = parseLink({
				url: "https://github.com/user",
				title: "GitHub",
			});
			expect(result).toEqual({
				url: "https://github.com/user",
				title: "GitHub",
				hostname: "github.com",
				platform: "github",
			});
		});

		it("should use URL as title when title is null", () => {
			const result = parseLink({
				url: "https://example.com",
				title: null,
			});
			expect(result?.title).toBe("https://example.com");
		});

		it("should return null for invalid URL", () => {
			expect(parseLink({ url: "invalid", title: "test" })).toBeNull();
		});

		it("should return null for empty URL", () => {
			expect(parseLink({ url: "", title: "test" })).toBeNull();
		});
	});

	describe("parseLinks", () => {
		it("should parse and filter invalid links", () => {
			const result = parseLinks([
				{ url: "https://github.com/user", title: "GitHub" },
				{ url: "invalid", title: "Bad" },
			]);
			expect(result).toHaveLength(1);
			expect(result[0].hostname).toBe("github.com");
		});
	});

	describe("sortLinks", () => {
		it("should sort social platforms first", () => {
			const links = [
				{
					url: "https://example.com",
					title: "Website",
					hostname: "example.com",
				},
				{
					url: "https://github.com/user",
					title: "GitHub",
					hostname: "github.com",
					platform: "github" as const,
				},
			];
			const sorted = sortLinks(links);
			expect(sorted[0].platform).toBe("github");
		});
	});

	describe("parseAndSortLinks", () => {
		it("should parse, filter, and sort links", () => {
			const result = parseAndSortLinks([
				{ url: "https://example.com", title: "Website" },
				{ url: "https://twitter.com/user", title: null },
				{ url: "invalid", title: "Bad" },
			]);
			expect(result).toHaveLength(2);
			expect(result[0].platform).toBe("twitter");
		});
	});
});
