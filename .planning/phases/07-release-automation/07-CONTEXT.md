# Phase 7: Release Automation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Merging to main automatically versions, changelogs, and publishes changed packages to npm — no manual publish steps. Covers changesets configuration, changelog generation, version PRs, npm publish, snapshot releases via pkg-pr-new, and GitHub Releases. All 8 @chillwhales/* packages. Does not include external repo migration (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Starting versions
- All 8 packages start at `0.1.0` — uniform, no prerelease tags
- Independent versioning from day one (packages diverge naturally as they receive changes)
- Promote to `1.0.0` individually via manual major changeset when a package is deemed stable
- No prerelease tags (`-beta`, `-rc`) for initial publish — `0.x` range already signals pre-stable

### Snapshot releases
- Automatic on every PR push — no opt-in trigger needed
- Only changed packages get snapshot builds (not the full monorepo)
- Install link posted as a PR comment, updated on each push
- Internal branches only — no snapshot builds for fork PRs (security: can't expose npm tokens)

### Changelog style
- Developer writes a consumer-focused summary in the changeset file (not just PR title)
- Each changelog entry links to the PR and credits the author — use `@changesets/changelog-github` preset
- Breaking changes handled automatically by changeset bump type (major) — no custom formatting
- Per-package `CHANGELOG.md` only — no root-level aggregate changelog

### Release flow control
- Version PR requires manual approval before merging (human checkpoint before npm publish)
- Sole maintainer merges — no CODEOWNERS or multi-reviewer setup needed now
- On partial publish failure: retry the whole workflow (changesets + npm publish are idempotent)
- GitHub Releases (REL-07) are the only publish notification — no Slack/Discord/email integration

### Claude's Discretion
- Changesets config file structure and options
- GitHub Actions workflow structure and job organization
- pkg-pr-new configuration details
- npm token and secret management approach in CI
- Exact GitHub Release body format

</decisions>

<specifics>
## Specific Ideas

- Changesets `@changesets/changelog-github` preset for PR attribution in changelogs
- pkg-pr-new for snapshot releases (not custom snapshot scripts)
- Idempotent publish strategy — re-running a failed workflow is the recovery path, no custom retry logic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-release-automation*
*Context gathered: 2026-02-28*
