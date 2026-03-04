/**
 * LSP26 Deployment Tests
 */

import { describe, expect, it } from "vitest";
import { LSP26_FOLLOWER_SYSTEM } from "./deployments";

describe("LSP26_FOLLOWER_SYSTEM", () => {
	it("should have valid 42-char hex address", () => {
		expect(LSP26_FOLLOWER_SYSTEM.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it("should have non-empty chains array", () => {
		expect(LSP26_FOLLOWER_SYSTEM.chains.length).toBeGreaterThan(0);
	});
});
