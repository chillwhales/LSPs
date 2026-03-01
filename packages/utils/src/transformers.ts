/**
 * Data Encoding/Decoding Transformers
 *
 * Pure functions for converting between binary and string formats.
 * Works in both Node.js and browser environments.
 */

/**
 * Converts Uint8Array to base64 string
 *
 * Works in both Node.js (uses Buffer) and browser (uses btoa).
 *
 * @param bytes - Bytes to convert
 * @returns Base64 encoded string
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
 * bytesToBase64(bytes) // 'SGVsbG8='
 * ```
 */
export function bytesToBase64(bytes: Uint8Array): string {
	if (typeof Buffer !== "undefined") {
		return Buffer.from(bytes).toString("base64");
	}
	return btoa(String.fromCharCode(...bytes));
}

/**
 * Converts base64 string to Uint8Array
 *
 * Works in both Node.js (uses Buffer) and browser (uses atob).
 *
 * @param base64 - Base64 encoded string
 * @returns Decoded bytes
 *
 * @example
 * ```typescript
 * const bytes = base64ToBytes('SGVsbG8=');
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function base64ToBytes(base64: string): Uint8Array {
	if (typeof Buffer !== "undefined") {
		return new Uint8Array(Buffer.from(base64, "base64"));
	}
	return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Converts a base64 string to ArrayBuffer
 *
 * Handles both raw base64 and data URLs (e.g., "data:application/epub+zip;base64,...").
 * Creates a new ArrayBuffer to ensure type compatibility.
 *
 * @param base64 - Base64 encoded string (raw or data URL)
 * @returns ArrayBuffer
 *
 * @example
 * ```typescript
 * const buffer = base64ToArrayBuffer('SGVsbG8=');
 * // ArrayBuffer with "Hello" content
 * ```
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
	// Remove data URL prefix if present
	const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
	const bytes = base64ToBytes(base64Data);
	// Copy to a new ArrayBuffer to ensure type compatibility
	const buffer = new ArrayBuffer(bytes.length);
	new Uint8Array(buffer).set(bytes);
	return buffer;
}

/**
 * Converts a base64 string to a Blob
 *
 * @param base64 - Base64 encoded string
 * @param mimeType - MIME type for the blob
 * @returns Blob object
 *
 * @example
 * ```typescript
 * const blob = base64ToBlob('SGVsbG8=', 'text/plain');
 * // Blob { type: 'text/plain' }
 * ```
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
	const buffer = base64ToArrayBuffer(base64);
	return new Blob([buffer], { type: mimeType });
}

/**
 * Converts URL-safe base64 string to Uint8Array
 *
 * URL-safe base64 uses `-` and `_` instead of `+` and `/`.
 * This is commonly used for VAPID keys in Web Push notifications.
 *
 * @param base64String - URL-safe base64 encoded string
 * @returns Decoded bytes
 *
 * @example
 * ```typescript
 * const vapidKey = urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY);
 * ```
 */
export function urlBase64ToUint8Array(
	base64String: string,
): Uint8Array<ArrayBuffer> {
	// Add padding if needed
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	// Convert URL-safe chars to standard base64
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = atob(base64);
	// Create a new ArrayBuffer to ensure type compatibility
	const buffer = new ArrayBuffer(rawData.length);
	const outputArray = new Uint8Array(buffer);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Encode a UTF-8 string to base64
 *
 * Handles all UTF-8 characters including emojis and non-Latin characters.
 *
 * @param str - The UTF-8 string to encode
 * @returns Base64 encoded string
 *
 * @example
 * ```typescript
 * utf8ToBase64('Hello') // 'SGVsbG8='
 * utf8ToBase64('Hello 🌍') // 'SGVsbG8g8J+MjQ=='
 * ```
 */
export function utf8ToBase64(str: string): string {
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Decode a base64 string to UTF-8
 *
 * Handles all UTF-8 characters including emojis and non-Latin characters.
 *
 * @param base64 - The base64 string to decode
 * @returns Decoded UTF-8 string
 *
 * @example
 * ```typescript
 * base64ToUtf8('SGVsbG8=') // 'Hello'
 * base64ToUtf8('SGVsbG8g8J+MjQ==') // 'Hello 🌍'
 * ```
 */
export function base64ToUtf8(base64: string): string {
	const binary = atob(base64);
	const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

// ============================================================================
// String Normalization Utilities
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
	return mimeType.toLowerCase().trim();
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

/**
 * Case-insensitive string equality check
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal (case-insensitive)
 *
 * @example
 * ```typescript
 * caseInsensitiveEquals('Hello', 'hello') // true
 * caseInsensitiveEquals('foo', 'bar') // false
 * ```
 */
export function caseInsensitiveEquals(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}
