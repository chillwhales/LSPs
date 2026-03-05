---
phase: 07-release-automation
verified: 2026-03-01T09:45:00Z
status: passed
score: 12/12 must-haves verified
---

# Phase 7: Release Automation Verification Report

**Phase Goal:** Merging to main automatically versions, changelogs, and publishes changed packages to npm — no manual publish steps.
**Verified:** 2026-03-01T09:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `pnpm changeset` launches the interactive changeset creator | ✓ VERIFIED | `"changeset": "changeset"` script in root package.json; `@changesets/cli@^2.29.8` installed |
| 2 | Running `pnpm changeset status` reports package status without error | ✓ VERIFIED | Command exits 0 — reports "NO packages to be bumped" (expected, no changesets yet) |
| 3 | .changeset/config.json specifies independent versioning (no fixed or linked groups) | ✓ VERIFIED | `"fixed": []`, `"linked": []` confirmed in config.json |
| 4 | .changeset/config.json sets access to public for scoped packages | ✓ VERIFIED | `"access": "public"` confirmed in config.json |
| 5 | release.yml uses changesets/action to create version PRs on push to main | ✓ VERIFIED | `changesets/action@v1` with `version: pnpm changeset version`, trigger is `push` to `main` only |
| 6 | release.yml uses changesets/action to publish to npm when no changesets pending | ✓ VERIFIED | `publish: pnpm ci:publish` configured in changesets/action step, `NPM_TOKEN` in env |
| 7 | release.yml creates GitHub Releases by default (createGithubReleases: true) | ✓ VERIFIED | `changesets/action@v1` defaults to `createGithubReleases: true`; `contents: write` permission granted |
| 8 | Pushing to a PR targeting main triggers the preview workflow | ✓ VERIFIED | `on: pull_request: branches: - main` in preview.yml |
| 9 | Preview workflow builds and publishes only changed packages via pkg-pr-new | ✓ VERIFIED | `pnpm --filter="...[origin/main]"` for build + detect, `pnpx pkg-pr-new publish` with detected packages |
| 10 | A PR comment with installable URLs is posted (or updated) for each push | ✓ VERIFIED | `--compact --comment=update --packageManager=pnpm` flags on pkg-pr-new publish |
| 11 | Fork PRs do NOT trigger the preview workflow (security gate) | ✓ VERIFIED | `if: github.event.pull_request.head.repo.full_name == github.repository` on job |
| 12 | All existing tooling still passes after adding the preview workflow | ✓ VERIFIED | `pnpm check` (biome + sherif + knip + madge) exits 0; `pnpm build` exits 0 |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.changeset/config.json` | Changesets config for independent versioning with public access | ✓ VERIFIED | 15 lines, contains `access: "public"`, `fixed: []`, `linked: []`, `@changesets/changelog-github`, `privatePackages` skip config |
| `.changeset/README.md` | Developer guidance for adding changesets | ✓ VERIFIED | 8 lines, standard changesets documentation |
| `.github/workflows/release.yml` | Version PR creation + npm publish + GitHub Releases workflow | ✓ VERIFIED | 49 lines, `changesets/action@v1`, `cancel-in-progress: false`, `NPM_TOKEN`, `GITHUB_TOKEN`, `registry-url` |
| `.github/workflows/preview.yml` | PR-based snapshot releases via pkg-pr-new | ✓ VERIFIED | 50 lines, fork guard, changed-package detection, `pkg-pr-new publish --compact --comment=update` |
| `package.json` | changeset and ci:publish scripts | ✓ VERIFIED | `"changeset": "changeset"` and `"ci:publish": "changeset publish"` present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.github/workflows/release.yml` | `.changeset/config.json` | changesets/action reads config for versioning behavior | ✓ WIRED | `changesets/action@v1` present — reads `.changeset/config.json` automatically |
| `.github/workflows/release.yml` | npm registry | NPM_TOKEN secret → changeset publish → pnpm publish | ✓ WIRED | `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}` in env; `registry-url: "https://registry.npmjs.org"` on setup-node |
| `.changeset/config.json` | `@changesets/changelog-github` | changelog preset configuration | ✓ WIRED | `"changelog": ["@changesets/changelog-github", { "repo": "chillwhales/LSPs" }]`; dep `@changesets/changelog-github@^0.5.2` in root devDependencies |
| `.github/workflows/preview.yml` | pkg-pr-new GitHub App | pnpx pkg-pr-new publish posts PR comments | ✓ WIRED | `pnpx pkg-pr-new publish ${{ steps.changed.outputs.packages }} --compact --comment=update --packageManager=pnpm` |
| `.github/workflows/preview.yml` | fork guard conditional | if condition blocks fork PRs | ✓ WIRED | `if: github.event.pull_request.head.repo.full_name == github.repository` on job level |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REL-01 | 07-01 | Changesets configured for independent versioning | ✓ SATISFIED | `fixed: []`, `linked: []` in config.json; independent version tracking confirmed via `changeset status` |
| REL-02 | 07-01 | Changelogs auto-generated with GitHub PR attribution | ✓ SATISFIED | `"changelog": ["@changesets/changelog-github", { "repo": "chillwhales/LSPs" }]` in config.json |
| REL-03 | 07-01 | Scoped packages configured for public npm access | ✓ SATISFIED | `"access": "public"` in config.json |
| REL-04 | 07-01 | Version PR auto-created on merge to main | ✓ SATISFIED | release.yml: `changesets/action@v1` with `version: pnpm changeset version`, `commit: "chore: version packages"`, `title: "chore: version packages"` |
| REL-05 | 07-01 | Changed packages auto-published to npm when version PR merges | ✓ SATISFIED | release.yml: `publish: pnpm ci:publish` → runs `changeset publish` which publishes to npm |
| REL-06 | 07-02 | PR-based snapshot releases via pkg-pr-new | ✓ SATISFIED | preview.yml: `pnpx pkg-pr-new publish` with `--compact --comment=update`, fork guard for security |
| REL-07 | 07-01 | GitHub Releases created when packages are published | ✓ SATISFIED | `changesets/action@v1` defaults `createGithubReleases: true`; `contents: write` permission enables it |

