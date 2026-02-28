# Phase 7: Release Automation — Research

**Researched:** 2026-02-28
**Phase:** 07-release-automation

## Standard Stack

| Tool | Purpose | Why |
|------|---------|-----|
| `@changesets/cli` | Independent versioning, changelog generation, publish orchestration | De facto standard for monorepo releases; pnpm officially recommends it; handles `workspace:*` protocol natively |
| `@changesets/changelog-github` | PR attribution in changelogs | Official preset that links PRs, commits, and author credit in CHANGELOG.md entries |
| `changesets/action@v1` | GitHub Actions integration | Official action that creates/updates version PRs and runs publish on merge |
| `pkg-pr-new` (pkg.pr.new) | Snapshot releases on PR push | No npm token needed for snapshots; generates installable URLs per-commit; single command; auto-comments on PRs |

**No custom tooling needed.** Every requirement maps to an existing tool with first-class pnpm monorepo support.

## Architecture

```
Developer flow:
  1. Developer creates branch, makes changes
  2. Runs `pnpm changeset` → creates .changeset/*.md file with bump type + summary
  3. Commits changeset file with the PR
  4. PR push triggers: CI (ci.yml) + snapshot release (preview.yml)
  5. PR merges to main → release workflow (release.yml) detects changesets
  6. changesets/action creates "Version Packages" PR (bumped versions + changelogs)
  7. Maintainer reviews + merges version PR (human checkpoint)
  8. release.yml runs again → no pending changesets → runs publish command
  9. Changed packages published to npm; GitHub Releases created automatically

Workflow files:
  .github/workflows/ci.yml        ← existing (unchanged)
  .github/workflows/release.yml   ← NEW: changesets version PR + publish
  .github/workflows/preview.yml   ← NEW: pkg-pr-new snapshot releases
```

## Implementation Details

### Changesets Configuration

#### 1. Install dependencies (root devDependencies)

```bash
pnpm add -Dw @changesets/cli @changesets/changelog-github
```

#### 2. Initialize changesets

```bash
pnpm changeset init
```

This creates `.changeset/` directory with `config.json` and a `README.md`.

