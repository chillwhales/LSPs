/**
 * Pagination Utilities
 *
 * Pure functions for pagination calculations.
 */

/**
 * Calculate the total number of pages for pagination
 *
 * Returns the number of pages needed to display all items with the given page size.
 * Handles edge cases: 0 items = 0 pages, partial pages rounded up.
 *
 * @param totalItems - Total number of items
 * @param itemsPerPage - Number of items per page
 * @returns Total number of pages
 * @throws {Error} If itemsPerPage is not positive
 *
 * @example
 * ```typescript
 * calculateTotalPages(100, 10) // 10 (exact pages)
 * calculateTotalPages(105, 10) // 11 (partial last page)
 * calculateTotalPages(0, 10) // 0 (no items)
 * calculateTotalPages(5, 10) // 1 (less than one page)
 * ```
 */
export function calculateTotalPages(
	totalItems: number,
	itemsPerPage: number,
): number {
	if (totalItems === 0) return 0;
	if (itemsPerPage <= 0) throw new Error("itemsPerPage must be positive");
	return Math.ceil(totalItems / itemsPerPage);
}
