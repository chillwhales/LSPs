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
 * For hex strings (starting with "0x"), defaults to 6 start chars and 4 end chars.
 * For other strings, defaults to 4 start chars and 4 end chars.
 *
 * @param value - The string to truncate
 * @param startChars - Number of characters to show at the start (default: 4, or 6 for hex)
 * @param endChars - Number of characters to show at the end (default: 4)
 * @returns Truncated string with ellipsis, or original if short enough
 *
 * @example
 * ```typescript
 * truncate('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
 * // 'QmYw…bdG'
 *
 * truncate('0xabcdef1234567890abcdef')
 * // '0xabcd…cdef'
 *
 * truncate('0xabcdef1234567890abcdef', 6, 4)
 * // '0xabcd…cdef'
 * ```
 */
export function truncate(
	value: string,
	startChars?: number,
	endChars?: number,
): string {
	const isHex = value.startsWith("0x");
	const start = startChars ?? (isHex ? 6 : 4);
	const end = endChars ?? 4;

	if (value.length <= start + end + 1) return value;
	return `${value.slice(0, start)}\u2026${value.slice(-end)}`;
}
