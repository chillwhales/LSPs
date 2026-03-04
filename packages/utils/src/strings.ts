/**
 * String Utilities
 *
 * Pure functions for string comparison, truncation, normalization,
 * and formatting operations.
 */

// ============================================================================
// String Comparison
// ============================================================================

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
 * Case-insensitive string includes check
 *
 * @param str - The string to search in
 * @param searchStr - The substring to search for
 * @returns true if str contains searchStr (case-insensitive)
 *
 * @example
 * ```typescript
 * caseInsensitiveIncludes('Hello World', 'hello') // true
 * caseInsensitiveIncludes('Hello World', 'xyz') // false
 * ```
 */
export function caseInsensitiveIncludes(
	str: string,
	searchStr: string,
): boolean {
	return str.toLowerCase().includes(searchStr.toLowerCase());
}

// ============================================================================
// String Truncation
// ============================================================================

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

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * truncateString('Hello World', 8) // 'Hello...'
 * truncateString('Short', 10) // 'Short'
 * ```
 */
export function truncateString(
	str: string,
	maxLength: number,
	ellipsis: string = "...",
): string {
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

// ============================================================================
// String Normalization
// ============================================================================

/**
 * Normalize a string (lowercase and trim whitespace)
 *
 * @param str - String to normalize
 * @returns Normalized string (lowercase, no leading/trailing whitespace)
 *
 * @example
 * ```typescript
 * normalizeString('  Hello World  ') // 'hello world'
 * normalizeString('UPPERCASE') // 'uppercase'
 * ```
 */
export function normalizeString(str: string): string {
	return str.toLowerCase().trim();
}

/**
 * Normalize a MIME type (lowercase and trim)
 *
 * MIME types are case-insensitive according to RFC 2045.
 *
 * @param mimeType - MIME type to normalize
 * @returns Normalized MIME type
 *
 * @example
 * ```typescript
 * normalizeMimeType('  Image/PNG  ') // 'image/png'
 * normalizeMimeType('APPLICATION/JSON') // 'application/json'
 * ```
 */
export function normalizeMimeType(mimeType: string): string {
	return normalizeString(mimeType);
}

/**
 * Normalize a URL (trim whitespace)
 *
 * URLs are case-sensitive (except for the protocol and domain),
 * so we only trim whitespace.
 *
 * @param url - URL to normalize
 * @returns Normalized URL
 *
 * @example
 * ```typescript
 * normalizeUrl('  https://example.com/path  ') // 'https://example.com/path'
 * ```
 */
export function normalizeUrl(url: string): string {
	return url.trim();
}

// ============================================================================
// String Formatting
// ============================================================================

/**
 * Capitalize the first letter of a string
 *
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 *
 * @example
 * ```typescript
 * capitalizeFirst('hello') // 'Hello'
 * capitalizeFirst('') // ''
 * ```
 */
export function capitalizeFirst(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string to title case
 *
 * Capitalizes the first letter of each word and lowercases the rest.
 *
 * @param str - String to convert
 * @returns Title case string
 *
 * @example
 * ```typescript
 * toTitleCase('hello world') // 'Hello World'
 * toTitleCase('HELLO WORLD') // 'Hello World'
 * ```
 */
export function toTitleCase(str: string): string {
	return str
		.toLowerCase()
		.split(" ")
		.map((word) => capitalizeFirst(word))
		.join(" ");
}

// ============================================================================
// Whitespace Operations
// ============================================================================

/**
 * Remove all whitespace from a string
 *
 * @param str - String to process
 * @returns String with all whitespace removed
 *
 * @example
 * ```typescript
 * removeWhitespace('Hello World') // 'HelloWorld'
 * ```
 */
export function removeWhitespace(str: string): string {
	return str.replace(/\s+/g, "");
}

/**
 * Collapse multiple whitespaces into single spaces
 *
 * @param str - String to process
 * @returns String with collapsed whitespace
 *
 * @example
 * ```typescript
 * collapseWhitespace('Hello    World') // 'Hello World'
 * ```
 */
export function collapseWhitespace(str: string): string {
	return str.replace(/\s+/g, " ");
}
