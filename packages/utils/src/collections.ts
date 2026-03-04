/**
 * Collection Utilities
 *
 * Pure functions for working with arrays and objects.
 * Used for data transformation, grouping, and filtering operations.
 */

/**
 * Group an array of objects by a key
 *
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with grouped arrays
 *
 * @example
 * ```typescript
 * const users = [
 *   { name: 'Alice', role: 'admin' },
 *   { name: 'Bob', role: 'user' },
 *   { name: 'Charlie', role: 'admin' }
 * ];
 * groupBy(users, 'role');
 * // {
 * //   admin: [{ name: 'Alice', role: 'admin' }, { name: 'Charlie', role: 'admin' }],
 * //   user: [{ name: 'Bob', role: 'user' }]
 * // }
 * ```
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
	return array.reduce(
		(result, item) => {
			const groupKey = String(item[key]);
			if (!result[groupKey]) {
				result[groupKey] = [];
			}
			result[groupKey].push(item);
			return result;
		},
		{} as Record<string, T[]>,
	);
}

/**
 * Remove duplicates from an array by a specific key
 *
 * @param array - Array to deduplicate
 * @param key - Key to check for uniqueness
 * @returns Array with unique items
 *
 * @example
 * ```typescript
 * const items = [
 *   { id: 1, name: 'A' },
 *   { id: 2, name: 'B' },
 *   { id: 1, name: 'C' }
 * ];
 * uniqueBy(items, 'id');
 * // [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
 * ```
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
	const seen = new Set();
	return array.filter((item) => {
		const value = item[key];
		if (seen.has(value)) return false;
		seen.add(value);
		return true;
	});
}

/**
 * Sort an array of objects by a key
 *
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 *
 * @example
 * ```typescript
 * const items = [
 *   { name: 'Charlie', age: 25 },
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 20 }
 * ];
 * sortBy(items, 'age'); // Sorted by age ascending
 * sortBy(items, 'name', 'desc'); // Sorted by name descending
 * ```
 */
export function sortBy<T>(
	array: T[],
	key: keyof T,
	order: "asc" | "desc" = "asc",
): T[] {
	return [...array].sort((a, b) => {
		const aVal = a[key];
		const bVal = b[key];

		if (aVal < bVal) return order === "asc" ? -1 : 1;
		if (aVal > bVal) return order === "asc" ? 1 : -1;
		return 0;
	});
}

/**
 * Filter out falsy values from an array
 *
 * @param array - Array to filter
 * @returns Array with truthy values only
 *
 * @example
 * ```typescript
 * filterTruthy([0, 1, '', 'hello', null, undefined, false, true])
 * // [1, 'hello', true]
 * ```
 */
export function filterTruthy<T>(
	array: (T | null | undefined | false | "" | 0)[],
): T[] {
	return array.filter(Boolean) as T[];
}

/**
 * Split an array into chunks of a specific size
 *
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 *
 * @example
 * ```typescript
 * chunk([1, 2, 3, 4, 5], 2)
 * // [[1, 2], [3, 4], [5]]
 *
 * chunk(['a', 'b', 'c', 'd'], 3)
 * // [['a', 'b', 'c'], ['d']]
 * ```
 */
export function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Extract values of a specific key from an array of objects
 *
 * @param array - Array of objects
 * @param key - Key to extract
 * @returns Array of extracted values
 *
 * @example
 * ```typescript
 * const users = [
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 25 }
 * ];
 * pluck(users, 'name')
 * // ['Alice', 'Bob']
 * ```
 */
export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
	return array.map((item) => item[key]);
}

/**
 * Count occurrences of values in an array
 *
 * @param array - Array to count
 * @returns Object with value counts
 *
 * @example
 * ```typescript
 * countBy(['a', 'b', 'a', 'c', 'b', 'a'])
 * // { a: 3, b: 2, c: 1 }
 * ```
 */
