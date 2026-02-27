import { describe, expect, it, vi } from "vitest";
import { getProfileDisplayName, getProfileImageUrl } from "./profile-utils";
import type { LSP3Profile } from "./types";

const verification = { data: "0x", method: "keccak256(bytes)" as const };

function makeProfile(overrides: Partial<LSP3Profile> = {}): LSP3Profile {
	return {
		name: "Alice",
		description: "A profile",
		tags: [],
		links: [],
		avatar: [],
		profileImage: [],
		backgroundImage: [],
		...overrides,
	};
}

describe("getProfileDisplayName", () => {
	it("returns name when present", () => {
		const profile = makeProfile({ name: "Bob" });
		expect(getProfileDisplayName(profile)).toBe("Bob");
	});

	it("returns Anonymous when name is null", () => {
		const profile = makeProfile({ name: null });
		expect(getProfileDisplayName(profile)).toBe("Anonymous");
	});

	it("returns Anonymous when name is empty string", () => {
		const profile = makeProfile({ name: "" });
		expect(getProfileDisplayName(profile)).toBe("Anonymous");
	});
});

describe("getProfileImageUrl", () => {
	const parseUrl = vi.fn((url: string) => `parsed:${url}`);

	it("returns undefined when no profileImage", () => {
		const profile = makeProfile({ profileImage: [] });
		expect(getProfileImageUrl(profile, parseUrl)).toBeUndefined();
	});

	it("calls parseUrl with first image URL", () => {
		const profile = makeProfile({
			profileImage: [
				{ url: "ipfs://abc", width: 100, height: 100, verification },
			],
		});
		const result = getProfileImageUrl(profile, parseUrl);
		expect(parseUrl).toHaveBeenCalledWith("ipfs://abc");
		expect(result).toBe("parsed:ipfs://abc");
	});

	it("with target dimensions uses findBestImage to pick closest", () => {
		const profile = makeProfile({
			profileImage: [
				{ url: "ipfs://large", width: 512, height: 512, verification },
				{ url: "ipfs://small", width: 64, height: 64, verification },
			],
		});
		const result = getProfileImageUrl(profile, parseUrl, {
			width: 64,
			height: 64,
		});
		expect(result).toBe("parsed:ipfs://small");
	});
});
