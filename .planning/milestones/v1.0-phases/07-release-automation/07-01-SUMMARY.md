---
phase: 07-release-automation
plan: 01
subsystem: infra
tags: [changesets, github-actions, npm-publish, release-automation]

# Dependency graph
requires:
  - phase: 06-package-metadata
    provides: publish-ready packages with correct metadata, LICENSE, README
provides:
  - "@changesets/cli configured for independent versioning with public access"
  - "GitHub Actions release workflow (version PRs + npm publish + GitHub Releases)"
  - "changeset and ci:publish root scripts"
affects: [07-02, 08-external-extraction]

# Tech tracking
tech-stack:
  added: ["@changesets/cli@2.29.8", "@changesets/changelog-github@0.5.2"]
  patterns: ["changesets independent versioning", "GitHub Actions release pipeline"]

key-files:
  created:
    - ".changeset/config.json"
    - ".changeset/README.md"
    - ".github/workflows/release.yml"
  modified:
    - "package.json"
    - "pnpm-lock.yaml"

key-decisions:
  - "Used @changesets/changelog-github for PR-attributed changelog entries with author credit"
  - "cancel-in-progress: false on release workflow — never cancel in-progress publishes"
  - "privatePackages { version: false, tag: false } to skip @chillwhales/config"
  - "Build step runs before changesets/action so dist/ artifacts exist for publish"

patterns-established:
  - "Changesets workflow: developers add changesets → merge to main → version PR → merge version PR → auto-publish"
  - "Release safety: cancel-in-progress false prevents partial publish corruption"

requirements-completed: [REL-01, REL-02, REL-03, REL-04, REL-05, REL-07]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 7 Plan 1: Changesets & Release Workflow Summary

**@changesets/cli configured for independent versioning with @changesets/changelog-github, plus GitHub Actions release.yml for automated version PRs and npm publish**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T09:27:57Z
- **Completed:** 2026-03-01T09:30:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Changesets configured for independent versioning of 8 public @chillwhales/* packages
- @changesets/changelog-github generates PR-attributed changelogs with author credit
- Release workflow creates version PRs on push to main and publishes to npm when merged
- GitHub Releases auto-created for each published package (default behavior)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @changesets/cli and configure for independent versioning** - `11baf3d` (chore)
2. **Task 2: Create GitHub Actions release workflow** - `8fc5b3f` (feat)

## Files Created/Modified
- `.changeset/config.json` - Changesets configuration: independent versioning, public access, changelog-github preset, privatePackages skip
- `.changeset/README.md` - Developer guidance for adding changesets
- `.github/workflows/release.yml` - Release workflow: version PR creation + npm publish + GitHub Releases
- `package.json` - Added changeset and ci:publish scripts, @changesets/cli and @changesets/changelog-github devDependencies
- `pnpm-lock.yaml` - Lock file updated with 70 new packages

## Decisions Made
- Used @changesets/changelog-github preset for PR-attributed changelogs (per CONTEXT.md)
- cancel-in-progress: false on release workflow — partial publish is dangerous, retry is the recovery path
- privatePackages config set to { version: false, tag: false } — skips @chillwhales/config (private devDependency)
- Build step before changesets/action ensures dist/ artifacts exist for publish
- No npm provenance (id-token: write) — keeps initial release simple

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required. (NPM_TOKEN repository secret is needed before first publish but is documented separately in plan 07-02.)

## Next Phase Readiness
- Changesets and release workflow are fully configured
- Ready for 07-02 (pkg-pr-new snapshot releases)
- NPM_TOKEN secret must be added to repository before first actual publish

## Self-Check: PASSED

- All key files exist on disk (config.json, README.md, release.yml)
- Both task commits found in git log (11baf3d, 8fc5b3f)

---
*Phase: 07-release-automation*
*Completed: 2026-03-01*
