/**
 * LSP6 Deployment Tests
 */

import { describe, expect, it } from "vitest";
import { LSP6_KEY_MANAGER_INIT } from "./deployments";

describe("LSP6_KEY_MANAGER_INIT", () => {
	it("should have valid 42-char hex addresses", () => {
		expect(LSP6_KEY_MANAGER_INIT["0.14.0"].address).toMatch(
			/^0x[0-9a-fA-F]{40}$/,
		);
		expect(LSP6_KEY_MANAGER_INIT["0.12.1"].address).toMatch(
			/^0x[0-9a-fA-F]{40}$/,
		);
	});

	it("should have non-empty chains arrays", () => {
		expect(LSP6_KEY_MANAGER_INIT["0.14.0"].chains.length).toBeGreaterThan(0);
		expect(LSP6_KEY_MANAGER_INIT["0.12.1"].chains.length).toBeGreaterThan(0);
	});
});
