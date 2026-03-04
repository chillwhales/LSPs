/**
 * Time Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	formatCountdown,
	formatDate,
	formatDateRange,
	formatDuration,
	formatRelativeTime,
	formatTime,
	formatTimestamp,
	isToday,
	isYesterday,
} from "./time";

describe("time utilities", () => {
	describe("formatDate", () => {
		it("should format dates", () => {
			const date = new Date("2024-01-15T12:00:00Z");
			const result = formatDate(date);
			expect(result).toBe("January 15, 2024");
		});

		it("should handle undefined", () => {
			expect(formatDate(undefined)).toBe("");
		});
	});

	describe("formatTime", () => {
		it("should format seconds as time", () => {
			expect(formatTime(3665)).toBe("1:01:05");
			expect(formatTime(125)).toBe("2:05");
			expect(formatTime(45)).toBe("0:45");
		});

		it("should handle zero", () => {
			expect(formatTime(0)).toBe("0:00");
		});

		it("should handle negative and non-finite values", () => {
			expect(formatTime(-1)).toBe("0:00");
			expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
			expect(formatTime(Number.NaN)).toBe("0:00");
		});
	});

	describe("formatTimestamp", () => {
		it("should format Unix timestamp", () => {
			const timestamp = 1705326000;
			const result = formatTimestamp(timestamp);
			expect(result).toBe("January 15, 2024");
		});
	});

	describe("formatRelativeTime", () => {
		const now = Date.now();

		it('should format "just now"', () => {
			expect(formatRelativeTime(new Date(now - 5000))).toBe("just now");
		});

		it("should format minutes ago", () => {
			expect(formatRelativeTime(new Date(now - 120000))).toBe("2 minutes ago");
		});

		it("should format hours ago", () => {
			expect(formatRelativeTime(new Date(now - 7200000))).toBe("2 hours ago");
		});

		it("should format days ago", () => {
			expect(formatRelativeTime(new Date(now - 172800000))).toBe("2 days ago");
		});
	});

	describe("formatDuration", () => {
		it("should format seconds only", () => {
			expect(formatDuration(45)).toBe("45 seconds");
		});

		it("should format minutes and seconds", () => {
			expect(formatDuration(125)).toBe("2 minutes, 5 seconds");
		});

		it("should format hours, minutes and seconds", () => {
			expect(formatDuration(3661)).toBe("1 hour, 1 minute, 1 second");
		});

		it("should roll hours beyond 24 when includeDays is false (default)", () => {
			expect(formatDuration(86400)).toBe("24 hours");
			expect(formatDuration(90061)).toBe("25 hours, 1 minute, 1 second");
		});

		it("should handle zero", () => {
			expect(formatDuration(0)).toBe("0 seconds");
		});

		describe("with includeDays option", () => {
			it("should break out days when includeDays is true", () => {
				expect(formatDuration(86400, { includeDays: true })).toBe("1 day");
				expect(formatDuration(90061, { includeDays: true })).toBe(
					"1 day, 1 hour, 1 minute, 1 second",
				);
			});

			it("should pluralize days correctly", () => {
				expect(formatDuration(172800, { includeDays: true })).toBe("2 days");
				expect(formatDuration(259200, { includeDays: true })).toBe("3 days");
			});
		});

		describe("with includeSeconds option", () => {
			it("should omit seconds when includeSeconds is false", () => {
				expect(formatDuration(3661, { includeSeconds: false })).toBe(
					"1 hour, 1 minute",
				);
				expect(formatDuration(125, { includeSeconds: false })).toBe(
					"2 minutes",
				);
			});

			it("should still show 0 seconds when no other parts and includeSeconds is true", () => {
				expect(formatDuration(0, { includeSeconds: true })).toBe("0 seconds");
			});

			it("should return empty-safe fallback when includeSeconds is false and duration is small", () => {
				// 45 seconds with includeSeconds: false → no parts → fallback
				expect(formatDuration(45, { includeSeconds: false })).toBe("0 seconds");
			});
		});

		describe("with combined options", () => {
			it("should support includeDays + includeSeconds together", () => {
				expect(
					formatDuration(90061, {
						includeDays: true,
						includeSeconds: false,
					}),
				).toBe("1 day, 1 hour, 1 minute");
			});
		});
	});

	describe("formatCountdown (deprecated wrapper)", () => {
		it("should delegate to formatDuration with includeDays: true", () => {
			expect(formatCountdown(90061, false)).toBe("1 day, 1 hour, 1 minute");
			expect(formatCountdown(90061, true)).toBe(
				"1 day, 1 hour, 1 minute, 1 second",
			);
		});

		it("should handle zero", () => {
			expect(formatCountdown(0, true)).toBe("0 seconds");
			expect(formatCountdown(0, false)).toBe("0 seconds");
		});

		it("should match formatDuration with equivalent options", () => {
			const seconds = 172861; // 2 days, 1 minute, 1 second
			expect(formatCountdown(seconds, true)).toBe(
				formatDuration(seconds, { includeDays: true, includeSeconds: true }),
			);
			expect(formatCountdown(seconds, false)).toBe(
				formatDuration(seconds, { includeDays: true, includeSeconds: false }),
			);
		});
	});

	describe("formatDateRange", () => {
		it("should format date range", () => {
			const start = new Date("2024-01-15T00:00:00Z");
			const end = new Date("2024-01-20T00:00:00Z");
			const result = formatDateRange(start, end);
			expect(result).toContain("January 15");
			expect(result).toContain("2024");
		});
	});

	describe("isToday", () => {
		it("should return true for today", () => {
			expect(isToday(new Date())).toBe(true);
		});

		it("should return false for yesterday", () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			expect(isToday(yesterday)).toBe(false);
		});
	});

	describe("isYesterday", () => {
		it("should return true for yesterday", () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			expect(isYesterday(yesterday)).toBe(true);
		});

		it("should return false for today", () => {
			expect(isYesterday(new Date())).toBe(false);
		});
	});
});