#### 3. Exact `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "chillwhales/LSPs" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "bumpVersionsWithWorkspaceProtocolOnly": false,
  "privatePackages": {
    "version": false,
    "tag": false
  }
}
```

**Key decisions explained:**

| Option | Value | Rationale |
|--------|-------|-----------|
| `changelog` | `["@changesets/changelog-github", { "repo": "chillwhales/LSPs" }]` | REL-02: PR attribution. Requires `GITHUB_TOKEN` at `changeset version` time (the action provides this automatically). |
| `access` | `"public"` | REL-03: All `@chillwhales/*` scoped packages publish publicly. Without this, npm defaults scoped packages to `restricted`. |
| `baseBranch` | `"main"` | Matches the existing CI trigger branch. |
| `updateInternalDependencies` | `"patch"` | When `@chillwhales/utils` bumps, packages depending on it via `workspace:*` get their dependency range updated. Ensures consumers always pull compatible versions. |
| `commit` | `false` | The changesets/action handles committing in the version PR. No auto-commits locally. |
| `fixed` / `linked` | `[]` | REL-01: Independent versioning. Packages version independently — no locking or linking. |
| `privatePackages.version` | `false` | `@chillwhales/config` is `private: true` — skip versioning it entirely. It's a devDependency-only internal config package. |
| `privatePackages.tag` | `false` | No git tags for the private config package. |

#### 4. How `workspace:*` is handled at publish time

**This is critical and works automatically.** When pnpm packs/publishes a package, it dynamically replaces `workspace:*` with the actual version. Example:

```
# In repo (package.json):
"dependencies": { "@chillwhales/utils": "workspace:*" }

# After pnpm publish transforms it to:
"dependencies": { "@chillwhales/utils": "0.1.0" }
```

Changesets' `updateInternalDependencies: "patch"` ensures that when `@chillwhales/utils` bumps from `0.1.0` → `0.1.1`, packages depending on it get their `workspace:*` pinned to the new version in the published tarball. The `workspace:*` stays in the repo's source — only the published package.json changes.

**No `.npmrc` changes needed** for workspace protocol. pnpm handles this natively during `pnpm publish`.

#### 5. Root package.json scripts to add

```json
{
  "scripts": {
    "ci:publish": "pnpm publish -r --access public"
  }
}
```

The `--access public` flag is belt-and-suspenders alongside the config.json `access: "public"` — ensures first publish of scoped packages doesn't default to `restricted`. After first publish, npm remembers the access level, but it's safest to always pass it.

**Note on `changeset publish` vs `pnpm publish -r`:** The `changesets/action` calls the `publish` input as a shell command. Using `pnpm publish -r` is the pnpm-recommended approach. It detects which packages have unpublished versions and publishes only those. `changeset publish` also works (it auto-detects pnpm and uses `pnpm publish` internally), but `pnpm publish -r` is more explicit and avoids an extra abstraction layer.

**However**, there's a key difference: `changeset publish` creates git tags (e.g., `@chillwhales/utils@0.1.1`) and the changesets/action uses these tags to determine which packages were published (for GitHub Releases). If using `pnpm publish -r` directly, you need to call `changeset tag` afterward, or use `changeset publish` instead. **Recommendation: use `changeset publish` as the publish command** so git tags and the action's `publishedPackages` output work correctly.

Updated script:

```json
{
  "scripts": {
    "ci:publish": "changeset publish"
  }
}
```

### Release Workflow

#### `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false  # Don't cancel in-progress releases

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write      # Create GitHub Releases + push version PR commits
      pull-requests: write  # Create/update version PR
      # id-token: write     # npm provenance — optional, NOT part of Phase 7 baseline plan
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          commit: "chore: version packages"
          title: "chore: version packages"
          publish: pnpm ci:publish
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**How this workflow behaves (two modes):**

1. **Changesets pending** (after feature PRs merge): The action detects `.changeset/*.md` files, runs `changeset version` to bump versions/changelogs, and creates/updates a PR titled "chore: version packages". It does NOT publish.

2. **No changesets pending** (after version PR merges): The action runs the `publish` command. `changeset publish` checks npm for each package, publishes those with unpublished versions, creates git tags. The action then creates GitHub Releases for each published package (REL-07 — `createGithubReleases` defaults to `true`).

**Idempotency (REL-05 retry strategy):** If publish partially fails (e.g., 3 of 5 packages published), re-running the workflow is safe. `changeset publish` checks npm registry before publishing — already-published versions are skipped. npm's `409 Conflict` for duplicate versions is handled gracefully.

#### NPM_TOKEN setup

1. Create a Granular Access Token on npmjs.com:
   - Token type: **Automation** (bypasses 2FA for CI)
   - Scope: **Read and write** for `@chillwhales` packages
   - No IP allowlist needed
2. Add as repository secret: Settings → Secrets → Actions → `NPM_TOKEN`

The `changesets/action` automatically creates `.npmrc` with:
```
//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}
```

If a `.npmrc` already exists in the repo, the action **will not overwrite it**. Since this repo has no `.npmrc`, the auto-generation works perfectly.

#### GitHub Releases (REL-07)

The `changesets/action` has `createGithubReleases: true` by default. After `changeset publish` runs:
- For each published package, it creates a GitHub Release
- Release name: `@chillwhales/utils@0.2.0`
- Release body: The changelog entry for that version (extracted from CHANGELOG.md)
- Tag: `@chillwhales/utils@0.2.0` (created by `changeset publish`)

No additional configuration needed.

### pkg-pr-new Setup (REL-06)

#### 1. Install the GitHub App

Navigate to https://github.com/apps/pkg-pr-new and install it on the `chillwhales/LSPs` repository. This is a one-time setup in the GitHub UI — not a code change.

The app needs repository permissions to post PR comments. See [pkg.pr.new permissions](https://github.com/stackblitz-labs/pkg.pr.new/issues/305).

#### 2. Create `.github/workflows/preview.yml`

```yaml
name: Preview Release

on:
  pull_request:
    branches:
      - main

# No NPM_TOKEN needed — pkg-pr-new doesn't publish to npm

jobs:
  preview:
    # Only run on internal branches, not forks (security)
    if: github.event.pull_request.head.repo.full_name == github.repository
    name: Publish Preview
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for pnpm --filter "...[origin/main]"

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Build changed packages
        run: pnpm --filter="...[origin/main]" --filter="!@chillwhales/config" build

      - name: Detect changed packages
        id: changed
        run: |
          CHANGED=$(pnpm --filter="...[origin/main]" --filter="!@chillwhales/config" exec -- node -e "process.stdout.write(process.cwd())" | tr '\n' ' ' | xargs -n1 realpath --relative-to=. | sed "s|^|'./|;s|$|'|" | tr '\n' ' ')
          echo "packages=$CHANGED" >> "$GITHUB_OUTPUT"
          if [ -z "$CHANGED" ]; then
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Publish preview packages
        if: steps.changed.outputs.skip != 'true'
        run: pnpx pkg-pr-new publish ${{ steps.changed.outputs.packages }} --compact --comment=update --packageManager=pnpm
```

**Key details:**

| Aspect | Detail |
|--------|--------|
| **Trigger** | `pull_request` on `main` — fires on every push to a PR |
| **Fork security** | `if: github.event.pull_request.head.repo.full_name == github.repository` blocks fork PRs from getting snapshot builds. This prevents untrusted code from running in the workflow context. |
| **No npm token** | pkg-pr-new uses its own CDN, not npm. No secrets needed. |
| **Only changed packages** | `pnpm --filter="...[origin/main]"` detects packages that changed since main. `--filter="!@chillwhales/config"` excludes the private config package. Only those packages are built and passed to pkg-pr-new. Requires `fetch-depth: 0` on checkout for full git history. |
| **`--compact`** | Generates short URLs like `https://pkg.pr.new/@chillwhales/utils@abc1234` using npm metadata. Requires `repository` field in package.json (already present). |
| **`--comment=update`** | Posts one comment on the PR and updates it on subsequent pushes (not a new comment per push). |
| **`--packageManager=pnpm`** | Shows `pnpm add` instead of `npm i` in PR comments. |

**PR comment example (only changed packages shown):**

```
📦 Preview packages are ready!

pnpm add https://pkg.pr.new/@chillwhales/lsp2@abc1234
...
```

### npm Access Configuration (REL-03)

#### What's needed for first publish of scoped packages

npm defaults scoped packages (`@scope/name`) to `restricted` (private/paid). For public packages:

**Option A — In `.changeset/config.json` (already configured above):**
```json
{ "access": "public" }
```

**Option B — In `ci:publish` script (belt-and-suspenders):**
```json
{ "ci:publish": "changeset publish" }
```

`changeset publish` reads the `access` config from `.changeset/config.json` and passes `--access public` to the underlying publish command.

**Option C — Per-package in package.json:**
```json
{ "publishConfig": { "access": "public" } }
```

This is **not needed** if config.json has `access: "public"`. But it's a valid alternative if you want package-level control.

**Recommendation:** Use config.json `access: "public"` only. Don't add `publishConfig` to every package.json — it's redundant and adds maintenance burden.

#### First publish considerations

- The `@chillwhales` npm organization must exist on npmjs.com before first publish
- The npm account owning the `NPM_TOKEN` must be a member of the `@chillwhales` org with publish permissions
- First publish of each package will create it on npm — no pre-registration needed
- After first publish, the `access` level is remembered by npm for subsequent publishes

#### No `.npmrc` file needed in the repo

- The `changesets/action` auto-creates `~/.npmrc` with the token at CI time
- For local development, developers don't need npm publish access
- The `registry-url` in `setup-node` sets the registry for the workflow

## Integration Points

### With existing CI (`ci.yml`)

The release and preview workflows are **separate files** from `ci.yml`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push to main + PRs | Validate: lint, typecheck, build, test, coverage |
| `release.yml` | push to main only | Version PRs + publish to npm |
| `preview.yml` | PRs only | Snapshot releases via pkg-pr-new |

**Why separate?**
1. Different permissions — CI needs `read`, release needs `write` + npm secrets
2. Different triggers — CI runs on PRs and main; release only on main; preview only on PRs
3. Different concurrency — CI cancels stale runs; release should NOT cancel (could interrupt publish)
4. Separation of concerns — CI failure shouldn't block release when version PR merges

**Duplicate work concern:** Yes, `release.yml` runs `pnpm install` and `pnpm build` again even though CI already validated. This is intentional:
- The release build must happen in the same job as publish (it needs the `dist/` artifacts)
- CI artifacts expire (1-day retention) and can't be reliably shared across workflows
- Build is fast (~seconds for this project) — not worth the complexity of cross-workflow artifact sharing
- Same applies to `preview.yml` — it needs fresh build artifacts

### With package.json scripts

Add to root `package.json`:
```json
{
  "scripts": {
    "changeset": "changeset",
    "ci:publish": "changeset publish"
  }
}
```

The `changeset` script is a convenience alias so developers can run `pnpm changeset` to add a changeset. The CLI works without this alias (since `@changesets/cli` provides a bin), but it's conventional to include it.

### With `workspace:*` dependencies

The dependency graph across packages:

```
lsp6  → utils
lsp4  → utils, lsp2
lsp3  → lsp2
lsp23 → lsp2
lsp29 → lsp2
lsp30 → (no internal deps)
lsp2  → (no internal deps)
utils → (no internal deps)
```

All use `workspace:*`. When changesets bumps `lsp2`, it will also bump the dependency range in `lsp3`, `lsp4`, `lsp23`, `lsp29` (via `updateInternalDependencies: "patch"`). This may create cascading version bumps — that's correct behavior for independent versioning.

### With commitlint

The version PR commit message `"chore: version packages"` conforms to the conventional commit format already enforced by commitlint. No changes to `commitlint.config.mjs` needed.

### With simple-git-hooks

The `pre-commit` hook runs Biome check. This does NOT run in CI (GitHub Actions doesn't trigger git hooks). No conflict with the release workflow.

### With knip

After adding `@changesets/cli` and `@changesets/changelog-github` as devDependencies, knip should recognize them. The changeset bin and changelog module are referenced in `.changeset/config.json`, which knip may not parse. If knip reports them as unused, add `ignoreDependencies` to the existing root workspace entry in `knip.json` (preserve the existing `workspaces` structure):

```json
{
  "workspaces": {
    ".": {
      "entry": [],
      "project": [],
      "ignoreBinaries": ["tsc"],
      "ignoreDependencies": [
        "@changesets/cli",
        "@changesets/changelog-github"
      ]
    }
  }
}
```

Only add the `ignoreDependencies` key — do not replace or remove existing fields.

## Common Pitfalls

### 1. Forgetting `access: "public"` on first scoped publish

**Symptom:** `npm ERR! 402 Payment Required` — npm thinks you're publishing a private package.
**Fix:** Ensure `.changeset/config.json` has `"access": "public"`.

### 2. NPM_TOKEN not set or expired

**Symptom:** `npm ERR! 401 Unauthorized` during publish.
**Fix:** Use an Automation token (not Classic) to avoid 2FA issues. Set as GitHub repository secret `NPM_TOKEN`.

### 3. Version PR conflicts with concurrent merges

**Symptom:** Version PR can't be merged because files changed on main.
**Fix:** The changesets/action automatically rebases the version PR when new commits arrive on main. No manual intervention needed. If it fails to auto-update, closing and re-triggering via a push to main recreates it.

### 4. `changeset version` fails: GITHUB_TOKEN lacks permissions

**Symptom:** `@changesets/changelog-github` can't fetch PR info; changelog generation fails.
**Fix:** The `GITHUB_TOKEN` provided by `secrets.GITHUB_TOKEN` is sufficient for public repos. For private repos, it needs `contents: read` and `pull-requests: read` permissions.

### 5. `workspace:*` not replaced in published package

**Symptom:** Published package has `"@chillwhales/utils": "workspace:*"` in its dependencies, which is un-installable from npm.
**Fix:** This only happens if you use `npm publish` directly instead of `pnpm publish`. Always publish through pnpm (which `changeset publish` does automatically when it detects pnpm). Never use `npm publish` in a pnpm workspace.

### 6. pkg-pr-new fails with "App not installed"

**Symptom:** Preview workflow runs but `pkg-pr-new publish` errors.
**Fix:** Install the GitHub App at https://github.com/apps/pkg-pr-new on the specific repository, not just the org.

### 7. Cascading version bumps create noise

**Symptom:** Bumping `utils` causes 5 other packages to get patch bumps.
**Why:** `updateInternalDependencies: "patch"` means dependents get a version bump when their dependency updates. This is correct behavior — consumers should know that the dependency tree changed.
**Mitigation:** This is by design. The version PR clearly shows all bumps for review before merging.

### 8. prepack/postpack scripts and changeset publish

**Current state:** All packages have `prepack: "cp ../../LICENSE ."` and `postpack: "rm -f LICENSE"`. `changeset publish` calls `pnpm publish` for each package, which triggers `prepack` and `postpack`. This works correctly — LICENSE is copied into the package before publish and cleaned up after. No changes needed.

### 9. Release workflow and `concurrency` — don't cancel in-progress

**Critical:** The release workflow must use `cancel-in-progress: false`. If a publish is running and a new push to main arrives, cancelling mid-publish could leave some packages published and others not. With `cancel-in-progress: false`, the current run finishes before the next starts.

### 10. The `@chillwhales` npm org must exist

Before first publish, someone must create the `@chillwhales` organization on npmjs.com. This is a manual one-time step outside of code.

## Don't Hand-Roll

| Don't build | Use instead | Why |
|-------------|-------------|-----|
| Custom version bumping logic | `changeset version` | Handles independent versioning, internal dependency cascading, and changelog generation |
| Custom changelog formatting | `@changesets/changelog-github` | PR links, commit links, author credit — all handled |
| Custom publish scripts with retry logic | `changeset publish` + workflow re-run | npm publish is idempotent (already-published versions are skipped); just re-run the workflow |
| Custom snapshot release infrastructure | `pkg-pr-new` | Purpose-built for this exact use case; no npm token needed; handles PR comments |
| Custom GitHub Release creation | `changesets/action` `createGithubReleases: true` (default) | Extracts changelog entry, creates release with proper tags |
| Custom version PR creation/management | `changesets/action` | Creates PR, updates it on new changesets, handles merge detection |
| Custom `.npmrc` generation in CI | `changesets/action` auto-generates it | Writes token-based `.npmrc` automatically if one doesn't exist |
| Custom fork PR security checks for snapshots | `github.event.pull_request.head.repo.full_name == github.repository` | One-line `if` condition in the workflow; no custom action needed |

---

*Phase: 07-release-automation*
*Research completed: 2026-02-28*
