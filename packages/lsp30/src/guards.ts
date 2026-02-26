/**
 * LSP30 Multi-Storage URI Type Guards
 *
 * Quick structural checks for identifying LSP30 encoded values.
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

import { type Hex, slice } from 'viem';

import { LSP30_RESERVED_PREFIX, MIN_LSP30_URI_LENGTH } from './constants';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a hex value appears to be a valid LSP30 Multi-Storage URI format.
 *
 * This is a quick structural check based on length and prefix, not full content validation.
 * Distinguishes LSP30 (0x0030 prefix) from LSP2 VerifiableURI (0x0000 prefix).
 *
 * @param value - Hex value to check
 * @returns true if the value has valid LSP30 structure
 *
 * @example
 * ```typescript
 * if (isLsp30Uri(rawValue)) {
 *   const { entries } = parseLsp30Uri(rawValue);
 * } else if (isVerifiableUri(rawValue)) {
 *   const { url } = parseVerifiableUri(rawValue);
 * }
 * ```
 */
export function isLsp30Uri(value: Hex): boolean {
  if (value.length < MIN_LSP30_URI_LENGTH) {
    return false;
  }

  try {
    const reservedPrefix = slice(value, 0, 2);
    return reservedPrefix === LSP30_RESERVED_PREFIX;
  } catch {
    return false;
  }
}
