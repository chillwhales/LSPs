/**
 * Address Utility Tests
 */

import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import {
	compareAddresses,
	findAddress,
	formatAddress,
	formatAddressWithLabel,
	isAddressInList,
	isValidAddress,
	normalizeAddress,
	safeNormalizeAddress,
	sortAddresses,
	truncateAddress,
	uniqueAddresses,
} from "./address";

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as Address;
const VALID_ADDRESS_CHECKSUMMED =
	"0x1234567890aBcdeF1234567890AbCdEf12345678" as Address;
const ANOTHER_ADDRESS = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;
const INVALID_ADDRESS = "0xinvalid";

describe("normalizeAddress", () => {
	it("normalizes a valid address", () => {
		const result = normalizeAddress(VALID_ADDRESS);
		expect(result).toBe("0x1234567890AbcdEF1234567890aBcdef12345678");
	});

	it("throws on invalid address", () => {
		expect(() => normalizeAddress(INVALID_ADDRESS)).toThrow("Invalid address");
	});
});

describe("safeNormalizeAddress", () => {
	it("normalizes a valid address", () => {
		const result = safeNormalizeAddress(VALID_ADDRESS);
		expect(result).toBe("0x1234567890AbcdEF1234567890aBcdef12345678");
	});

	it("returns null for invalid address", () => {
		const result = safeNormalizeAddress(INVALID_ADDRESS);
		expect(result).toBeNull();
	});
});

describe("isValidAddress", () => {
	it("returns true for valid address", () => {
		expect(isValidAddress(VALID_ADDRESS)).toBe(true);
	});

	it("returns false for invalid address", () => {
		expect(isValidAddress(INVALID_ADDRESS)).toBe(false);
	});

	it("returns false for non-string values", () => {
		expect(isValidAddress(null)).toBe(false);
		expect(isValidAddress(undefined)).toBe(false);
		expect(isValidAddress(123)).toBe(false);
		expect(isValidAddress({})).toBe(false);
	});
});

describe("truncateAddress", () => {
	it("truncates address with default params (6+4)", () => {
		const result = truncateAddress(VALID_ADDRESS);
		expect(result).toBe("0x1234...5678");
	});

	it("truncates address with custom params (8+6)", () => {
		const result = truncateAddress(VALID_ADDRESS, 8, 6);
		expect(result).toBe("0x123456...345678");
	});

	it("returns full address if shorter than truncation length", () => {
		const shortAddr = "0x1234" as Address;
		const result = truncateAddress(shortAddr, 10, 10);
		expect(result).toBe("0x1234");
	});
});

describe("formatAddress", () => {
	it("formats as short (default)", () => {
		expect(formatAddress(VALID_ADDRESS)).toBe("0x1234...5678");
	});

	it("formats as short (explicit)", () => {
		expect(formatAddress(VALID_ADDRESS, "short")).toBe("0x1234...5678");
	});

	it("formats as medium", () => {
		expect(formatAddress(VALID_ADDRESS, "medium")).toBe("0x123456...345678");
	});

	it("formats as long", () => {
		expect(formatAddress(VALID_ADDRESS, "long")).toBe("0x12345678...12345678");
	});

	it("formats as full", () => {
		expect(formatAddress(VALID_ADDRESS, "full")).toBe(VALID_ADDRESS);
	});
});

describe("formatAddressWithLabel", () => {
	it("formats with label", () => {
		const result = formatAddressWithLabel(VALID_ADDRESS, "vitalik.eth");
		expect(result).toBe("vitalik.eth (0x1234...5678)");
	});

	it("formats without label", () => {
		const result = formatAddressWithLabel(VALID_ADDRESS);
		expect(result).toBe("0x1234...5678");
	});

	it("formats without label with custom format", () => {
		const result = formatAddressWithLabel(VALID_ADDRESS, undefined, "medium");
		expect(result).toBe("0x123456...345678");
	});
});

