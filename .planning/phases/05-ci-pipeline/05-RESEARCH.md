# Phase 5: CI Pipeline - Research

**Researched:** 2026-02-28
**Domain:** GitHub Actions CI for pnpm monorepo
**Confidence:** HIGH

## Summary

This phase creates a GitHub Actions CI pipeline for a pnpm 10 monorepo with 8 packages. The pipeline must run typecheck, lint/format, build, hygiene tools (sherif, knip, madge), package validation (publint + attw), tests with coverage on Node 22+24, and Codecov upload. The user has designed a 4-layer parallel pipeline: Install → 6 validate/build jobs → 3 verify/test jobs → Codecov upload.

The core infrastructure is straightforward: `pnpm/action-setup@v4` reads the `packageManager` field automatically, `actions/setup-node@v4` handles Node version with built-in pnpm caching, and `codecov/codecov-action@v5` handles upload. The critical design decision is how to share state between jobs — the recommended approach is to use pnpm store caching (via `actions/setup-node`) plus `actions/upload-artifact` / `actions/download-artifact` for build output that downstream jobs (publint, attw, tests) need.

**Primary recommendation:** Single workflow file with 11 jobs across 4 layers. Each job checks out the repo and restores the pnpm cache (fast with warm cache). Build artifacts are uploaded as workflow artifacts for Layer 3 jobs. publint and attw are added as devDependencies and run per-package against built output.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Test matrix: Node 22 + Node 24
- Matrix applies to test jobs only — lint, typecheck, build, and validation run once on Node 24
- Update root `engines` field from `>=18` to `>=22` to reflect what's actually tested
- Pipeline triggers: PRs + push to main (not nightly)
- Parallel jobs optimized for repo growth, not minimal config
- **Layer 1 — Install:** Single install job, cache pnpm store for downstream jobs
- **Layer 2 — Validate + Build (6 parallel jobs):** Typecheck (tsc), Lint/Format (biome), Sherif, Knip, Madge, Build (unbuild)
- **Layer 3 — Verify + Test (3 parallel jobs, depend on Build):** Pkg Verify (publint + attw), Test + Coverage on Node 22, Test + Coverage on Node 24
- **Layer 4 — Report (depends on Tests):** Codecov upload
- Each hygiene tool (sherif, knip, madge) gets its own job — not bundled
- All checks are required to pass for merge — no advisory-only checks
- publint/attw failures block merge
- Coverage threshold violations block merge
- Concurrency: cancel in-progress runs when new commits are pushed (CI-02)
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | Every PR runs install, typecheck, lint, format check, build, and test | GitHub Actions workflow syntax, pnpm/action-setup, actions/setup-node, concurrency groups, job dependency chains |
| CI-02 | In-progress CI runs are cancelled when new commits are pushed | `concurrency` key with `cancel-in-progress: true` — verified in GitHub Actions docs |
| CI-03 | Package exports and types are validated via publint and attw before merge | publint CLI (`publint --strict`), attw CLI (`attw --pack .`), both require built output (dist/) |
| CI-04 | Test coverage is reported and uploaded to Codecov on every PR | codecov/codecov-action@v5, codecov.yml with patch coverage threshold, lcov format already configured |
</phase_requirements>

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `pnpm/action-setup` | v4 | Install pnpm in CI | Official pnpm action; reads `packageManager` field automatically (no version needed) |
| `actions/setup-node` | v4 | Install Node.js + cache pnpm store | Built-in pnpm caching via `cache: 'pnpm'` — handles store path automatically |
| `actions/checkout` | v4 | Clone repository | Standard; needed in every job |
| `actions/upload-artifact` | v4 | Pass build output between jobs | Required for Layer 2→3 (build artifacts for publint/attw/tests) |
| `actions/download-artifact` | v4 | Retrieve build artifacts | Paired with upload-artifact in downstream jobs |
| `codecov/codecov-action` | v5 | Upload coverage to Codecov | Latest version; supports OIDC and tokenless for public repos |
| `publint` | ^0.3.17 | Validate package.json exports/files | Standard package validation tool; catches broken exports maps |
| `@arethetypeswrong/cli` | latest | Validate TypeScript types resolution | Catches ESM/CJS type resolution issues; complements publint |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `biome check` (already installed) | Lint + format check | CI uses `biome ci` (non-interactive, errors on violations) |
| `tsc --noEmit` (already installed) | Type checking | Runs per-package via `pnpm -r exec tsc --noEmit` |
| `sherif`, `knip`, `madge` (already installed) | Monorepo hygiene | Each gets own parallel job in Layer 2 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-job checkout+install | Shared workspace artifact | Artifact upload/download of node_modules is slower than cached pnpm install; cache hit is ~5s |
| Single workflow | Multiple workflow files | Single file is simpler for 11 jobs; split only needed for reusable workflows |
| `actions/cache` manual | `setup-node` cache: 'pnpm' | setup-node handles store path detection automatically; manual cache is unnecessary overhead |

