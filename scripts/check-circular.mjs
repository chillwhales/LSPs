import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Inter-package circular dependency checker.
 *
 * Runs madge with --circular --json and filters results to only report
 * cycles that span multiple packages (inter-package). Intra-package
 * cycles (all files within the same package) are ignored — those are
 * an internal concern for each package maintainer.
 */

const result = spawnSync(
	"npx",
	[
		"madge",
		"--circular",
		"--json",
		"--extensions",
		"ts",
		"--ts-config",
		"./packages/utils/tsconfig.json",
		"--exclude",
		"\\.test\\.ts$",
		"packages/*/src",
	],
	{
		cwd: resolve(import.meta.dirname, ".."),
		shell: true,
		encoding: "utf-8",
		timeout: 60_000,
	},
);

// madge --json outputs an array of cycle arrays to stdout
// It exits non-zero when ANY circular deps are found (even intra-package)
let cycles;
try {
	cycles = JSON.parse(result.stdout || "[]");
} catch {
	console.error("Failed to parse madge output:");
	console.error(result.stdout);
	console.error(result.stderr);
	process.exit(1);
}

/**
 * Extract the package name from a file path.
 * Pattern: packages/{name}/src/... → {name}
 */
function getPackageName(filePath) {
	const match = filePath.match(/^packages\/([^/]+)\//);
	return match ? match[1] : null;
}

// Filter to inter-package cycles only
const interPackageCycles = cycles.filter((cycle) => {
	const packages = new Set(cycle.map(getPackageName).filter(Boolean));
	return packages.size > 1;
});

if (interPackageCycles.length > 0) {
	console.error(
		`\n✖ Found ${interPackageCycles.length} inter-package circular dependenc${interPackageCycles.length === 1 ? "y" : "ies"}:\n`,
	);
	for (const cycle of interPackageCycles) {
		console.error(`  ${cycle.join(" → ")} → ${cycle[0]}`);
	}
	console.error();
	process.exit(1);
} else {
	const intraCount = cycles.length;
	if (intraCount > 0) {
		console.log(
			`✔ No inter-package circular dependencies (${intraCount} intra-package cycle${intraCount === 1 ? "" : "s"} ignored)`,
		);
	} else {
		console.log("✔ No circular dependencies found");
	}
	process.exit(0);
}
