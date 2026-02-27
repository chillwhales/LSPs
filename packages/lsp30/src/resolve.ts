/**
 * LSP30 Multi-Storage URI Resolver
 *
 * Pure functions for selecting preferred storage backends and deriving access URLs.
 * No actual fetching — that's the app layer's responsibility.
 *
 * @see LSP-30-MultiStorageURI.md for full specification
 */

import type { Lsp30Backend, Lsp30Entry } from "./types";

// ============================================================================
// Backend Selection
// ============================================================================

/**
 * Selects and orders storage entries based on preference.
 *
 * Uses exhaustive fallback: preferred entries come first, then remaining entries
 * in their original order. Output always has the same length as input — no entries
 * are ever dropped.
 *
 * @param entries - Array of storage entries to order
 * @param preference - Optional preferred backend(s). Can be:
 *   - undefined: returns entries in original order
 *   - string: single preferred backend
 *   - array: ordered list of preferred backends
 *   - empty array: treated as undefined (no preference)
 * @returns New array with all entries, preferred ones first
 *
 * @example
 * ```typescript
 * const ordered = selectBackend(entries, 'ipfs');
 * // IPFS entry first, then remaining in original order
 *
 * const ordered2 = selectBackend(entries, ['lumera', 'ipfs']);
 * // Lumera first, IPFS second, then remaining
 * ```
 */
export function selectBackend(
	entries: Lsp30Entry[],
	preference?: Lsp30Backend | Lsp30Backend[],
): Lsp30Entry[] {
	// No preference or empty array → return copy in original order
	if (!preference || (Array.isArray(preference) && preference.length === 0)) {
		return [...entries];
	}

	// Normalize to array
	const prefs = typeof preference === "string" ? [preference] : preference;

	// Track which entries have been placed by their index
	const placed = new Set<number>();
	const result: Lsp30Entry[] = [];

	// Add entries in preference order
	for (const pref of prefs) {
		for (let i = 0; i < entries.length; i++) {
			if (!placed.has(i) && entries[i].backend === pref) {
				result.push(entries[i]);
				placed.add(i);
			}
		}
	}

	// Append remaining entries in original order
	for (let i = 0; i < entries.length; i++) {
		if (!placed.has(i)) {
			result.push(entries[i]);
		}
	}

	return result;
}

// ============================================================================
// URL Resolution
// ============================================================================

/**
 * Derives an access URL from a storage backend entry.
 *
 * Returns protocol URLs for IPFS and Lumera (actual gateway resolution is app-layer),
 * and direct HTTPS URLs for S3 and Arweave.
 *
 * @param entry - A single storage entry
 * @returns The derived access URL
 *
 * @example
 * ```typescript
 * const url = resolveUrl({ backend: 'ipfs', cid: 'QmTest...' });
 * // 'ipfs://QmTest...'
 *
 * const url2 = resolveUrl({ backend: 's3', bucket: 'b', key: 'k', region: 'r' });
 * // 'https://b.s3.r.amazonaws.com/k'
 * ```
 */
export function resolveUrl(entry: Lsp30Entry): string {
	switch (entry.backend) {
		case "ipfs":
			return `ipfs://${entry.cid}`;
		case "s3":
			return `https://${entry.bucket}.s3.${entry.region}.amazonaws.com/${encodeURIComponent(entry.key)}`;
		case "lumera":
			return `lumera://${entry.actionId}`;
		case "arweave":
			return `https://arweave.net/${entry.transactionId}`;
		default: {
			// Exhaustive check — TypeScript will error if a backend is added without handling
			const _exhaustive: never = entry;
			throw new Error(
				`Unknown backend: ${(_exhaustive as Lsp30Entry).backend}`,
			);
		}
	}
}
