import { describe, expect, it } from "vitest";
import { isEqual } from "./strings";

describe("isHexEqual", () => {
	it("returns true for matching hex (case-insensitive)", () => {
		expect(isEqual("0xAbCd", "0xabcd")).toBe(true);
	});

	it("returns false for non-matching hex", () => {
		expect(isEqual("0xAbCd", "0x1234")).toBe(false);
	});
});