**Installation (new devDependencies to add):**
```bash
pnpm add -Dw publint @arethetypeswrong/cli
```

## Architecture Patterns

### Recommended Project Structure
```
.github/
└── workflows/
    └── ci.yml              # Single workflow file for all CI
codecov.yml                 # Codecov configuration (repo root)
```

### Pattern 1: 4-Layer Parallel Pipeline

**What:** Jobs organized in dependency layers for maximum parallelism
**When to use:** Always — this is the user's locked decision

```yaml
# Layer 1: Install
install → 
  # Layer 2: Validate + Build (6 parallel, depend on install)
  typecheck, lint, sherif, knip, madge, build →
    # Layer 3: Verify + Test (3 parallel, depend on build)
    pkg-verify, test-22, test-24 →
      # Layer 4: Report (depends on test-24)
      codecov
```

**Key insight:** Layer 2 jobs (except build) don't need build artifacts — they only need installed dependencies. Layer 3 jobs need build output (dist/ dirs) from the build job.

### Pattern 2: Efficient Caching Strategy

**What:** Each job does checkout + pnpm setup (with cache) + install. Build artifacts passed via upload/download-artifact.
**Why:** pnpm store cache restores in ~5-10s. Uploading/downloading the full node_modules as an artifact is actually slower and larger than just running `pnpm install --frozen-lockfile` with a warm store cache.

```yaml
# Reusable step pattern for every job:
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 24
      cache: 'pnpm'
  - run: pnpm install --frozen-lockfile
```

### Pattern 3: Build Artifact Passing

**What:** Upload `packages/*/dist` from the build job, download in Layer 3 jobs
**Why:** publint, attw, and tests need the compiled output

```yaml
# In build job:
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: packages/*/dist
    retention-days: 1

# In downstream jobs:
- uses: actions/download-artifact@v4
  with:
    name: build-output
    path: packages  # restores to packages/*/dist
```

**Gotcha:** `download-artifact` restores relative to the `path` you specify. The upload preserves directory structure from the repo root. When uploading `packages/*/dist`, you should download to the repo root (not `packages/`) so paths align correctly. Test this pattern carefully.

### Pattern 4: Concurrency Cancellation

**What:** Cancel in-progress runs when new commits are pushed to the same PR/branch
**Why:** Saves CI minutes, required by CI-02

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

This groups by PR number (for PRs) or branch ref (for pushes to main). Pushing a new commit cancels the previous run for that PR.

### Pattern 5: Typecheck Without Root tsconfig

**What:** No root tsconfig.json exists; each package has its own tsconfig.json
**How to typecheck:** Use `pnpm -r exec tsc --noEmit` or add a `typecheck` script to root package.json

```bash
# Option A: Direct execution
pnpm -r --filter '!@chillwhales/config' exec tsc --noEmit

# Option B: Add script to root package.json (preferred)
# "typecheck": "pnpm -r --filter '!@chillwhales/config' exec tsc --noEmit"
```

**Why filter config?** The config package has no src code to typecheck — it only exports raw .ts files and a tsconfig.base.json. Running tsc there would fail or be meaningless.

### Anti-Patterns to Avoid

- **Caching node_modules as artifact:** Don't upload the full node_modules between jobs. pnpm store cache + `--frozen-lockfile` is faster and more reliable.
- **Running all tools in one job:** Defeats the purpose of parallel execution. User explicitly wants each hygiene tool isolated.
- **Skipping `--frozen-lockfile` in CI:** Without it, CI might install different versions than local, or modify the lockfile silently.
- **Using `biome check` instead of `biome ci`:** `biome ci` is the non-interactive CI mode that properly fails on errors. Actually, Biome's `check` command with no `--write` flag works the same. `biome ci` is an alias. Use `biome ci` for clarity in CI contexts.
- **Matrix for lint/typecheck/build:** These should NOT use a Node matrix — they run once on Node 24 only. Only test jobs use the Node 22+24 matrix.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| pnpm store caching | Manual `actions/cache` with store path | `actions/setup-node` with `cache: 'pnpm'` | setup-node auto-detects pnpm store path, handles save/restore |
| Package validation | Custom scripts checking exports | `publint --strict` + `attw --pack .` | These tools know every edge case of package.json exports resolution |
| Coverage upload | curl to Codecov API | `codecov/codecov-action@v5` | Handles auth, file discovery, flag management |
| Concurrency control | Conditional steps with API calls | GitHub Actions `concurrency` key | Built-in, reliable, zero configuration beyond group name |

