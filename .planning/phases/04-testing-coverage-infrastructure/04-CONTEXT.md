# Phase 4: Testing & Coverage Infrastructure - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Test coverage is measured across all packages with enforced minimum thresholds. Running `pnpm test --coverage` produces per-package coverage reports. Packages that fall below the configured threshold cause a non-zero exit. Coverage output is CI-consumable for later Codecov integration (Phase 5). This phase sets up infrastructure and fixes existing test failures — it does NOT include writing new tests to achieve coverage targets.

</domain>

<decisions>
## Implementation Decisions

### Threshold strategy
- 80% threshold across all four metrics: lines, branches, functions, statements
- Uniform threshold for all 8 packages — no per-package exceptions
- Hard fail: `pnpm test --coverage` exits non-zero if any package drops below 80%
- No temporary lower thresholds — packages that can't meet 80% today will fail until tests are written

### Existing test debt
- Fix the 10 known test failures in @chillwhales/lsp29 (Zod schema: images field required but missing in fixtures)
- Fix underlying bugs first, then fix test fixtures — bugs always take priority over test fixes
- This phase is infrastructure only — no new tests are written to meet coverage targets
- After setup, run coverage once and capture baseline numbers as terminal output (not committed)

### Coverage output & developer experience
- Three report formats generated simultaneously: text (terminal), lcov (CI/Codecov), HTML (local browsing)
- Coverage output lives in `coverage/` at the repo root, gitignored
- Two ways to run: `pnpm test --coverage` (flag) and `pnpm test:coverage` (dedicated script in root package.json)
- Single-package coverage supported via `pnpm test:coverage --filter=<package>` — must be documented so developers know about it

### Claude's Discretion
- Vitest coverage configuration details (provider options, reporter config)
- How single-package filtering is wired (vitest project filter vs pnpm workspace filter)
- HTML report styling/options
- Exact lcov output path within `coverage/`

</decisions>

<specifics>
## Specific Ideas

- Coverage enforcement should feel like the build: it either passes or it doesn't, no ambiguity
- The lsp29 fixture fix should investigate whether the bug is in the schema or the fixtures — fix the actual bug, not just silence the test

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-testing-coverage-infrastructure*
*Context gathered: 2026-02-27*
