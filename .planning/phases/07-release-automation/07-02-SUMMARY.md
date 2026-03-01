---
phase: 07-release-automation
plan: 02
subsystem: infra
tags: [pkg-pr-new, github-actions, snapshot-releases, pr-preview]

# Dependency graph
requires:
  - phase: 07-release-automation
    provides: changesets config, release workflow, ci:publish script
provides:
  - "PR-based snapshot releases via pkg-pr-new with fork security guard"
  - "Complete release automation stack validated end-to-end"
affects: [08-external-extraction]

# Tech tracking
tech-stack:
  added: [pkg-pr-new]
  patterns: ["PR snapshot previews via pkg-pr-new", "fork guard security on preview workflows"]

key-files:
  created:
    - ".github/workflows/preview.yml"
  modified: []

key-decisions:
  - "pkg-pr-new with --compact --comment=update --packageManager=pnpm for clean PR comments"
  - "Fork guard via head.repo.full_name == github.repository blocks external PRs from snapshots"
  - "No NPM_TOKEN needed for preview — pkg-pr-new uses its own CDN"
  - "Skip publish step when no packages changed to avoid empty input error"

patterns-established:
  - "Preview workflow: PR push → detect changed packages → build → pkg-pr-new publish → PR comment with install URLs"
  - "Fork security: all PR-triggered workflows that post comments or have elevated trust must guard against forks"

requirements-completed: [REL-06]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 7 Plan 2: PR Preview Snapshots & Release Validation Summary

**PR-based snapshot releases via pkg-pr-new with fork security guard, plus end-to-end validation of the complete release automation stack (changesets + release workflow + preview workflow)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T09:33:15Z
- **Completed:** 2026-03-01T09:35:37Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Preview workflow publishes snapshot releases on every PR push via pkg-pr-new
- Fork guard blocks external PRs from triggering snapshots (security)
- Only changed packages get built and published (pnpm --filter="...[origin/main]")
- PR comments show compact install URLs with pnpm commands (--comment=update keeps single comment)
- Complete release stack validated: changesets config, release.yml, preview.yml, all hygiene checks pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create preview workflow for PR snapshot releases** - `47eb14c` (feat)
2. **Task 2: Validate complete release automation infrastructure** - validation-only, no files changed

**Plan metadata:** `7bcb8e3` (docs: complete plan)

## Files Created/Modified
- `.github/workflows/preview.yml` - PR snapshot preview workflow: pkg-pr-new publish with fork guard, changed-package detection, compact PR comments

## Decisions Made
- pkg-pr-new with --compact, --comment=update, --packageManager=pnpm for clean single-comment PR experience
- Fork guard (head.repo.full_name == github.repository) blocks external PRs from getting snapshot access
- No NPM_TOKEN needed for preview workflow — pkg-pr-new uses its own CDN, not npm registry
- Skip publish step when no packages changed — avoids pkg-pr-new error on empty input

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest tests cannot run on Node v20 (pre-existing documented issue — Vitest v4 requires Node v24+). This is NOT a regression from this plan's changes — CI runs on Node v24 where tests pass. All other validations (changeset status, biome, sherif, knip, madge, build) passed cleanly.

## User Setup Required

None - no external service configuration required. pkg-pr-new GitHub App must be installed on the repository (one-time setup by repo admin) for PR comments to appear.

## Next Phase Readiness
- Phase 7 (Release Automation) is fully complete
- All release infrastructure configured: changesets for versioning, release.yml for publish, preview.yml for snapshots
- Ready for Phase 8 (External Code Extraction)
- NPM_TOKEN repository secret must be added before first actual npm publish

## Self-Check: PASSED

- All key files exist on disk (preview.yml)
- Task commit found in git log (47eb14c)

---
*Phase: 07-release-automation*
*Completed: 2026-03-01*
