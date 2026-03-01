/**
 * Validation Utilities
 *
 * Pure functions for validating common data types and patterns.
 * Used for input validation, data quality checks, and sanitization.
 */

import { isAddress } from "viem";

/**
 * Check if a value is empty
 *
 * Considers null, undefined, empty string, empty array, and empty object as empty.
 *
 * @param value - Value to check
 * @returns true if value is empty
 *
 * @example
 * ```typescript
 * isEmpty(null) // true
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty('hello') // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim().length === 0;
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "object") return Object.keys(value).length === 0;
	return false;
}

/**
 * Check if a value has content (opposite of isEmpty)
 *
 * @param value - Value to check
 * @returns true if value has content
 *
 * @example
 * ```typescript
 * hasValue('hello') // true
 * hasValue(null) // false
 * ```
 */
export function hasValue(value: unknown): boolean {
	return !isEmpty(value);
}

/**
 * Check if a string is a valid URL
 *
 * @param str - String to validate
 * @returns true if valid URL
 *
 * @example
 * ```typescript
 * isValidUrl('https://example.com') // true
 * isValidUrl('invalid') // false
 * ```
 */
export function isValidUrl(str: string): boolean {
	if (!str || typeof str !== "string") return false;
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if a string is a valid email address
 *
 * Uses a simple but effective email regex pattern.
 *
 * @param str - String to validate
 * @returns true if valid email
 *
 * @example
 * ```typescript
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 * ```
 */
export function isValidEmail(str: string): boolean {
	if (!str || typeof str !== "string") return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(str);
}

/**
 * Check if a string is a valid IPFS URL
 *
 * Matches both ipfs:// protocol and gateway URLs.
 *
 * @param str - String to validate
 * @returns true if valid IPFS URL
 *
 * @example
 * ```typescript
 * isValidIpfsUrl('ipfs://QmXyz...') // true
 * isValidIpfsUrl('https://example.com') // false
 * ```
 */
export function isValidIpfsUrl(str: string): boolean {
	if (!str || typeof str !== "string") return false;
	return str.startsWith("ipfs://") || str.includes("/ipfs/");
}

/**
 * Check if a string is a valid Ethereum/LUKSO address
 *
 * Uses viem's isAddress for proper validation.
 *
 * @param str - String to validate
 * @returns true if valid address
 *
 * @example
 * ```typescript
 * isValidEthereumAddress('0x1234567890abcdef1234567890abcdef12345678') // true
 * isValidEthereumAddress('0xinvalid') // false
 * ```
 */
export function isValidEthereumAddress(str: string): boolean {
	if (!str || typeof str !== "string") return false;
	return isAddress(str);
}

/**
 * Check if a string contains only alphanumeric characters
 *
 * @param str - String to check
 * @returns true if alphanumeric
 *
 * @example
 * ```typescript
 * isAlphanumeric('abc123') // true
 * isAlphanumeric('abc-123') // false
 * ```
 */
export function isAlphanumeric(str: string): boolean {
	if (!str || typeof str !== "string") return false;
	return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Check if a string is a valid hex string (with or without 0x prefix)
 *
 * @param str - String to check
 * @returns true if valid hex
 *
 * @example
 * ```typescript
 * isHexString('0x1234abcd') // true
 * isHexString('0xGHIJ') // false
 * ```
 */
export function isHexString(str: string): boolean {
	if (!str || typeof str !== "string") return false;
	const hex = str.startsWith("0x") ? str.slice(2) : str;
	return /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Check if a value is within a numeric range (inclusive)
 *
 * @param value - Value to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if value is in range
 *
 * @example
 * ```typescript
 * isInRange(5, 0, 10) // true
 * isInRange(11, 0, 10) // false
 * ```
 */
export function isInRange(value: number, min: number, max: number): boolean {
	return value >= min && value <= max;
}

/**
 * Check if a string matches a pattern (regex or string)
 *
 * @param str - String to check
 * @param pattern - Regex or string pattern
 * @returns true if string matches pattern
 *
 * @example
 * ```typescript
 * matchesPattern('hello', /^h/) // true
 * matchesPattern('hello', 'hello') // true
 * ```
 */
export function matchesPattern(str: string, pattern: RegExp | string): boolean {
	if (!str || typeof str !== "string") return false;
	if (typeof pattern === "string") return str === pattern;
	return pattern.test(str);
}

/**
 * Validate that a required field has a value
 *
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns Value if valid
 * @throws {Error} If value is empty
 *
 * @example
 * ```typescript
 * validateRequired('hello', 'name') // 'hello'
 * validateRequired('', 'name') // throws Error
 * ```
 */
export function validateRequired<T>(
	value: T,
	fieldName: string,
): NonNullable<T> {
	if (isEmpty(value)) {
		throw new Error(`${fieldName} is required`);
	}
	return value as NonNullable<T>;
}

/**
 * Sanitize a string by removing HTML tags
 *
 * @param str - String to sanitize
 * @returns Sanitized string
 *
 * @example
 * ```typescript
 * sanitizeHtml('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeHtml('<b>Bold</b> text') // 'Bold text'
 * ```
 */
export function sanitizeHtml(str: string): string {
	if (!str || typeof str !== "string") return "";
	return str.replace(/<[^>]*>/g, "");
}

/**
 * Truncate a string and validate it doesn't exceed max length
 *
 * @param str - String to validate
 * @param maxLength - Maximum length
 * @param truncate - Whether to truncate (true) or throw error (false)
 * @returns Validated/truncated string
 * @throws {Error} If string exceeds max length and truncate is false
 *
 * @example
 * ```typescript
 * validateMaxLength('hello', 10, true) // 'hello'
 * validateMaxLength('hello world', 5, true) // 'he...'
 * ```
 */
export function validateMaxLength(
	str: string,
	maxLength: number,
	truncate: boolean = true,
): string {
	if (str.length <= maxLength) return str;
	if (truncate) {
		return `${str.slice(0, maxLength - 3)}...`;
	}
	throw new Error(`String exceeds maximum length of ${maxLength}`);
}
