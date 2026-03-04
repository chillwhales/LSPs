/**
 * Chain Registry Tests
 */

import { describe, expect, it } from "vitest";
import { CHAINS } from "./chains";

describe("CHAINS", () => {
	it("should have 8 entries", () => {
		expect(Object.keys(CHAINS)).toHaveLength(8);
	});

	it("should have correct LUKSO mainnet chain ID", () => {
		expect(CHAINS.lukso.id).toBe(42);
	});

	it("should have correct LUKSO testnet chain ID", () => {
		expect(CHAINS["lukso-testnet"].id).toBe(4201);
	});

	it("should have correct Ethereum mainnet chain ID", () => {
		expect(CHAINS.ethereum.id).toBe(1);
	});

	it("should have correct Sepolia chain ID", () => {
		expect(CHAINS.sepolia.id).toBe(11155111);
	});

	it("should have correct Base chain ID", () => {
		expect(CHAINS.base.id).toBe(8453);
	});

	it("should distinguish mainnet and testnet types", () => {
		expect(CHAINS.lukso.type).toBe("mainnet");
		expect(CHAINS["lukso-testnet"].type).toBe("testnet");
		expect(CHAINS.sepolia.type).toBe("testnet");
		expect(CHAINS["base-sepolia"].type).toBe("testnet");
	});
});
