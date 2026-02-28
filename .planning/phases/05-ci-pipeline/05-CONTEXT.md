# Phase 5: CI Pipeline - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Every pull request is automatically validated — typecheck, lint, format, build, publish-readiness, test, and coverage — via GitHub Actions with no manual intervention. In-progress runs are cancelled on new pushes. Coverage is reported to Codecov.

</domain>

<decisions>
## Implementation Decisions

### Node version strategy
- Test matrix: Node 22 + Node 24
- Matrix applies to test jobs only — lint, typecheck, build, and validation run once on Node 24
- Update root `engines` field from `>=18` to `>=22` to reflect what's actually tested
- Pipeline triggers: PRs + push to main (not nightly)

### Pipeline structure
- Parallel jobs optimized for repo growth, not minimal config
- **Layer 1 — Install:** Single install job, cache pnpm store for downstream jobs
- **Layer 2 — Validate + Build (6 parallel jobs):**
  - Typecheck (tsc)
  - Lint/Format (biome)
  - Sherif (monorepo consistency)
  - Knip (unused deps/exports)
  - Madge (circular dependencies)
  - Build (unbuild)
- **Layer 3 — Verify + Test (3 parallel jobs, depend on Build):**
  - Pkg Verify (publint + attw)
  - Test + Coverage on Node 22
  - Test + Coverage on Node 24
- **Layer 4 — Report (depends on Tests):**
  - Codecov upload
- Each hygiene tool (sherif, knip, madge) gets its own job — not bundled

### Check strictness
- All checks are required to pass for merge — no advisory-only checks
- publint/attw failures block merge
- Coverage threshold violations block merge
- Concurrency: cancel in-progress runs when new commits are pushed (CI-02)

### Coverage reporting
- Codecov status check + PR comment (both)
- Upload coverage from Node 24 only (not both versions)
- Enforce patch coverage at 80% (new/changed lines must be tested)
- `codecov.yml` config file in repo root (version-controlled, not web UI)

### Claude's Discretion
- GitHub Actions caching strategy details (pnpm store, build artifacts between jobs)
- Exact artifact passing mechanism between Install → Layer 2 → Layer 3
- Codecov PR comment format/verbosity settings
- Whether hygiene tools need build artifacts or can run from install cache alone
- Workflow file organization (single file vs split)

</decisions>

<specifics>
## Specific Ideas

- Pipeline designed for growth — each tool isolated so slow tools don't block fast ones as the repo scales
- Coverage uploaded from single version (Node 24) for one clean authoritative report

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-ci-pipeline*
*Context gathered: 2026-02-28*
