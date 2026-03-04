/**
 * LSP8 Deployment Tests
 */

import { describe, expect, it } from "vitest";
import { LSP8_MINTABLE_INIT } from "./deployments";

describe("LSP8_MINTABLE_INIT", () => {
	it("should have valid 42-char hex address", () => {
		expect(LSP8_MINTABLE_INIT["0.14.0"].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it("should have non-empty chains array", () => {
		expect(LSP8_MINTABLE_INIT["0.14.0"].chains.length).toBeGreaterThan(0);
	});
});