**Key insight:** GitHub Actions has mature built-in features (concurrency, caching, artifacts) — the CI pipeline is mostly wiring them together correctly.

## Common Pitfalls

### Pitfall 1: pnpm Store Path Misalignment
**What goes wrong:** pnpm/action-setup v4 doesn't set up Node — you must also use actions/setup-node. If setup-node runs before pnpm is installed, cache detection fails.
**Why it happens:** setup-node needs pnpm available to detect the store path.
**How to avoid:** Order must be: (1) actions/checkout, (2) pnpm/action-setup, (3) actions/setup-node with cache: 'pnpm'. This order is CRITICAL.
**Warning signs:** Cache miss every run even though lockfile hasn't changed.

### Pitfall 2: Artifact Path Restoration
**What goes wrong:** Downloaded artifacts don't land in the right directory, causing "file not found" in publint/attw.
**Why it happens:** upload-artifact preserves paths relative to the search path. If you upload `packages/*/dist`, the artifact contains `packages/<name>/dist/...`. When downloading, you need to restore to the repo root.
**How to avoid:** Download artifact with no `path` override (defaults to current directory) or explicitly set `path: .` to restore at repo root.
**Warning signs:** publint reports "missing dist" or "no files to validate".

### Pitfall 3: publint Needs Built Output
**What goes wrong:** publint runs before build, reports errors about missing dist files.
**Why it happens:** publint validates the actual published files, not just package.json.
**How to avoid:** publint/attw job depends on build job AND downloads build artifacts.
**Warning signs:** "Cannot find dist/index.mjs" or similar errors from publint.

### Pitfall 4: attw Requires npm pack
**What goes wrong:** `attw` without `--pack` flag tries to check a tarball that doesn't exist.
**Why it happens:** attw expects either a tarball path or `--pack .` to pack in-place.
**How to avoid:** Use `attw --pack .` (packs and checks in one step) for each package. Or use `--from-npm` for published packages (not applicable here).
**Warning signs:** "Error: ENOENT" or "expected a tarball" from attw.

### Pitfall 5: Codecov Token for Private Repos
**What goes wrong:** Codecov upload silently fails or is rejected.
**Why it happens:** v5 requires a token for private repos. Public repos can use tokenless (opt-in in org settings) or OIDC.
**How to avoid:** Add `CODECOV_TOKEN` as a repository secret. Reference via `${{ secrets.CODECOV_TOKEN }}`. For public repos, can use OIDC with `use_oidc: true` and `permissions: id-token: write`.
**Warning signs:** Upload step shows "token not found" or coverage doesn't appear on PR.

### Pitfall 6: Codecov Patch Coverage vs. Project Coverage
**What goes wrong:** PR is blocked by project coverage dip even though new code is well-tested.
**Why it happens:** `coverage.status.project` compares total project coverage against base. Deleting well-covered code or refactoring can trigger this.
**How to avoid:** Configure codecov.yml carefully — user wants patch coverage at 80%. Set project coverage with a threshold to allow minor dips. Or disable project status and rely on patch only.
**Warning signs:** Coverage check fails despite all new lines being tested.

### Pitfall 7: Node 22 vs 24 Test Matrix in Codecov
**What goes wrong:** Both Node 22 and Node 24 upload coverage, creating confusing duplicate reports.
**Why it happens:** Codecov merges reports by commit SHA; two uploads from same commit create merged report.
**How to avoid:** User decided: upload from Node 24 only. Add an `if: matrix.node-version == 24` condition on the Codecov upload step, OR keep upload in a separate Layer 4 job that only depends on the Node 24 test job.
**Warning signs:** Coverage report shows doubled line counts or unexpected merging.

