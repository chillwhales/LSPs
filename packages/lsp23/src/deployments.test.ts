/**
 * LSP23 Deployment Tests
 */

import { describe, expect, it } from "vitest";
import {
	LSP23_FACTORY,
	UP_INIT_POST_DEPLOYMENT_MODULE,
	UP_POST_DEPLOYMENT_MODULE,
} from "./deployments";

describe("LSP23_FACTORY", () => {
	it("should have valid 42-char hex address", () => {
		expect(LSP23_FACTORY.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it("should have non-empty chains array", () => {
		expect(LSP23_FACTORY.chains.length).toBeGreaterThan(0);
	});
});

describe("UP_INIT_POST_DEPLOYMENT_MODULE", () => {
	it("should have valid 42-char hex address", () => {
		expect(UP_INIT_POST_DEPLOYMENT_MODULE.address).toMatch(
			/^0x[0-9a-fA-F]{40}$/,
		);
	});

	it("should have non-empty chains array", () => {
		expect(UP_INIT_POST_DEPLOYMENT_MODULE.chains.length).toBeGreaterThan(0);
	});
});

describe("UP_POST_DEPLOYMENT_MODULE", () => {
	it("should have valid 42-char hex address", () => {
		expect(UP_POST_DEPLOYMENT_MODULE.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it("should have non-empty chains array", () => {
		expect(UP_POST_DEPLOYMENT_MODULE.chains.length).toBeGreaterThan(0);
	});
});
