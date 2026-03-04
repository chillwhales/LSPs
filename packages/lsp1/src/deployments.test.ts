/**
 * LSP1 Deployment Tests
 */

import { describe, expect, it } from "vitest";
import { LSP1_UNIVERSAL_RECEIVER_DELEGATE } from "./deployments";

describe("LSP1_UNIVERSAL_RECEIVER_DELEGATE", () => {
	it("should have valid 42-char hex addresses", () => {
		expect(LSP1_UNIVERSAL_RECEIVER_DELEGATE["0.14.0"].address).toMatch(
			/^0x[0-9a-fA-F]{40}$/,
		);
		expect(LSP1_UNIVERSAL_RECEIVER_DELEGATE["0.12.1"].address).toMatch(
			/^0x[0-9a-fA-F]{40}$/,
		);
	});

	it("should have non-empty chains arrays", () => {
		expect(
			LSP1_UNIVERSAL_RECEIVER_DELEGATE["0.14.0"].chains.length,
		).toBeGreaterThan(0);
		expect(
			LSP1_UNIVERSAL_RECEIVER_DELEGATE["0.12.1"].chains.length,
		).toBeGreaterThan(0);
	});
});