export function countBy<T extends string | number>(
	array: T[],
): Record<T, number> {
	return array.reduce(
		(counts, item) => {
			counts[item] = (counts[item] || 0) + 1;
			return counts;
		},
		{} as Record<T, number>,
	);
}

/**
 * Flatten a nested array by one level
 *
 * @param array - Nested array to flatten
 * @returns Flattened array
 *
 * @example
 * ```typescript
 * flatten([[1, 2], [3, 4], [5]])
 * // [1, 2, 3, 4, 5]
 * ```
 */
export function flatten<T>(array: T[][]): T[] {
	return array.flat();
}

/**
 * Represents an array that may contain T or deeper nested arrays of the same shape
 */
export type NestedArray<T> = Array<T | NestedArray<T>>;

/**
 * Deeply flatten a nested array
 *
 * @param array - Nested array to flatten
 * @returns Flattened array
 *
 * @example
 * ```typescript
 * flattenDeep([[1, [2]], [3, [4, [5]]]])
 * // [1, 2, 3, 4, 5]
 * ```
 */
export function flattenDeep<T>(array: NestedArray<T>): T[] {
	return array.reduce<T[]>((acc, item) => {
		if (Array.isArray(item)) {
			return acc.concat(flattenDeep(item));
		}
		return acc.concat(item);
	}, []);
}

/**
 * Get the intersection of two arrays
 *
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Array of common elements
 *
 * @example
 * ```typescript
 * intersection([1, 2, 3], [2, 3, 4])
 * // [2, 3]
 * ```
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
	const set2 = new Set(array2);
	return array1.filter((item) => set2.has(item));
}

/**
 * Get the difference between two arrays (items in first but not in second)
 *
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Array of different elements
 *
 * @example
 * ```typescript
 * difference([1, 2, 3], [2, 3, 4])
 * // [1]
 * ```
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
	const set2 = new Set(array2);
	return array1.filter((item) => !set2.has(item));
}

/**
 * Check if two arrays have any common elements
 *
 * @param array1 - First array
 * @param array2 - Second array
 * @returns true if arrays have common elements
 *
 * @example
 * ```typescript
 * hasIntersection([1, 2, 3], [3, 4, 5]) // true
 * hasIntersection([1, 2], [3, 4]) // false
 * ```
 */
export function hasIntersection<T>(array1: T[], array2: T[]): boolean {
	const set2 = new Set(array2);
	return array1.some((item) => set2.has(item));
}

/**
 * Partition an array into two arrays based on a predicate
 *
 * @param array - Array to partition
 * @param predicate - Function to test each element
 * @returns Tuple of [matching, notMatching] arrays
 *
 * @example
 * ```typescript
 * partition([1, 2, 3, 4, 5], x => x % 2 === 0)
 * // [[2, 4], [1, 3, 5]]
 * ```
 */
export function partition<T>(
	array: T[],
	predicate: (item: T) => boolean,
): [T[], T[]] {
	const matching: T[] = [];
	const notMatching: T[] = [];

	for (const item of array) {
		if (predicate(item)) {
			matching.push(item);
		} else {
			notMatching.push(item);
		}
	}

	return [matching, notMatching];
}

/**
 * Shuffle an array randomly
 *
 * Uses Fisher-Yates shuffle algorithm.
 *
 * @param array - Array to shuffle
 * @returns New shuffled array
 *
 * @example
 * ```typescript
 * shuffle([1, 2, 3, 4, 5])
 * // [3, 1, 5, 2, 4] (random order)
 * ```
 */
export function shuffle<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/**
 * Get a random sample from an array
 *
 * @param array - Array to sample from
 * @param size - Number of items to sample
 * @returns Array of sampled items
 *
 * @example
 * ```typescript
 * sample([1, 2, 3, 4, 5], 2)
 * // [3, 1] (random selection)
 * ```
 */
export function sample<T>(array: T[], size: number): T[] {
	const shuffled = shuffle(array);
	return shuffled.slice(0, size);
}
