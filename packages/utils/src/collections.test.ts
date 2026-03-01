/**
 * Collection Utility Tests
 */

import { describe, expect, it } from "vitest";
import {
	chunk,
	countBy,
	difference,
	filterTruthy,
	flatten,
	flattenDeep,
	groupBy,
	hasIntersection,
	intersection,
	partition,
	pluck,
	sample,
	shuffle,
	sortBy,
	uniqueBy,
} from "./collections";

describe("groupBy", () => {
	it("should group by key", () => {
		const items = [
			{ name: "Alice", role: "admin" },
			{ name: "Bob", role: "user" },
			{ name: "Charlie", role: "admin" },
		];
		const result = groupBy(items, "role");
		expect(result.admin).toHaveLength(2);
		expect(result.user).toHaveLength(1);
	});
});

describe("uniqueBy", () => {
	it("should remove duplicates by key", () => {
		const items = [
			{ id: 1, name: "A" },
			{ id: 2, name: "B" },
			{ id: 1, name: "C" },
		];
		const result = uniqueBy(items, "id");
		expect(result).toHaveLength(2);
		expect(result[0].name).toBe("A");
	});
});

describe("sortBy", () => {
	it("should sort ascending by default", () => {
		const items = [
			{ name: "C", age: 30 },
			{ name: "A", age: 20 },
			{ name: "B", age: 25 },
		];
		const result = sortBy(items, "age");
		expect(result[0].name).toBe("A");
		expect(result[2].name).toBe("C");
	});

	it("should sort descending", () => {
		const items = [
			{ name: "A", age: 20 },
			{ name: "B", age: 25 },
		];
		const result = sortBy(items, "age", "desc");
		expect(result[0].name).toBe("B");
	});

	it("should not mutate original", () => {
		const items = [
			{ name: "B", age: 2 },
			{ name: "A", age: 1 },
		];
		const original = [...items];
		sortBy(items, "age");
		expect(items).toEqual(original);
	});
});

describe("filterTruthy", () => {
	it("should remove falsy values", () => {
		const result = filterTruthy([
			0,
			1,
			"",
			"hello",
			null,
			undefined,
			false,
			true,
		]);
		expect(result).toEqual([1, "hello", true]);
	});
});

describe("chunk", () => {
	it("should split into chunks", () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it("should handle array smaller than chunk size", () => {
		expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
	});
});

describe("pluck", () => {
	it("should extract values by key", () => {
		const items = [
			{ name: "Alice", age: 30 },
			{ name: "Bob", age: 25 },
		];
		expect(pluck(items, "name")).toEqual(["Alice", "Bob"]);
	});
});

describe("countBy", () => {
	it("should count occurrences", () => {
		const result = countBy(["a", "b", "a", "c", "b", "a"]);
		expect(result.a).toBe(3);
		expect(result.b).toBe(2);
		expect(result.c).toBe(1);
	});
});

describe("flatten", () => {
	it("should flatten one level", () => {
		expect(flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
	});
});

describe("flattenDeep", () => {
	it("should deeply flatten nested arrays", () => {
		expect(
			flattenDeep([
				[1, [2]],
				[3, [4, [5]]],
			]),
		).toEqual([1, 2, 3, 4, 5]);
	});
});

describe("intersection", () => {
	it("should find common elements", () => {
		expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
	});

	it("should return empty for no common elements", () => {
		expect(intersection([1, 2], [3, 4])).toEqual([]);
	});
});

describe("difference", () => {
	it("should find elements in first but not second", () => {
		expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
	});
});

describe("hasIntersection", () => {
	it("should return true for common elements", () => {
		expect(hasIntersection([1, 2, 3], [3, 4, 5])).toBe(true);
	});

	it("should return false for no common elements", () => {
		expect(hasIntersection([1, 2], [3, 4])).toBe(false);
	});
});

describe("partition", () => {
	it("should split by predicate", () => {
		const [even, odd] = partition([1, 2, 3, 4, 5], (x) => x % 2 === 0);
		expect(even).toEqual([2, 4]);
		expect(odd).toEqual([1, 3, 5]);
	});
});

describe("shuffle", () => {
	it("should return array of same length", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = shuffle(arr);
		expect(result).toHaveLength(5);
		expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it("should not mutate original", () => {
		const arr = [1, 2, 3, 4, 5];
		const original = [...arr];
		shuffle(arr);
		expect(arr).toEqual(original);
	});
});

describe("sample", () => {
	it("should return correct number of items", () => {
		const result = sample([1, 2, 3, 4, 5], 3);
		expect(result).toHaveLength(3);
	});

	it("should return items from original array", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = sample(arr, 2);
		for (const item of result) {
			expect(arr).toContain(item);
		}
	});
});
