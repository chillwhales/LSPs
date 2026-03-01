/**
 * String Formatting Utilities
 *
 * Pure functions for string comparison and truncation.
 */

/**
 * Case-insensitive string comparison
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal (case-insensitive)
 *
 * @example
 * ```typescript
 * isEqual('0xAbCd', '0xabcd') // true
 * isEqual('Hello', 'hello') // true
 * ```
 */
export function isEqual(a: string, b: string) {
	return a.toLowerCase() === b.toLowerCase();
}

/**
 * Truncate a long string for display, showing start and end with an ellipsis.
 *
 * @param value - The string to truncate
 * @param startChars - Number of characters to show at the start (default: 8)
 * @param endChars - Number of characters to show at the end (default: 6)
 * @returns Truncated string with ellipsis, or original if short enough
 *
 * @example
 * ```typescript
 * truncate('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
 * // 'QmYwAPJz…PpHdWE'
 *
 * truncate('0xabcdef1234567890abcdef', 6, 4)
 * // '0xabcd…cdef'
 * ```
 */
export function truncate(
	value: string,
	startChars: number = 8,
	endChars: number = 6,
): string {
	if (value.length <= startChars + endChars + 1) return value;
	return `${value.slice(0, startChars)}\u2026${value.slice(-endChars)}`;
}
