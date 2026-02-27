import { defineProject } from "vitest/config";

interface VitestConfigOverrides {
	globals?: boolean;
	environment?: string;
	[key: string]: unknown;
}

export function createVitestConfig(overrides: VitestConfigOverrides = {}) {
	return defineProject({
		test: {
			globals: true,
			environment: "node",
			...overrides,
		},
	});
}