### Pitfall 8: Config Package in Typecheck
**What goes wrong:** `tsc --noEmit` fails on the config package because it has no src/ structure expected by tsc.
**Why it happens:** Config package exports raw .ts files directly without a build step.
**How to avoid:** Filter out config package: `pnpm -r --filter '!@chillwhales/config' exec tsc --noEmit`
**Warning signs:** tsc errors about missing rootDir or unexpected file locations in config package.

## Code Examples

### Complete Workflow Structure (ci.yml)

```yaml
# Source: GitHub Actions docs + research synthesis
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  # ═══════════════════════════════════════
  # Layer 1: Install
  # ═══════════════════════════════════════
  install:
    name: Install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

  # ═══════════════════════════════════════
  # Layer 2: Validate + Build (6 parallel)
  # ═══════════════════════════════════════
  typecheck:
    name: Typecheck
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r --filter '!@chillwhales/config' exec tsc --noEmit

  lint:
    name: Lint & Format
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome ci

  sherif:
    name: Sherif
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm sherif

  knip:
    name: Knip
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm knip

  madge:
    name: Circular Dependencies
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm madge

  build:
    name: Build
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: packages/*/dist
          retention-days: 1

  # ═══════════════════════════════════════
  # Layer 3: Verify + Test (3 parallel)
  # ═══════════════════════════════════════
  pkg-verify:
    name: Package Verification
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: packages  # restores packages/*/dist
      - run: pnpm -r --filter '!@chillwhales/config' exec publint --strict
      - run: pnpm -r --filter '!@chillwhales/config' exec attw --pack .

  test:
    name: Test (Node ${{ matrix.node-version }})
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: packages  # restores packages/*/dist
      - run: pnpm test:coverage

  # ═══════════════════════════════════════
  # Layer 4: Report
  # ═══════════════════════════════════════
  codecov:
    name: Coverage Report
    needs: test
    runs-on: ubuntu-latest
    if: always() && needs.test.result == 'success'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          # Download coverage from test job
          # Note: test job needs to upload coverage as artifact
          name: coverage-report
      - uses: codecov/codecov-action@v5
        with:
          files: ./coverage/lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: true
```

**Note:** The exact artifact passing for coverage between test→codecov needs consideration. Two approaches:

**Approach A (simpler):** Put the Codecov upload directly in the test job, with `if: matrix.node-version == 24`:
```yaml
# Inside the test job, after test:coverage:
- uses: codecov/codecov-action@v5
  if: matrix.node-version == 24
  with:
    files: ./coverage/lcov.info
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: true
```

