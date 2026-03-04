/**
 * Link Transformation Utilities
 *
 * Pure functions for transforming and parsing link data.
 * Framework-agnostic — no React components or JSX.
 */

/**
 * Supported social media platforms
 */
export type SocialPlatform =
	| "x"
	| "twitter"
	| "discord"
	| "facebook"
	| "instagram"
	| "youtube"
	| "twitch"
	| "github"
	| "gitlab";

/**
 * Link with metadata
 */
export interface ParsedLink {
	url: string;
	title: string;
	hostname: string;
	platform?: SocialPlatform;
}

/**
 * Raw link input
 */
export interface RawLink {
	url: string;
	title: string | null | undefined;
}

/**
 * Maps hostnames to social platform identifiers
 */
const HOSTNAME_TO_PLATFORM: Record<string, SocialPlatform> = {
	"x.com": "x",
	"twitter.com": "twitter",
	"discord.com": "discord",
	"facebook.com": "facebook",
	"instagram.com": "instagram",
	"youtube.com": "youtube",
	"twitch.tv": "twitch",
	"github.com": "github",
	"gitlab.com": "gitlab",
} as const;

/**
 * Extracts hostname from URL string
 *
 * @param urlString - URL to parse
 * @returns Hostname without 'www.' prefix
 *
 * @example
 * ```typescript
 * getHostname('https://www.github.com/user');
 * // "github.com"
 * ```
 */
export function getHostname(urlString: string): string {
	try {
		const url = new URL(urlString);
		const hostname = url.hostname;

		// Remove 'www.' prefix if present
		return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
	} catch {
		return "";
	}
}

/**
 * Identifies social platform from hostname
 *
 * @param hostname - Hostname to check
 * @returns Social platform identifier or undefined
 *
 * @example
 * ```typescript
 * getSocialPlatform('github.com');
 * // "github"
 *
 * getSocialPlatform('example.com');
 * // undefined
 * ```
 */
export function getSocialPlatform(
	hostname: string,
): SocialPlatform | undefined {
	return HOSTNAME_TO_PLATFORM[hostname];
}

/**
 * Checks if URL is from a known social platform
 *
 * @param urlString - URL to check
 * @returns True if URL is from a known social platform
 *
 * @example
 * ```typescript
 * isSocialPlatformUrl('https://twitter.com/user');
 * // true
 *
 * isSocialPlatformUrl('https://example.com');
 * // false
 * ```
 */
export function isSocialPlatformUrl(urlString: string): boolean {
	const hostname = getHostname(urlString);
	return hostname in HOSTNAME_TO_PLATFORM;
}

/**
 * Parses raw link data into structured format
 *
 * @param link - Raw link with url and optional title
 * @returns Parsed link with metadata, or null if URL is invalid
 *
 * @example
 * ```typescript
 * parseLink({ url: 'https://github.com/user', title: 'My GitHub' });
 * // {
 * //   url: 'https://github.com/user',
 * //   title: 'My GitHub',
 * //   hostname: 'github.com',
 * //   platform: 'github'
 * // }
 * ```
 */
export function parseLink(link: RawLink): ParsedLink | null {
	if (!link.url) {
		return null;
	}

	const hostname = getHostname(link.url);
	if (!hostname) {
		return null;
	}

	const platform = getSocialPlatform(hostname);

	return {
		url: link.url,
		title: link.title || link.url,
		hostname,
		platform,
	};
}

/**
 * Parses multiple links and filters out invalid ones
 *
 * @param links - Array of raw links
 * @returns Array of parsed links (invalid links are excluded)
 *
 * @example
 * ```typescript
 * parseLinks([
 *   { url: 'https://github.com/user', title: 'GitHub' },
 *   { url: 'invalid', title: 'Bad Link' },
 * ]);
 * // [{ url: 'https://github.com/user', title: 'GitHub', hostname: 'github.com', platform: 'github' }]
 * ```
 */
export function parseLinks(links: RawLink[]): ParsedLink[] {
	return links
		.map(parseLink)
		.filter((link): link is ParsedLink => link !== null);
}

/**
 * Sorts links with social platforms first, then alphabetically
 *
 * @param links - Array of parsed links
 * @returns Sorted array (social platforms first, then by title)
 *
 * @example
 * ```typescript
 * sortLinks([
 *   { url: 'https://example.com', title: 'Website', hostname: 'example.com' },
 *   { url: 'https://github.com/user', title: 'GitHub', hostname: 'github.com', platform: 'github' },
 * ]);
 * // Social platforms first, then by title
 * ```
 */
export function sortLinks(links: ParsedLink[]): ParsedLink[] {
	return [...links].sort((a, b) => {
		const aIsSocial = !!a.platform;
		const bIsSocial = !!b.platform;

		// Social platforms first
		if (aIsSocial && !bIsSocial) return -1;
		if (!aIsSocial && bIsSocial) return 1;

		// Among social platforms, sort by URL
		if (aIsSocial && bIsSocial) {
			return a.url.localeCompare(b.url);
		}

		// Among non-social links, sort by title
		return a.title.localeCompare(b.title);
	});
}

/**
 * Parses and sorts links in one operation
 *
 * @param links - Array of raw links
 * @returns Sorted array of parsed links
 *
 * @example
 * ```typescript
 * parseAndSortLinks([
 *   { url: 'https://example.com', title: 'Website' },
 *   { url: 'https://twitter.com/user', title: null },
 * ]);
 * // Social platforms first, invalid links excluded
 * ```
 */
export function parseAndSortLinks(links: RawLink[]): ParsedLink[] {
	const parsed = parseLinks(links);
	return sortLinks(parsed);
}
