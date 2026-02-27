# Phase 3: Dependency & Monorepo Hygiene - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Structural problems — circular dependencies, unused code, inconsistent package metadata, and wrong package managers — are caught automatically. This phase sets up knip, sherif, madge, and pnpm enforcement so violations are detected and reported. All existing violations are fixed before tools are committed.

</domain>

<decisions>
## Implementation Decisions

### Existing violations strategy
- Fix all existing violations before merging — clean slate from day one
- Strict zero-tolerance going forward — every tool exits non-zero on any finding
- For code-level findings, exceptions use inline ignore comments (not central config)
- Tool-level configuration exceptions (e.g., knip `ignoreDependencies` for non-importable/script-only deps like `simple-git-hooks`, or sherif ignores for well-understood false positives) are allowed but must be narrowly scoped and documented in the config
- Every ignore (inline or config) must include a reason explaining why the exception exists

### knip configuration
- Package entry points (main export files) mark public API as "used" — knip won't flag intentional public API without internal consumers
- Full scope detection: unused dependencies, devDependencies, exports, files, and types
- Test files (*.test.ts, *.spec.ts, test helpers) configured as separate entry points — test-only utilities are considered "used"
- Config checks enabled — knip validates tsconfig references, tooling configuration alongside code

### Workflow integration
- Dedicated pnpm scripts for each tool: `pnpm knip`, `pnpm sherif`, etc.
- Combined `pnpm check` umbrella script that runs all hygiene tools together
- No pre-commit hooks — these tools run via CI and manual invocation only (pre-commit stays fast with Biome only)
- pnpm enforcement via standard `"preinstall": "npx only-allow pnpm"` in root package.json

### Circular dependency detection
- madge for circular dependency detection
- Inter-package cycles only — ignore intra-package circular imports
- Full cycle path in output (exact file-level import chain, not just package names)
- On-demand visual dependency graph via `pnpm deps:graph` script (not committed or CI-generated)

### Claude's Discretion
- Exact knip entry point glob patterns
- sherif rule selection and strictness configuration
- madge CLI flags and TypeScript config
- Script naming beyond the ones specified above
- Whether `pnpm check` runs tools in parallel or sequential

</decisions>

<specifics>
## Specific Ideas

- Zero-tolerance enforcement matches existing repo patterns: `failOnWarn: true` in builds, Biome blocking commits via pre-commit
- `pnpm check` should be the single "is my repo clean?" command developers run before pushing
- Visual dependency graph is a developer convenience tool, not a CI artifact

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-dependency-monorepo-hygiene*
*Context gathered: 2026-02-27*