**Approach B (matches user's 4-layer design):** Test job uploads coverage as artifact, separate codecov job downloads and uploads. This adds complexity for little benefit.

**Recommendation:** Use Approach A — inline the Codecov upload in the test job with a matrix condition. It's simpler, avoids an extra artifact upload/download cycle, and the user's 4-layer design is about logical grouping, not strict job separation. The codecov job can be the conditional upload step within the Node 24 test matrix variant.

### publint Per-Package Execution

```bash
# Run publint on each package (excluding config which is private/no-build)
pnpm -r --filter '!@chillwhales/config' exec publint --strict
```

`--strict` makes warnings into errors. This is recommended for CI to catch all issues.

### attw Per-Package Execution

```bash
# Run attw on each package
pnpm -r --filter '!@chillwhales/config' exec attw --pack .
```

`--pack .` tells attw to run `npm pack` in the current directory, analyze the tarball, then delete it. This checks the actual published output.

**Important:** attw's `--pack` flag runs `npm pack` internally, which requires the dist/ files to exist. This is why pkg-verify must depend on the build job.

### codecov.yml Configuration

```yaml
# Source: Codecov docs (codecov.yml reference)
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 2%     # allow 2% project coverage drop
    patch:
      default:
        target: 80%       # new/changed lines must have 80% coverage

comment:
  layout: "condensed_header, diff, flags, files"
  behavior: default
  require_changes: true   # only comment if coverage changes

ignore:
  - "packages/config/**"  # no testable code
```

### Concurrency Configuration

```yaml
# Source: GitHub Actions docs
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

This is placed at the workflow level (top-level), not per-job. It cancels the entire workflow run when a new one starts for the same PR or branch.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pnpm/action-setup v2 | pnpm/action-setup v4 | 2024 | v2 broke with newer Node; v4 reads packageManager automatically |
| codecov/codecov-action v3 | codecov/codecov-action v5 | 2024-2025 | v5 uses Codecov Wrapper/CLI, supports OIDC, tokenless for public repos |
| Manual pnpm cache with actions/cache | setup-node with cache: 'pnpm' | 2023+ | Built-in caching is simpler and maintained |
| Separate lint + format commands | `biome ci` (combined) | Biome v1+ | Single command for lint+format check in CI |
| codecov-action v4 token required | v5 supports tokenless + OIDC | 2025 | Public repos can opt into tokenless uploads |

**Deprecated/outdated:**
- `pnpm/action-setup@v2`: Broken with newer Node.js versions. Always use v4.
- `codecov/codecov-action@v3`: Missing CLI features (ATS, global upload token). Use v5.
- Manual `actions/cache` for pnpm: Unnecessary — `actions/setup-node@v4` handles this natively with `cache: 'pnpm'`.

## Open Questions

1. **Artifact download path alignment**
   - What we know: upload-artifact v4 preserves directory structure relative to the working directory. `packages/*/dist` uploads the dist directories nested under package names.
   - What's unclear: When downloading with `path: packages`, does it create `packages/packages/*/dist` (double nesting) or correctly restore to `packages/*/dist`? 
   - Recommendation: Test the artifact restore path. The safest approach is uploading with `path: packages/*/dist` and downloading with no path override (restores to workspace root). Alternatively, download with `path: .` to restore at repo root. Verify during implementation.

2. **attw execution in pnpm monorepo**
   - What we know: `attw --pack .` runs npm pack internally, which should work per-package when executed via `pnpm -r exec`.
   - What's unclear: Whether attw's internal npm pack works correctly inside a pnpm workspace (pnpm symlinks vs npm pack behavior).
   - Recommendation: Test `pnpm -r --filter '!@chillwhales/config' exec attw --pack .` locally before committing to CI. If it fails, alternative is `pnpm -r --filter '!@chillwhales/config' exec sh -c 'npm pack . && attw *.tgz && rm *.tgz'`.

3. **Codecov token requirement**
   - What we know: This appears to be a GitHub-hosted public repo. Codecov v5 supports tokenless for public repos (org opt-in required).
   - What's unclear: Whether the repo is public and whether the org has opted into tokenless.
   - Recommendation: Always configure `CODECOV_TOKEN` as a repository secret for reliability. Tokenless is a nice-to-have but tokens always work.

4. **Build artifacts needed for tests?**
   - What we know: Tests import from source, not from built output (vitest resolves .ts files directly in monorepo).
   - What's unclear: Whether vitest test runs actually need the dist/ output, or if they work with just installed dependencies.
   - Recommendation: Tests likely DON'T need build artifacts since vitest resolves workspace packages via TypeScript source. However, some packages depend on other workspace packages — if those dependencies rely on dist/ output, tests would fail without it. The safe approach is to download build artifacts for test jobs too. Verify by running `pnpm test` locally without building first.

## Sources

### Primary (HIGH confidence)
- pnpm/action-setup README (GitHub) — v4 usage, packageManager field, cache option
- actions/setup-node — cache: 'pnpm' built-in caching
- codecov/codecov-action README (GitHub) — v5 usage, token, OIDC, fail_ci_if_error
- Codecov docs (docs.codecov.com) — codecov.yml reference, status checks, patch coverage configuration
- publint.dev/docs/cli — CLI flags: `--strict`, `--level`, `--pack`
- @arethetypeswrong/cli README (GitHub) — `--pack .` usage, `--profile` options
- GitHub Actions workflow syntax docs — concurrency, matrix, needs, artifacts

### Secondary (MEDIUM confidence)
- wevm/viem CI workflow (GitHub) — reference pattern for pnpm monorepo CI with publint, biome, typecheck, coverage
- Codecov coverage configuration docs — project vs patch status, threshold settings

### Tertiary (LOW confidence)
- Artifact path restoration behavior with download-artifact v4 — needs hands-on verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are well-documented, widely used, versions verified
- Architecture: HIGH — user locked the 4-layer design; patterns verified against reference repos (viem)
- Pitfalls: HIGH — based on official docs, known issues documented in action READMEs
- Artifact passing: MEDIUM — upload/download-artifact behavior with nested paths needs verification
- attw in pnpm workspace: MEDIUM — `--pack` uses npm internally, interaction with pnpm workspace needs testing

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable tools; GitHub Actions syntax rarely changes)
