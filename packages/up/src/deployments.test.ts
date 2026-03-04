/**
 * Universal Profile Deployment Tests
 */

import { describe, expect, it } from "vitest";
import { UP_INIT } from "./deployments";

describe("UP_INIT", () => {
	it("should have valid 42-char hex addresses", () => {
		expect(UP_INIT["0.14.0"].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		expect(UP_INIT["0.12.1"].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it("should have non-empty chains arrays", () => {
		expect(UP_INIT["0.14.0"].chains.length).toBeGreaterThan(0);
		expect(UP_INIT["0.12.1"].chains.length).toBeGreaterThan(0);
	});
});