describe("compareAddresses", () => {
	it("returns true for identical addresses", () => {
		expect(compareAddresses(VALID_ADDRESS, VALID_ADDRESS)).toBe(true);
	});

	it("returns true for same address different case", () => {
		expect(compareAddresses(VALID_ADDRESS, VALID_ADDRESS_CHECKSUMMED)).toBe(
			true,
		);
	});

	it("returns false for different addresses", () => {
		expect(compareAddresses(VALID_ADDRESS, ANOTHER_ADDRESS)).toBe(false);
	});

	it("returns true for both null", () => {
		expect(compareAddresses(null, null)).toBe(true);
	});

	it("returns true for both undefined", () => {
		expect(compareAddresses(undefined, undefined)).toBe(true);
	});

	it("returns false when one is null", () => {
		expect(compareAddresses(VALID_ADDRESS, null)).toBe(false);
		expect(compareAddresses(null, VALID_ADDRESS)).toBe(false);
	});
});

describe("isAddressInList", () => {
	const list = [VALID_ADDRESS, ANOTHER_ADDRESS];

	it("returns true when address is in list", () => {
		expect(isAddressInList(VALID_ADDRESS, list)).toBe(true);
	});

	it("returns true when address is in list (case-insensitive)", () => {
		expect(isAddressInList(VALID_ADDRESS_CHECKSUMMED, list)).toBe(true);
	});

	it("returns false when address is not in list", () => {
		const notInList = "0x9999999999999999999999999999999999999999" as Address;
		expect(isAddressInList(notInList, list)).toBe(false);
	});

	it("returns false for empty list", () => {
		expect(isAddressInList(VALID_ADDRESS, [])).toBe(false);
	});
});

describe("findAddress", () => {
	const list = [VALID_ADDRESS, ANOTHER_ADDRESS];

	it("finds address in list", () => {
		expect(findAddress(VALID_ADDRESS, list)).toBe(VALID_ADDRESS);
	});

	it("finds address in list (case-insensitive)", () => {
		expect(findAddress(VALID_ADDRESS_CHECKSUMMED, list)).toBe(VALID_ADDRESS);
	});

	it("returns undefined when address not found", () => {
		const notInList = "0x9999999999999999999999999999999999999999" as Address;
		expect(findAddress(notInList, list)).toBeUndefined();
	});
});

describe("uniqueAddresses", () => {
	it("removes duplicate addresses", () => {
		const addresses = [VALID_ADDRESS, VALID_ADDRESS, ANOTHER_ADDRESS];
		const result = uniqueAddresses(addresses);
		expect(result).toHaveLength(2);
		expect(result).toContain(VALID_ADDRESS);
		expect(result).toContain(ANOTHER_ADDRESS);
	});

	it("removes duplicate addresses (case-insensitive)", () => {
		const addresses = [
			VALID_ADDRESS,
			VALID_ADDRESS_CHECKSUMMED,
			ANOTHER_ADDRESS,
		];
		const result = uniqueAddresses(addresses);
		expect(result).toHaveLength(2);
	});

	it("preserves order of first occurrence", () => {
		const addresses = [ANOTHER_ADDRESS, VALID_ADDRESS, ANOTHER_ADDRESS];
		const result = uniqueAddresses(addresses);
		expect(result).toEqual([ANOTHER_ADDRESS, VALID_ADDRESS]);
	});

	it("handles empty array", () => {
		expect(uniqueAddresses([])).toEqual([]);
	});
});

describe("sortAddresses", () => {
	const unsorted = [ANOTHER_ADDRESS, VALID_ADDRESS];

	it("sorts addresses ascending (default)", () => {
		const result = sortAddresses(unsorted);
		expect(result[0]).toBe(VALID_ADDRESS);
		expect(result[1]).toBe(ANOTHER_ADDRESS);
	});

	it("sorts addresses descending", () => {
		const result = sortAddresses(unsorted, "desc");
		expect(result[0]).toBe(ANOTHER_ADDRESS);
		expect(result[1]).toBe(VALID_ADDRESS);
	});

	it("does not mutate original array", () => {
		const original = [...unsorted];
		sortAddresses(unsorted);
		expect(unsorted).toEqual(original);
	});

	it("handles empty array", () => {
		expect(sortAddresses([])).toEqual([]);
	});
});
