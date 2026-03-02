/**
 * ERC725Y On-Chain Reader Tests
 */

import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import { getData } from "./reader";

const contractAddress = "0x1234567890abcdef1234567890abcdef12345678" as Address;

describe("getData", () => {
	it("should call readContract with getData for single key", async () => {
		const mockClient = {
			readContract: vi.fn().mockResolvedValue("0xdeadbeef" as Hex),
		};

		const result = await getData(
			mockClient,
			contractAddress,
			"0xaabbccdd" as Hex,
		);

		expect(result).toBe("0xdeadbeef");
		expect(mockClient.readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address: contractAddress,
				functionName: "getData",
				args: ["0xaabbccdd"],
			}),
		);
	});

	it("should call readContract with getDataBatch for array", async () => {
		const mockClient = {
			readContract: vi.fn().mockResolvedValue(["0xaa" as Hex, "0xbb" as Hex]),
		};
		const dataKeys = ["0x1111" as Hex, "0x2222" as Hex];

		const result = await getData(mockClient, contractAddress, dataKeys);

		expect(result).toEqual(["0xaa", "0xbb"]);
		expect(mockClient.readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: "getDataBatch",
				args: [dataKeys],
			}),
		);
	});

	it("should return empty array for empty keys array", async () => {
		const mockClient = {
			readContract: vi.fn(),
		};

		const result = await getData(mockClient, contractAddress, []);
		expect(result).toEqual([]);
		expect(mockClient.readContract).not.toHaveBeenCalled();
	});

	it("should wrap errors with context", async () => {
		const mockClient = {
			readContract: vi.fn().mockRejectedValue(new Error("RPC failure")),
		};

		await expect(
			getData(mockClient, contractAddress, "0xaabb" as Hex),
		).rejects.toThrow("Failed to read data key 0xaabb: RPC failure");
	});

	it("should wrap errors for batch reads", async () => {
		const mockClient = {
			readContract: vi.fn().mockRejectedValue(new Error("timeout")),
		};

		await expect(
			getData(mockClient, contractAddress, ["0x11" as Hex, "0x22" as Hex]),
		).rejects.toThrow("Failed to read 2 data keys: timeout");
	});
});
