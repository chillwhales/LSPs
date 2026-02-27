import { defineBuildConfig } from "unbuild";
import type { BuildConfig } from "unbuild";

type BuildConfigOverrides = Partial<Omit<BuildConfig, "preset" | "hooks">>;

export function createBuildConfig(overrides: BuildConfigOverrides = {}): BuildConfig[] {
  return defineBuildConfig({
    entries: ["src/index"],
    declaration: "compatible",
    clean: true,
    failOnWarn: true,
    rollup: {
      emitCJS: true,
    },
    ...overrides,
  });
}