**All 7 requirement IDs accounted for. No orphaned requirements.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No TODO/FIXME/PLACEHOLDER/stub patterns found in any phase 7 artifacts. No empty implementations. No anti-patterns detected.

### Human Verification Required

### 1. Release Workflow End-to-End

**Test:** Add a changeset file (`pnpm changeset`), merge a PR to main, and verify the version PR is created automatically.
**Expected:** changesets/action creates a "chore: version packages" PR with bumped versions and CHANGELOG.md entries. Merging that PR triggers npm publish.
**Why human:** Requires actual GitHub Actions execution, npm registry access, and NPM_TOKEN secret configuration.

### 2. Preview Snapshot Releases

**Test:** Open a PR that changes a package, push to it, and check for a PR comment with pkg.pr.new install URLs.
**Expected:** pkg-pr-new posts/updates a PR comment with `pnpm add https://pkg.pr.new/@chillwhales/<pkg>@<sha>` URLs.
**Why human:** Requires the pkg-pr-new GitHub App to be installed on the repository and actual PR workflow execution.

### 3. NPM_TOKEN Repository Secret

**Test:** Verify that the `NPM_TOKEN` repository secret is configured before first publish attempt.
**Expected:** Secret exists in GitHub repository settings → Secrets and variables → Actions.
**Why human:** Secret management is a manual GitHub UI step — cannot be verified programmatically.

### Gaps Summary

No gaps found. All 12 observable truths verified, all 5 artifacts pass all three levels (exists, substantive, wired), all 5 key links verified, all 7 requirement IDs satisfied, and no anti-patterns detected.

The release automation infrastructure is fully configured:
- **Changesets** for independent versioning with public access and PR-attributed changelogs
- **Release workflow** (release.yml) for automated version PRs and npm publish via changesets/action
- **Preview workflow** (preview.yml) for PR-based snapshot releases via pkg-pr-new with fork security
- **All existing tooling** (biome, sherif, knip, madge, build) continues to pass

### Commits Verified

| Hash | Message | Status |
|------|---------|--------|
| `11baf3d` | chore(07-01): install changesets and configure independent versioning | ✓ Exists |
| `8fc5b3f` | feat(07-01): create GitHub Actions release workflow | ✓ Exists |
| `969bd6d` | docs(07-01): complete changesets and release workflow plan | ✓ Exists |
| `47eb14c` | feat(07-02): create PR snapshot preview workflow with pkg-pr-new | ✓ Exists |
| `d41ae4e` | docs(07-02): complete PR preview snapshots & release validation plan | ✓ Exists |

---

_Verified: 2026-03-01T09:45:00Z_
_Verifier: Claude (gsd-verifier)_
