/**
 * File Utilities
 *
 * Pure functions for working with file sizes and metadata.
 */

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "256 KB")
 *
 * @example
 * ```typescript
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1536000) // "1.5 MB"
 * formatFileSize(1073741824) // "1 GB"
 * ```
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";

	const units = ["B", "KB", "MB", "GB", "TB"];
	const k = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	const size = bytes / k ** i;
	const formatted = size % 1 === 0 ? size.toString() : size.toFixed(1);

	return `${formatted} ${units[i]}`;
}
