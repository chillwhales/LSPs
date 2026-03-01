/**
 * Currency and Token Formatting Utilities
 *
 * Pure functions for formatting prices, token amounts, and currency values.
 * Includes micro-USD conversion for smart contract storage.
 */

import { formatNumber } from "./numbers";

/**
 * Format a number as USD currency
 *
 * @param price - The price to format
 * @returns Formatted price string (e.g., "$10.00")
 *
 * @example
 * ```typescript
 * formatPrice(10.5) // "$10.50"
 * formatPrice(1000) // "$1,000.00"
 * ```
 */
export function formatPrice(price: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(price);
}

// ============================================================================
// Micro-USD Price Conversion Utilities
// ============================================================================

/** Micro-USD uses 6 decimal places for smart contract storage */
export const MICRO_USD_DECIMALS = 6;
export const MICRO_USD_MULTIPLIER = 1_000_000;

/**
 * Convert USD to micro-USD (6 decimals) for smart contract storage
 *
 * @param usd - Price in USD (e.g., 10.50)
 * @returns Price in micro-USD as string (e.g., "10500000")
 *
 * @example
 * ```typescript
 * usdToMicroUsd(10) // "10000000"
 * usdToMicroUsd(10.50) // "10500000"
 * usdToMicroUsd(0.01) // "10000"
 * ```
 */
export function usdToMicroUsd(usd: number): string {
	return BigInt(Math.round(usd * MICRO_USD_MULTIPLIER)).toString();
}

/**
 * Convert USD to micro-USD (6 decimals) as a bigint
 *
 * Use this when you need the BigInt value directly (e.g., for blockchain operations).
 *
 * @param usd - Price in USD (e.g., 10.50)
 * @returns Price in micro-USD as bigint (e.g., 10500000n)
 *
 * @example
 * ```typescript
 * usdToMicroUsdBigInt(10) // 10000000n
 * usdToMicroUsdBigInt(10.50) // 10500000n
 * usdToMicroUsdBigInt(0.01) // 10000n
 * ```
 */
export function usdToMicroUsdBigInt(usd: number): bigint {
	return BigInt(Math.round(usd * MICRO_USD_MULTIPLIER));
}

/**
 * Convert micro-USD (6 decimals) to USD number
 *
 * @param microUsd - Price in micro-USD as string or number (e.g., "10500000")
 * @returns Price in USD as number (e.g., 10.5)
 *
 * @example
 * ```typescript
 * microUsdToUsd("10000000") // 10
 * microUsdToUsd("10500000") // 10.5
 * microUsdToUsd("10000") // 0.01
 * ```
 */
export function microUsdToUsd(microUsd: string | number): number {
	return Number(BigInt(microUsd)) / MICRO_USD_MULTIPLIER;
}

/**
 * Format micro-USD (6 decimals) directly to currency string
 *
 * @param microUsd - Price in micro-USD as string (e.g., "10500000")
 * @returns Formatted price string (e.g., "$10.50")
 *
 * @example
 * ```typescript
 * formatMicroUsd("10000000") // "$10.00"
 * formatMicroUsd("10500000") // "$10.50"
 * ```
 */
export function formatMicroUsd(microUsd: string): string {
	return formatPrice(microUsdToUsd(microUsd));
}

/**
 * Format a token amount with decimals and optional symbol
 *
 * @param amount - Token amount as bigint or string
 * @param decimals - Token decimals (default: 18)
 * @param symbol - Optional token symbol
 * @returns Formatted token amount
 *
 * @example
 * ```typescript
 * formatTokenAmount('1000000000000000000', 18, 'ETH') // "1.00 ETH"
 * formatTokenAmount('1500000000000000000', 18) // "1.50"
 * formatTokenAmount('1234567890', 6, 'USDC') // "1,234.57 USDC"
 * ```
 */
export function formatTokenAmount(
	amount: bigint | string,
	decimals: number = 18,
	symbol?: string,
): string {
	const bigIntAmount = typeof amount === "string" ? BigInt(amount) : amount;
	const divisor = BigInt(10 ** decimals);
	const wholePart = bigIntAmount / divisor;
	const fractionalPart = bigIntAmount % divisor;

	const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
	const truncatedFractional = fractionalStr.slice(0, 2);

	const formatted = `${formatNumber(Number(wholePart))}.${truncatedFractional}`;
	return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format a token amount with compact notation and proper decimals.
 *
 * - Zero returns `"0"`
 * - Below `minThreshold` (default 0.0001) returns `"<0.0001"`
 * - Below 1 uses `smallPrecision` decimal places (default 4)
 * - Below 1,000 uses `mediumPrecision` decimal places (default 2)
 * - 1,000+ delegates to `Intl.NumberFormat` compact notation (K, M, B, T, etc.)
 *
 * @param amount - Token amount as bigint
 * @param decimals - Token decimals (default: 0, max recommended: 18)
 * @param options - Formatting options
 * @returns Formatted token amount string
 *
 * @example
 * ```typescript
 * formatTokenAmountCompact(1500000000000000000n, 18) // "1.50"
 * formatTokenAmountCompact(5000000000000000000000n, 18) // "5K"
 * formatTokenAmountCompact(1500000000000000000000000n, 18) // "1.5M"
 * ```
 */
export function formatTokenAmountCompact(
	amount: bigint,
	decimals: number = 0,
	options: {
		minThreshold?: number;
		smallPrecision?: number;
		mediumPrecision?: number;
	} = {},
): string {
	const {
		minThreshold = 0.0001,
		smallPrecision = 4,
		mediumPrecision = 2,
	} = options;

	const divisor = BigInt(10 ** decimals);
	const wholePart = Number(amount / divisor);
	const fractionalPart = Number(amount % divisor);
	const num = wholePart + fractionalPart / Number(divisor);

	if (num === 0) return "0";
	if (num < minThreshold) return `<${minThreshold}`;
	if (num < 1) return num.toFixed(smallPrecision);
	if (num < 1000) return num.toFixed(mediumPrecision);

	return new Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(num);
}
