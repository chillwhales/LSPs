/**
 * IPFS Utility Functions
 *
 * Pure functions for working with IPFS URLs and CIDs.
 *
 * Note: `computeCidFromString` is available in the chillwhales/marketplace package
 * but omitted here to keep @chillwhales/utils lightweight (avoids `ipfs-only-hash` dependency).
 */

/**
 * Extracts the CID from an IPFS URL
 *
 * @param url - IPFS URL (ipfs://Qm... or gateway URL)
 * @returns CID string
 * @throws Error if URL is a data URI
 *
 * @example
 * ```typescript
 * extractCidFromIpfsUrl('ipfs://QmXyz...') // 'QmXyz...'
 * extractCidFromIpfsUrl('https://gateway.ipfs.io/ipfs/QmXyz...') // 'QmXyz...'
 * ```
 */
export function extractCidFromIpfsUrl(url: string): string {
	if (url.startsWith("ipfs://")) {
		return url.replace("ipfs://", "");
	}

	const ipfsMatch = url.match(/\/ipfs\/([^/?#]+)/);
	if (ipfsMatch) {
		return ipfsMatch[1];
	}

	if (url.startsWith("data:")) {
		throw new Error("Data URIs cannot be fetched from IPFS");
	}

	return url;
}

/**
 * Parses an IPFS URL to a gateway URL
 *
 * @param urlString - IPFS URL (ipfs://Qm...)
 * @param gateway - IPFS gateway URL (e.g., 'https://api.universalprofile.cloud/ipfs/')
 * @returns Gateway URL for fetching content
 *
 * @example
 * ```typescript
 * parseIpfsUrl('ipfs://QmXyz...', 'https://api.universalprofile.cloud/ipfs/')
 * // 'https://api.universalprofile.cloud/ipfs/QmXyz...'
 * ```
 */
export function parseIpfsUrl(
	urlString: string,
	gateway: string | (() => string),
): string {
	const url = new URL(urlString);

	if (url.protocol === "ipfs:") {
		return urlString.replace(
			"ipfs://",
			typeof gateway === "string" ? gateway : gateway(),
		);
	}

	return urlString;
}

/**
 * Checks if a URL is an IPFS URL
 *
 * @param url - URL to check
 * @returns true if IPFS URL
 *
 * @example
 * ```typescript
 * isIpfsUrl('ipfs://QmXyz...') // true
 * isIpfsUrl('https://gateway.ipfs.io/ipfs/QmXyz...') // true
 * isIpfsUrl('https://example.com') // false
 * ```
 */
export function isIpfsUrl(url: string): boolean {
	return url.startsWith("ipfs://") || url.includes("/ipfs/");
}

/**
 * Creates an IPFS URL from a CID
 *
 * @param cid - IPFS CID
 * @returns IPFS URL (ipfs://{cid})
 *
 * @example
 * ```typescript
 * cidToIpfsUrl('QmXyz...') // 'ipfs://QmXyz...'
 * ```
 */
export function cidToIpfsUrl(cid: string): string {
	return `ipfs://${cid}`;
}

/**
 * Creates a gateway URL from a CID
 *
 * @param cid - IPFS CID
 * @param gateway - IPFS gateway URL (e.g., 'https://api.universalprofile.cloud/ipfs/')
 * @returns Gateway URL
 *
 * @example
 * ```typescript
 * cidToGatewayUrl('QmXyz...', 'https://api.universalprofile.cloud/ipfs/')
 * // 'https://api.universalprofile.cloud/ipfs/QmXyz...'
 * ```
 */
export function cidToGatewayUrl(cid: string, gateway: string): string {
	return `${gateway}${cid}`;
}
