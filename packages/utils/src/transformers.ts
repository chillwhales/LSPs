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
