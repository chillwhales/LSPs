import type { BuildConfig } from "unbuild";
import { defineBuildConfig } from "unbuild";

type BuildConfigOverrides = Partial<Omit<BuildConfig, "preset" | "hooks">>;

export function createBuildConfig(
	overrides: BuildConfigOverrides = {},
): BuildConfig[] {
	return defineBuildConfig({
		entries: ["src/index"],
		declaration: "compatible",
		clean: true,
		failOnWarn: true,
		...overrides,
	});
}
