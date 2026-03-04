/**
 * File Utility Tests
 */

import { describe, expect, it } from "vitest";
import { formatFileSize } from "./files";

describe("formatFileSize", () => {
	it("should format bytes", () => {
		expect(formatFileSize(0)).toBe("0 B");
		expect(formatFileSize(1)).toBe("1 B");
		expect(formatFileSize(100)).toBe("100 B");
		expect(formatFileSize(1023)).toBe("1023 B");
	});

	it("should format kilobytes", () => {
		expect(formatFileSize(1024)).toBe("1 KB");
		expect(formatFileSize(2048)).toBe("2 KB");
		expect(formatFileSize(10240)).toBe("10 KB");
		expect(formatFileSize(102400)).toBe("100 KB");
	});

	it("should format megabytes", () => {
		expect(formatFileSize(1048576)).toBe("1 MB");
		expect(formatFileSize(2097152)).toBe("2 MB");
		expect(formatFileSize(10485760)).toBe("10 MB");
	});

	it("should format gigabytes", () => {
		expect(formatFileSize(1073741824)).toBe("1 GB");
		expect(formatFileSize(2147483648)).toBe("2 GB");
	});

	it("should format terabytes", () => {
		expect(formatFileSize(1099511627776)).toBe("1 TB");
	});

	it("should handle decimal values", () => {
		expect(formatFileSize(1536)).toBe("1.5 KB");
		expect(formatFileSize(1572864)).toBe("1.5 MB");
	});
});
