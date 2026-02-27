---
phase: 03-dependency-monorepo-hygiene
plan: 01
subsystem: infra
tags: [knip, sherif, madge, only-allow, monorepo, dependency-hygiene, pnpm]

# Dependency graph
requires:
  - phase: 02-code-quality-biome-git-hooks
    provides: biome check command and simple-git-hooks infrastructure
provides:
  - knip workspace-aware unused dependency/export detection
  - sherif monorepo linting with failOnWarnings
  - madge inter-package circular dependency detection (filtered)
  - only-allow pnpm enforcement via preinstall hook
  - umbrella check command running all hygiene tools sequentially
  - deps:graph visual dependency graph generation
affects: [03-dependency-monorepo-hygiene, 05-ci-pipeline]

# Tech tracking
tech-stack:
  added: [knip@5.85.0, sherif@1.10.0, madge@8.0.0, only-allow@1.2.2]
  patterns: [inter-package-only circular dep filtering, umbrella check command chaining]

key-files:
  created: [knip.json, scripts/check-circular.mjs]
  modified: [package.json, pnpm-lock.yaml, .gitignore]

key-decisions:
  - "check renamed to check:lint, check becomes umbrella (biome → sherif → knip → madge)"
  - "Inter-package cycles only — intra-package cycles are each package's concern"
  - "deps-graph.svg gitignored — on-demand developer tool, not committed"
  - "knip config: packages/config gets includeEntryExports, library packages do not (barrel exports are public API)"

patterns-established:
  - "Umbrella check: pnpm check runs all hygiene tools in fail-fast order (fastest → slowest)"
  - "scripts/ directory for custom Node.js tooling scripts"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 3 Plan 01: Install & Configure Dependency Hygiene Tools Summary

**knip, sherif, madge, and only-allow installed with workspace-aware configs, inter-package cycle filtering script, restructured pnpm scripts with umbrella check command**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T18:43:49Z
- **Completed:** 2026-02-27T18:46:18Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed all four dependency hygiene tools (knip, sherif, madge, only-allow) as root devDependencies
- Created knip.json with workspace-aware configuration covering root, library packages (packages/*), and config package separately
- Created scripts/check-circular.mjs that runs madge and filters to inter-package cycles only (ignoring intra-package cycles)
- Restructured package.json scripts: `check` is now the umbrella command, `check:lint` is biome, dedicated scripts for each tool
- Added preinstall hook enforcing pnpm-only installs via only-allow
- Configured sherif with failOnWarnings: true for strict monorepo linting

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and restructure root package.json** - `912d4d1` (chore)
2. **Task 2: Create knip workspace configuration and madge inter-package filtering script** - `37d0900` (feat)

## Files Created/Modified
- `knip.json` - Workspace-aware knip configuration for root, packages/*, and packages/config
- `scripts/check-circular.mjs` - Node.js script filtering madge circular dep output to inter-package cycles only
- `package.json` - Restructured scripts, preinstall hook, sherif config, new devDependencies
- `pnpm-lock.yaml` - Updated lockfile with new dependencies
- `.gitignore` - Added deps-graph.svg exclusion

## Decisions Made
- Renamed `check` to `check:lint` and made `check` the umbrella command — aligns with user's vision that `pnpm check` runs everything
- Inter-package filtering in check-circular.mjs uses spawnSync (not execSync) to handle madge's non-zero exit on any cycles
- knip config: library packages don't use includeEntryExports (barrel exports are public API), but config package does (private package, unused exports should be flagged)
- Test files included as knip entry points (src/**/*.test.ts) per user decision
- deps-graph.svg gitignored — on-demand developer visualization tool, not committed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All tools installed and configured — ready for Plan 02 (run tools and fix violations)
- knip may report unused dependencies/exports that need addressing
- sherif may report monorepo consistency issues to fix
- 2 intra-package circular dependencies detected (expected — inter-package filtering working correctly)

## Self-Check: PASSED

---
*Phase: 03-dependency-monorepo-hygiene*
*Completed: 2026-02-27*
