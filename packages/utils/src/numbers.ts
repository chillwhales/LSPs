/**
 * Number Formatting and Manipulation Utilities
 *
 * Pure functions for formatting, parsing, and working with numbers.
 * Used for displaying large numbers, percentages, and numeric data.
 */

/**
 * Helper function to check if a string is numeric
 * Performs strict validation - rejects whitespace, Infinity, and non-finite values
 */
export function isNumeric(value: string): boolean {
	if (typeof value !== "string") return false;

	// Reject empty string or strings with only whitespace
	if (value.trim() === "") return false;

	// Reject strings with leading/trailing whitespace (strict validation)
	if (value !== value.trim()) return false;

	// Reject Infinity and NaN literals (not practical for most numeric attributes)
	if (
		value === "Infinity" ||
		value === "-Infinity" ||
		value === "+Infinity" ||
		value === "NaN"
	)
		return false;

	// Use Number() for strict conversion - it's stricter than parseFloat
	// Number() will return NaN for any string that doesn't represent a complete valid number
	const num = Number(value);

	// Check if conversion was successful and result is finite
	return !Number.isNaN(num) && Number.isFinite(num);
}

/**
 * Format a number with locale-specific separators
 *
 * @param num - Number to format
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1234567.89) // "1,234,567.89"
 * formatNumber(1234567.89, 'de-DE') // "1.234.567,89"
 * ```
 */
export function formatNumber(
	num: number,
	locale: string = "en-US",
	options?: Intl.NumberFormatOptions,
): string {
	return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format a number as a percentage
 *
 * @param num - Number to format (0.5 = 50%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercentage(0.5) // "50.00%"
 * formatPercentage(0.1234, 1) // "12.3%"
 * ```
 */
export function formatPercentage(num: number, decimals: number = 2): string {
	return `${(num * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number in compact notation
 *
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Compact notation string (e.g., "1.2K", "3.4M")
 *
 * @example
 * ```typescript
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(999) // "999"
 * ```
 */
export function formatCompactNumber(num: number, decimals: number = 1): string {
	if (num < 1000) return num.toString();

	const units = ["K", "M", "B", "T"];
	const exp = Math.floor(Math.log10(num) / 3);
	const value = num / 1000 ** exp;

	return `${value.toFixed(decimals)}${units[exp - 1]}`;
}

/**
 * Parse a number from a string safely
 *
 * @param str - String to parse
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Parsed number or fallback
 *
 * @example
 * ```typescript
 * parseNumber('123.45') // 123.45
 * parseNumber('invalid') // 0
 * parseNumber('invalid', -1) // -1
 * ```
 */
export function parseNumber(str: string, fallback: number = 0): number {
	const parsed = Number.parseFloat(str);
	return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Check if a value is a valid positive number
 *
 * @param value - Value to check
 * @returns true if value is a positive number
 *
 * @example
 * ```typescript
 * isPositiveNumber(123) // true
 * isPositiveNumber(0) // false
 * isPositiveNumber(-123) // false
 * ```
 */
export function isPositiveNumber(value: unknown): value is number {
	return (
		typeof value === "number" &&
		value > 0 &&
		!Number.isNaN(value) &&
		Number.isFinite(value)
	);
}

/**
 * Check if a value is a non-negative number (>= 0)
 *
 * @param value - Value to check
 * @returns true if non-negative number
 *
 * @example
 * ```typescript
 * isNonNegativeNumber(0) // true
 * isNonNegativeNumber(123) // true
 * isNonNegativeNumber(-123) // false
 * ```
 */
export function isNonNegativeNumber(value: unknown): value is number {
	return (
		typeof value === "number" &&
		value >= 0 &&
		!Number.isNaN(value) &&
		Number.isFinite(value)
	);
}

/**
 * Clamp a number between min and max values
 *
 * @param num - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 *
 * @example
 * ```typescript
 * clamp(5, 0, 10) // 5
 * clamp(-5, 0, 10) // 0
 * clamp(15, 0, 10) // 10
 * ```
 */
export function clamp(num: number, min: number, max: number): number {
	return Math.min(Math.max(num, min), max);
}

/**
 * Round a number to a specific number of decimal places
 *
 * @param num - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 *
 * @example
 * ```typescript
 * round(1.2345, 2) // 1.23
 * round(1.2345, 0) // 1
 * ```
 */
export function round(num: number, decimals: number = 2): number {
	const multiplier = 10 ** decimals;
	return Math.round(num * multiplier) / multiplier;
}

/**
 * Generate a random integer between min and max (inclusive)
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer between min and max
 *
 * @example
 * ```typescript
 * randomNumber(1, 10) // Random integer between 1 and 10
 * ```
 */
export function randomNumber(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
