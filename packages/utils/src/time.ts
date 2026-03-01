/**
 * Time and Date Formatting Utilities
 *
 * Pure functions for formatting dates, times, and durations.
 * Used throughout applications for consistent time display.
 */

/**
 * Format a date in long format
 *
 * @param date - Date to format
 * @returns Formatted date string or empty string if undefined
 *
 * @example
 * ```typescript
 * formatDate(new Date('2024-01-01')) // "January 01, 2024"
 * formatDate(undefined) // ""
 * ```
 */
export function formatDate(date: Date | undefined): string {
	if (!date) {
		return "";
	}

	return date.toLocaleDateString("en-US", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

/**
 * Format a timestamp (seconds or milliseconds) as a date
 *
 * @param timestamp - Unix timestamp in seconds or milliseconds
 * @param isMilliseconds - Whether timestamp is in milliseconds (default: false)
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatTimestamp(1704067200) // "January 01, 2024"
 * formatTimestamp(1704067200000, true) // "January 01, 2024"
 * ```
 */
export function formatTimestamp(
	timestamp: number,
	isMilliseconds: boolean = false,
): string {
	const ms = isMilliseconds ? timestamp : timestamp * 1000;
	return formatDate(new Date(ms));
}

/**
 * Format a date as a relative time string
 *
 * @param date - Date to format
 * @returns Relative time string (e.g., "2 hours ago", "just now")
 *
 * @example
 * ```typescript
 * formatRelativeTime(new Date(Date.now() - 1000)) // "just now"
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 * formatRelativeTime(new Date(Date.now() - 86400000)) // "1 day ago"
 * ```
 */
export function formatRelativeTime(date: Date): string {
	const now = Date.now();
	const diffMs = now - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	if (diffSeconds < 10) return "just now";
	if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
	if (diffMinutes === 1) return "1 minute ago";
	if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
	if (diffHours === 1) return "1 hour ago";
	if (diffHours < 24) return `${diffHours} hours ago`;
	if (diffDays === 1) return "1 day ago";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffWeeks === 1) return "1 week ago";
	if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
	if (diffMonths === 1) return "1 month ago";
	if (diffMonths < 12) return `${diffMonths} months ago`;
	if (diffYears === 1) return "1 year ago";
	return `${diffYears} years ago`;
}

/**
 * Format a date range as a string
 *
 * @param start - Start date
 * @param end - End date
 * @returns Formatted date range string
 *
 * @example
 * ```typescript
 * formatDateRange(new Date('2024-01-01'), new Date('2024-01-05'))
 * // "January 01 - 05, 2024"
 *
 * formatDateRange(new Date('2024-01-01'), new Date('2024-02-01'))
 * // "January 01 - February 01, 2024"
 * ```
 */
export function formatDateRange(start: Date, end: Date): string {
	const startYear = start.getFullYear();
	const endYear = end.getFullYear();
	const startMonth = start.getMonth();
	const endMonth = end.getMonth();

	if (startYear !== endYear) {
		return `${formatDate(start)} - ${formatDate(end)}`;
	}

	const startFormatted = start.toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
	});

	if (startMonth !== endMonth) {
		return `${startFormatted} - ${formatDate(end)}`;
	}

	const endDay = end.toLocaleDateString("en-US", {
		day: "2-digit",
	});

	return `${startFormatted} - ${endDay}, ${startYear}`;
}

/**
 * Check if a date is today
 *
 * @param date - Date to check
 * @returns true if date is today
 *
 * @example
 * ```typescript
 * isToday(new Date()) // true
 * isToday(new Date(Date.now() - 86400000)) // false
 * ```
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}

/**
 * Check if a date is yesterday
 *
 * @param date - Date to check
 * @returns true if date is yesterday
 *
 * @example
 * ```typescript
 * isYesterday(new Date(Date.now() - 86400000)) // true
 * isYesterday(new Date()) // false
 * ```
 */
export function isYesterday(date: Date): boolean {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return (
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear()
	);
}

/**
 * Format seconds into a human-readable time string (for media players)
 *
 * @param seconds - The number of seconds to format
 * @returns Formatted time string (e.g., "1:23" or "1:02:34")
 *
 * @example
 * ```typescript
 * formatTime(65) // "1:05"
 * formatTime(3661) // "1:01:01"
 * formatTime(0) // "0:00"
 * ```
 */
export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration in seconds to human-readable string
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * formatDuration(3661) // "1 hour, 1 minute, 1 second"
 * formatDuration(90) // "1 minute, 30 seconds"
 * formatDuration(30) // "30 seconds"
 * ```
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
	if (minutes > 0)
		parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
	if (secs > 0 || parts.length === 0)
		parts.push(`${secs} ${secs === 1 ? "second" : "seconds"}`);

	return parts.join(", ");
}

/**
 * Format a date as a compact relative time string
 *
 * Similar to formatRelativeTime but uses short units (m, h, d vs minutes, hours, days).
 * Falls back to short date format after 1 week.
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Compact relative time string
 *
 * @example
 * ```typescript
 * formatRelativeTimeCompact(new Date(Date.now() - 1000)) // "just now"
 * formatRelativeTimeCompact(new Date(Date.now() - 300000)) // "5m ago"
 * formatRelativeTimeCompact(new Date(Date.now() - 7200000)) // "2h ago"
 * formatRelativeTimeCompact(new Date(Date.now() - 172800000)) // "2d ago"
 * ```
 */
export function formatRelativeTimeCompact(
	date: Date,
	options: { dateFormat?: Intl.DateTimeFormatOptions } = {},
): string {
	const now = Date.now();
	const diffMs = now - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	const dateFormat = options.dateFormat ?? {
		month: "short" as const,
		day: "numeric" as const,
	};
	return date.toLocaleDateString(undefined, dateFormat);
}

/**
 * Format a Unix timestamp as a short date with time
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string (e.g., "Jan 28 at 3:00 PM")
 *
 * @example
 * ```typescript
 * formatUnlockDate(1706454000) // "Jan 28, 2024 at 3:00 PM"
 * ```
 */
export function formatUnlockDate(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

/**
 * Format remaining seconds as a countdown string
 *
 * @param remainingSeconds - Number of seconds remaining
 * @param includeSeconds - Whether to include seconds in output (typically when < 24h)
 * @returns Formatted countdown string (e.g., "2 days, 15 hours, 30 minutes")
 *
 * @example
 * ```typescript
 * formatCountdown(90061, false) // "1 day, 1 hour, 1 minute"
 * formatCountdown(3661, true) // "1 hour, 1 minute, 1 second"
 * formatCountdown(0, true) // "0 seconds"
 * ```
 */
export function formatCountdown(
	remainingSeconds: number,
	includeSeconds: boolean,
): string {
	const days = Math.floor(remainingSeconds / 86400);
	const hours = Math.floor((remainingSeconds % 86400) / 3600);
	const minutes = Math.floor((remainingSeconds % 3600) / 60);
	const seconds = Math.floor(remainingSeconds % 60);

	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days} ${days === 1 ? "day" : "days"}`);
	}
	if (hours > 0) {
		parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
	}
	if (minutes > 0) {
		parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
	}
	if (includeSeconds && seconds >= 0) {
		parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
	}

	return parts.join(", ") || "0 seconds";
}
