import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["packages/*", "!packages/config"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary", "json"],
			reportsDirectory: "./coverage",
			include: ["packages/*/src/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"**/*.d.ts",
				"**/index.ts",
				"packages/config/**",
			],
			thresholds: {
				lines: 80,
				branches: 80,
				functions: 80,
				statements: 80,
			},
		},
	},
});
