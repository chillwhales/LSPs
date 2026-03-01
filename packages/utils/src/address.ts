/**
 * Address Formatting and Comparison Utilities
 *
 * Pure functions for working with Ethereum/LUKSO addresses.
 * Used for display formatting, truncation, and safe comparison.
 */

import { type Address, getAddress, isAddress, isAddressEqual } from "viem";

/**
 * Address display format options
 */
export type AddressFormat = "short" | "medium" | "long" | "full";

/**
 * Normalize an address string to checksummed format
 *
 * Safely wraps viem's getAddress with error handling.
 *
 * @param address - Address string to normalize
 * @returns Checksummed address
 * @throws {Error} If address is invalid
 *
 * @example
 * ```typescript
 * normalizeAddress('0xabc...') // '0xAbC...' (checksummed)
 * normalizeAddress('invalid')  // throws Error
 * ```
 */
export function normalizeAddress(address: string): Address {
	if (!isAddress(address)) {
		throw new Error(`Invalid address: ${address}`);
	}
	return getAddress(address);
}

/**
 * Safely normalize an address, returning null on failure
 *
 * @param address - Address string to normalize
 * @returns Checksummed address or null if invalid
 *
 * @example
 * ```typescript
 * safeNormalizeAddress('0xabc...') // '0xAbC...'
 * safeNormalizeAddress('invalid')  // null
 * ```
 */
export function safeNormalizeAddress(address: string): Address | null {
	try {
		return normalizeAddress(address);
	} catch {
		return null;
	}
}

/**
 * Check if a value is a valid address
 *
 * @param value - Value to check
 * @returns true if valid address
 *
 * @example
 * ```typescript
 * isValidAddress('0x1234...') // true
 * isValidAddress('invalid')   // false
 * isValidAddress(null)        // false
 * ```
 */
export function isValidAddress(value: unknown): value is Address {
	return typeof value === "string" && isAddress(value);
}

/**
 * Truncate an address for display
 *
 * @param address - Address to truncate
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address with ellipsis
 *
 * @example
 * ```typescript
 * truncateAddress('0x1234567890abcdef1234567890abcdef12345678')
 * // '0x1234...5678'
 *
 * truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 8, 6)
 * // '0x123456...345678'
 * ```
 */
export function truncateAddress(
	address: Address,
	startChars: number = 6,
	endChars: number = 4,
): string {
	if (address.length <= startChars + endChars) {
		return address;
	}
	return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format an address for display based on format type
 *
 * @param address - Address to format
 * @param format - Format type (default: 'short')
 * @returns Formatted address string
 *
 * @example
 * ```typescript
 * const addr = '0x1234567890abcdef1234567890abcdef12345678';
 *
 * formatAddress(addr, 'short')  // '0x1234...5678' (6+4)
 * formatAddress(addr, 'medium') // '0x123456...345678' (8+6)
 * formatAddress(addr, 'long')   // '0x12345678...12345678' (10+8)
 * formatAddress(addr, 'full')   // '0x1234567890abcdef1234567890abcdef12345678'
 * ```
 */
export function formatAddress(
	address: Address,
	format: AddressFormat = "short",
): string {
	switch (format) {
		case "short":
			return truncateAddress(address, 6, 4);
		case "medium":
			return truncateAddress(address, 8, 6);
		case "long":
			return truncateAddress(address, 10, 8);
		case "full":
			return address;
		default:
			return truncateAddress(address, 6, 4);
	}
}

/**
 * Format an address with an optional label for UI display
 *
 * @param address - Address to format
 * @param label - Optional label to display (e.g., 'Vitalik.eth', 'Creator')
 * @param format - Address format when no label provided (default: 'short')
 * @returns Formatted string for display
 *
 * @example
 * ```typescript
 * formatAddressWithLabel('0x1234...', 'vitalik.eth')
 * // 'vitalik.eth (0x1234...5678)'
 *
 * formatAddressWithLabel('0x1234...', undefined, 'short')
 * // '0x1234...5678'
 * ```
 */
export function formatAddressWithLabel(
	address: Address,
	label?: string,
	format: AddressFormat = "short",
): string {
	const formatted = formatAddress(address, format);
	return label ? `${label} (${formatted})` : formatted;
}

/**
 * Compare two addresses for equality (case-insensitive, checksum-safe)
 *
 * Handles null/undefined values gracefully.
 *
 * @param a - First address
 * @param b - Second address
 * @returns true if addresses are equal
 *
 * @example
 * ```typescript
 * compareAddresses('0xabc...', '0xABC...') // true (case-insensitive)
 * compareAddresses('0xabc...', '0xdef...') // false
 * compareAddresses(null, null)             // true
 * compareAddresses('0xabc...', null)       // false
 * ```
 */
export function compareAddresses(
	a: Address | null | undefined,
	b: Address | null | undefined,
): boolean {
	if (a === null && b === null) return true;
	if (a === undefined && b === undefined) return true;
	if (!a || !b) return false;
	return isAddressEqual(a, b);
}

/**
 * Check if an address is in a list of addresses
 *
 * @param address - Address to find
 * @param addresses - Array of addresses to search
 * @returns true if address is in the list
 *
 * @example
 * ```typescript
 * const allowed = ['0xabc...', '0xdef...'];
 * isAddressInList('0xABC...', allowed) // true (case-insensitive)
 * isAddressInList('0x123...', allowed) // false
 * ```
 */
export function isAddressInList(
	address: Address,
	addresses: Address[],
): boolean {
	return addresses.some((addr) => compareAddresses(address, addr));
}

/**
 * Find an address in a list (case-insensitive)
 *
 * @param address - Address to find
 * @param addresses - Array of addresses to search
 * @returns The matching address from the list, or undefined
 *
 * @example
 * ```typescript
 * const addresses = ['0xabc...', '0xdef...'];
 * findAddress('0xABC...', addresses) // '0xabc...'
 * findAddress('0x123...', addresses) // undefined
 * ```
 */
export function findAddress(
	address: Address,
	addresses: Address[],
): Address | undefined {
	return addresses.find((addr) => compareAddresses(address, addr));
}

/**
 * Get unique addresses from a list (case-insensitive deduplication)
 *
 * @param addresses - Array of addresses (may contain duplicates)
 * @returns Array of unique addresses
 *
 * @example
 * ```typescript
 * uniqueAddresses(['0xabc...', '0xABC...', '0xdef...'])
 * // ['0xabc...', '0xdef...']
 * ```
 */
export function uniqueAddresses(addresses: Address[]): Address[] {
	const seen = new Set<string>();
	return addresses.filter((addr) => {
		const normalized = addr.toLowerCase();
		if (seen.has(normalized)) return false;
		seen.add(normalized);
		return true;
	});
}

/**
 * Sort addresses alphabetically (case-insensitive)
 *
 * @param addresses - Array of addresses to sort
 * @param order - Sort order (default: 'asc')
 * @returns Sorted array of addresses
 *
 * @example
 * ```typescript
 * sortAddresses(['0xdef...', '0xabc...'])
 * // ['0xabc...', '0xdef...']
 *
 * sortAddresses(['0xabc...', '0xdef...'], 'desc')
 * // ['0xdef...', '0xabc...']
 * ```
 */
export function sortAddresses(
	addresses: Address[],
	order: "asc" | "desc" = "asc",
): Address[] {
	const sorted = [...addresses].sort((a, b) => {
		const comparison = a.toLowerCase().localeCompare(b.toLowerCase());
		return order === "asc" ? comparison : -comparison;
	});
	return sorted;
}
