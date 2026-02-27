# Phase 4: Testing & Coverage Infrastructure - Research

**Researched:** 2026-02-27
**Domain:** Vitest coverage in pnpm monorepo with test.projects
**Confidence:** HIGH

## Summary

This phase adds coverage measurement infrastructure to an existing Vitest 4.x monorepo with 8 packages, fixes 10 pre-existing test failures in @chillwhales/lsp29, and wires up coverage scripts. The standard approach uses `@vitest/coverage-v8` (the default provider for Vitest), configured at the **root level only** since coverage is a root-level concern in Vitest's project-based architecture. Coverage from all projects is automatically merged into a single report.

The lsp29 test failures are well-understood: all 10 fail because test fixtures are missing the required `images` field and include a stale `createdAt` field not in the schema. The `images` field is correctly required per the LSP-29 specification — the fix is to add `images: []` (empty array) to all fixtures and remove `createdAt`. There is also a guards test that tests for `createdAt` validity which should be removed.

**Primary recommendation:** Add `@vitest/coverage-v8` to root devDependencies, configure coverage entirely in the root `vitest.config.ts` (NOT in per-package configs or createVitestConfig), fix the lsp29 test fixtures, and wire up `pnpm test:coverage` script.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 80% threshold across all four metrics: lines, branches, functions, statements
- Uniform threshold for all 8 packages — no per-package exceptions
- Hard fail: `pnpm test --coverage` exits non-zero if aggregate coverage drops below 80%
- No temporary lower thresholds — packages that can't meet 80% today will fail until tests are written
- Fix the 10 known test failures in @chillwhales/lsp29 (Zod schema: images field required but missing in fixtures)
- Fix underlying bugs first, then fix test fixtures — bugs always take priority over test fixes
- This phase is infrastructure only — no new tests are written to meet coverage targets
- After setup, run coverage once and capture baseline numbers as terminal output (not committed)
- Three report formats generated simultaneously: text (terminal), lcov (CI/Codecov), HTML (local browsing)
- Coverage output lives in `coverage/` at the repo root, gitignored
- Two ways to run: `pnpm test --coverage` (flag) and `pnpm test:coverage` (dedicated script in root package.json)
- Single-package coverage is run from the root via Vitest's project selection (e.g. `pnpm test:coverage -- --project=@chillwhales/<package>`) — must be documented so developers know about it

### Claude's Discretion
- Vitest coverage configuration details (provider options, reporter config)
- How single-package filtering is wired (Vitest project selection vs pnpm workspace filtering), as long as commands remain valid for the configured scripts
- HTML report styling/options
- Exact lcov output path within `coverage/`

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @vitest/coverage-v8 | ^4.0.17 (matches vitest catalog) | V8-based code coverage collection | Default Vitest coverage provider; faster than Istanbul; AST-aware remapping since v3.2 produces identical accuracy to Istanbul |
| vitest | 4.0.18 (installed) | Test runner | Already installed and configured across all packages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | — | — | @vitest/coverage-v8 is the only new dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vitest/coverage-v8 | @vitest/coverage-istanbul | Istanbul works on non-V8 runtimes but is slower and uses more memory; not needed here since we run Node.js |

**Installation:**
```bash
pnpm add -D -w @vitest/coverage-v8
```

Note: Install at root only (`-w` flag). Per-package installation is not needed — the root vitest process handles coverage collection for all projects.

## Architecture Patterns

### Critical: Coverage is Root-Level Only

From Vitest's official documentation on test projects:

> "coverage: coverage is done for the whole process" — coverage is NOT configurable per-project.

This means:
- Coverage config goes in `vitest.config.ts` at the repo root (inside `test.coverage`)
- `defineProject()` does NOT support `coverage` options — it will error if you try
- Do NOT add coverage config to `createVitestConfig()` in the shared config package
- Coverage from all 8 projects is automatically merged into one report

### Recommended Configuration

The root `vitest.config.ts` should be the ONLY file modified for coverage:

```typescript
// vitest.config.ts (root)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*", "!packages/config"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

### Coverage Include/Exclude Pattern

By default, Vitest only shows files that were imported during the test run. The `coverage.include` setting is important to define which source files should be measured. Recommended:

- `include: ["packages/*/src/**/*.ts"]` — all source files across all packages
- `exclude: ["**/*.test.ts", "**/*.d.ts"]` — exclude test files and type declaration files

### How --coverage Flag Works

From Vitest docs: `--coverage` is a shorthand for `--coverage.enabled`. When `coverage.enabled` is `false` (default), running `vitest run` does NOT collect coverage. Running `vitest run --coverage` enables it.

This means:
- `pnpm test` → `vitest run` → no coverage (fast)
- `pnpm test --coverage` → `vitest run --coverage` → coverage enabled via flag passthrough
- `pnpm test:coverage` → `vitest run --coverage` → same thing via dedicated script

### How Thresholds Work

From Vitest docs:
- Thresholds are **global** by default (across all covered files combined)
- If a threshold is a positive number, it's a minimum percentage
- If ANY threshold is not met, vitest exits with non-zero code
- `coverage.thresholds.perFile: true` would check thresholds per-file (NOT what we want — user wants uniform global thresholds)

**Important:** The 80% threshold is global across all packages combined, not per-package. Vitest does not natively support per-package thresholds when using test.projects. The global threshold means if the aggregate coverage across all 8 packages drops below 80%, the command fails.

### How Monorepo Coverage Merging Works

When Vitest runs with `test.projects`, it:
1. Discovers all project configs (8 packages)
2. Runs tests from all projects in a single process
3. Collects V8 coverage data from ALL executed files
4. Merges coverage from all projects into a single report
5. Applies thresholds against the merged report

There is NO per-project coverage report. The text reporter shows a single table. The lcov file is a single `lcov.info`. The HTML report is a single site with all files.

### Anti-Patterns to Avoid
- **Adding coverage to createVitestConfig():** `defineProject()` does not support coverage options. Will error.
- **Installing @vitest/coverage-v8 per-package:** Unnecessary; the root vitest handles everything.
- **Using `coverage.thresholds.perFile: true`:** This checks thresholds per-file, meaning a single file with low coverage fails the whole run — too strict for initial setup.
- **Setting `coverage.enabled: true` in config:** This would run coverage on every `pnpm test`, slowing regular test runs. Keep it off and use the `--coverage` flag.

## lsp29 Bug Analysis

### Root Cause (HIGH confidence — verified by reading source code and running tests)

**10 tests fail across 2 test files** in `@chillwhales/lsp29`:
- `guards.test.ts`: 6 failures
- `decode.test.ts`: 4 failures

**The problem:** All test fixtures are missing the `images` field which is **required** by the Zod schema (`lsp29EncryptedAssetInnerSchema`). They also include a stale `createdAt` field that does not exist in the schema (Zod strips unknown keys, so `createdAt` doesn't cause failures directly, but it's wrong).

**Schema definition (schemas.ts line 290):**
```typescript
images: z.array(z.array(imageSchema)),
```

This is a required field — `z.array()` without `.optional()`.

**LSP-29 specification (LSP-29-EncryptedAssets.md line 81):**
The spec includes `images` as a required field in the JSON schema.

### Is This a Schema Bug or a Fixture Bug?

**This is a fixture bug.** The schema correctly requires `images` per the LSP-29 specification. The test fixtures were written before the `images` field was added to the schema (or when it was optional), and they were never updated.

The `createdAt` field in fixtures was likely from an earlier version of the schema that had a creation timestamp. The current schema does not include it, and it was removed during the v2.0.0 refactoring.

### Fix Strategy

Per the user's instruction: "Fix underlying bugs first, then fix test fixtures." In this case, there is no underlying bug in the schema — the schema is correct per the spec. The "bug" is the stale test fixtures. The fix is:

1. **Add `images: []` to all test fixtures** — an empty array is valid for `z.array(z.array(imageSchema))` (0 image sets is valid)
2. **Remove `createdAt` from all test fixtures** — this field doesn't exist in the schema
3. **Remove the `createdAt` validation test** in `guards.test.ts` (line 143-151) — this test tests a field that doesn't exist in the schema, and it currently passes only because Zod strips unknown keys and the fixture fails for other reasons (missing `images`)

### Affected Files (3 files, specific line numbers)

**`packages/lsp29/src/guards.test.ts`:**
- Line 20: `validAsset` fixture — add `images: []`, remove `createdAt`
- Line 90: inline fixture in "should return false for missing required fields" — remove `createdAt`
- Lines 143-151: "should return false for invalid createdAt" test — **DELETE entirely** (tests non-existent field)
- Lines 153-170: `lsp8Asset` fixture — inherits from `validAsset` (fixed by fixing validAsset)
- Lines 173-189: `timeLockedAsset` — inherits from `validAsset`
- Lines 192-208: `followerAsset` — inherits from `validAsset`

**`packages/lsp29/src/decode.test.ts`:**
- Line 20: `validAsset` fixture — add `images: []`, remove `createdAt`
- All other tests in this file use `validAsset` via spread, so fixing the fixture fixes everything

**`packages/lsp29/src/schemas.test.ts`:**
- Line 115: inline fixture — add `images: []`, remove `createdAt`
- This test ("should propagate refinement through full asset schema") expects failure, so the fixture fix makes it more accurate

### Type Annotations

The fixtures use `LSP29EncryptedAsset` as the type annotation. Since this type is inferred from the Zod schema via `z.infer`, the `createdAt` field should produce a TypeScript error (excess property). The `images` field should also be a TypeScript error (missing required property). However, TypeScript's excess property checking doesn't apply to spread expressions, which is why some of these weren't caught. After the fix, all type annotations will be correct.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage collection | Custom V8 profiler integration | @vitest/coverage-v8 | V8 coverage remapping is complex; AST-aware source map handling |
| Coverage reporting | Custom lcov/html generators | Vitest's built-in reporters | Istanbul reporters are battle-tested for 13+ years |
| Coverage thresholds | Custom threshold checking scripts | `coverage.thresholds` config | Built-in non-zero exit code on threshold failure |
| Coverage merging | Custom per-package coverage + merge | Vitest's test.projects | Automatic merging across all projects in single process |

**Key insight:** Coverage in a Vitest monorepo is almost zero-config. The entire feature is one config block in the root vitest.config.ts plus one npm package install. Don't overthink it.

## Common Pitfalls

### Pitfall 1: Putting Coverage Config in defineProject()
**What goes wrong:** `defineProject()` does not support the `coverage` option. Adding it causes a TypeScript error and is silently ignored at runtime.
**Why it happens:** Intuition says "each package has its own tests, so configure coverage per-package."
**How to avoid:** Coverage goes ONLY in the root `vitest.config.ts`. Period.
**Warning signs:** Coverage config in `createVitestConfig()` or per-package `vitest.config.ts`

### Pitfall 2: Setting coverage.enabled: true in Config
**What goes wrong:** Coverage runs on every `pnpm test` call, making regular test runs significantly slower.
**Why it happens:** Seems logical to "always have coverage enabled."
**How to avoid:** Keep `coverage.enabled` as `false` (default). Use `--coverage` flag only when needed.
**Warning signs:** `pnpm test` is noticeably slower than before

### Pitfall 3: Not Adding coverage/ to .gitignore
**What goes wrong:** Coverage reports (HTML, lcov, etc.) get committed to git, bloating the repository.
**Why it happens:** Forgetting to gitignore the output directory.
**How to avoid:** Add `coverage/` to `.gitignore` before first coverage run.
**Warning signs:** `git status` showing hundreds of new files after running coverage

### Pitfall 4: Forgetting to Install @vitest/coverage-v8
**What goes wrong:** Running `--coverage` prompts for installation or errors out.
**Why it happens:** V8 coverage provider package is separate from vitest core.
**How to avoid:** Explicitly install `@vitest/coverage-v8` as a devDependency.
**Warning signs:** Interactive prompt asking to install package when running in CI

### Pitfall 5: coverage.include Too Broad or Missing
**What goes wrong:** Coverage report includes test files, config files, or node_modules, OR only shows files that were actually imported (hiding uncovered files).
**Why it happens:** Default behavior only shows imported files; broad patterns include non-source files.
**How to avoid:** Set `coverage.include: ["packages/*/src/**/*.ts"]` and `coverage.exclude: ["**/*.test.ts", "**/*.d.ts"]`
**Warning signs:** Test files appearing in coverage report, or coverage percentages seeming too high

### Pitfall 6: Global Thresholds vs Per-Package Expectations
**What goes wrong:** User expects 80% threshold per-package, but Vitest applies it globally across all files.
**Why it happens:** Vitest's threshold system is global by default.
**How to avoid:** Understand that the 80% threshold is across all packages combined. A package with 50% coverage can be offset by packages with 95% coverage. To enforce per-package, you'd need `coverage.thresholds[glob-pattern]` syntax.
**Warning signs:** One package having very low coverage but the overall threshold still passing

### Pitfall 7: pnpm Doesn't Forward -- Flags to Scripts Transparently
**What goes wrong:** `pnpm test --coverage` might not pass `--coverage` to vitest correctly.
**Why it happens:** pnpm's flag forwarding behavior requires `--` separator in some cases.
**How to avoid:** Test both `pnpm test --coverage` and `pnpm test -- --coverage` to confirm which works. The dedicated `pnpm test:coverage` script is the safest option.
**Warning signs:** Running `pnpm test --coverage` but coverage not being generated

## Code Examples

### Root vitest.config.ts with Coverage (Verified from official docs)
```typescript
// Source: https://vitest.dev/config/coverage + https://vitest.dev/guide/coverage
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*", "!packages/config"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

### Root package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Running Coverage

```bash
# Full monorepo coverage
pnpm test:coverage

# Alternative via flag
pnpm test --coverage

# Single package (pnpm workspace filter)
pnpm --filter @chillwhales/lsp2 test:coverage

# Note: pnpm --filter runs the script in the filtered package's context,
# but per-package vitest.config.ts uses defineProject which doesn't have
# coverage config. So single-package coverage needs a different approach.
```

### Single-Package Coverage (Claude's Discretion)

There are two approaches for single-package coverage:

**Approach A: Vitest --project flag (RECOMMENDED)**
```bash
pnpm test:coverage -- --project @chillwhales/lsp2
```
This runs the root vitest with coverage enabled but filters to only the named project. The coverage config from root applies. This is the cleanest approach because coverage is configured at root.

**Approach B: pnpm --filter**
```bash
pnpm --filter @chillwhales/lsp2 test:coverage
```
This runs the package's own `test:coverage` script. BUT: the per-package vitest.config.ts uses `defineProject()` which doesn't support coverage. The package would need its own `test:coverage` script pointing to its own config, which duplicates coverage config.

**Recommendation:** Use Approach A (`--project` flag). Wire `test:coverage` script only at the root. Document the `--project` flag for developers.

### Fixed lsp29 Test Fixture (example)
```typescript
// guards.test.ts - validAsset fixture
const validAsset: LSP29EncryptedAsset = {
  LSP29EncryptedAsset: {
    version: "2.0.0",
    id: "test-content-id",
    title: "Test Content",
    description: "A test encrypted asset",
    revision: 1,
    // createdAt REMOVED — not in schema
    images: [], // ADDED — required by schema, empty is valid
    file: {
      type: "image/png",
      name: "test.png",
      size: 1024,
      lastModified: 1704067200000,
      hash: "0xabc123def456",
    },
    encryption: {
      provider: "taco",
      method: "digital-asset-balance",
      params: {
        method: "digital-asset-balance",
        tokenAddress: "0x1234567890123456789012345678901234567890",
        requiredBalance: "1000000000000000000",
      },
      condition: { operator: "and", operands: [] },
      encryptedKey: { messageKit: "0xencrypteddata" },
    },
    chunks: {
      ipfs: { cids: ["QmTest123", "QmTest456"] },
      iv: "base64-iv-string",
      totalSize: 2048,
    },
  },
};
```

## Script Wiring Details

### pnpm Flag Forwarding

pnpm 10.x forwards unknown flags to the underlying script. When you run:
```bash
pnpm test --coverage
```
pnpm runs `vitest run --coverage`. The `--coverage` flag is not consumed by pnpm — it passes through to vitest. This works because `--coverage` is not a pnpm flag.

However, to be explicit and avoid any ambiguity, the dedicated script is preferred:
```json
{
  "test:coverage": "vitest run --coverage"
}
```

### Per-Package test:coverage Script

Per-package `package.json` files currently have:
```json
{
  "test": "vitest run"
}
```

Do NOT add `test:coverage` to per-package configs. Coverage is a root concern. Instead, document the `--project` flag:
```bash
# Run coverage for just one package
pnpm test:coverage -- --project @chillwhales/lsp2
```

### .gitignore Addition

Add to `.gitignore`:
```
coverage/
```

This covers:
- `coverage/` root directory containing all reports
- Vitest cleans coverage directory before each run by default (`coverage.clean: true`)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vitest.workspace.ts` | `test.projects` in vitest.config.ts | Vitest 3.2+ (deprecated workspace) | Already using test.projects — no migration needed |
| Istanbul-based coverage | V8 with AST-aware remapping | Vitest 3.2+ | V8 now has identical accuracy to Istanbul, with better performance |
| `coverage.all` option | `coverage.include` patterns | Vitest convention | Use include patterns to control which files appear in report |

## Open Questions

1. **Global vs per-package threshold enforcement**
   - What we know: Vitest thresholds are global by default. The user said "80% uniform for all 8 packages."
   - What's unclear: Does the user mean 80% globally (aggregate) or 80% per-package? Global is default. Per-package would require `coverage.thresholds[glob-pattern]` entries for each package.
   - Recommendation: Start with global 80% threshold. If the user wants per-package enforcement, it can be added later using glob patterns like `"packages/lsp2/src/**/*.ts": { lines: 80, branches: 80, functions: 80, statements: 80 }`.

2. **Whether `pnpm test --coverage` flag forwarding works in pnpm 10.x**
   - What we know: pnpm generally forwards unknown flags. The dedicated `test:coverage` script is guaranteed to work.
   - What's unclear: Need to verify at implementation time that `pnpm test --coverage` actually passes `--coverage` to vitest (not consumed by pnpm).
   - Recommendation: Test both approaches during implementation. If flag forwarding doesn't work, document `pnpm test -- --coverage` with the `--` separator.

## Sources

### Primary (HIGH confidence)
- Vitest official docs: https://vitest.dev/guide/coverage — Coverage guide (v4.0.17)
- Vitest official docs: https://vitest.dev/config/coverage — Coverage config reference (v4.0.17)
- Vitest official docs: https://vitest.dev/guide/projects — Test Projects guide, confirms coverage is root-only
- Vitest official docs: https://vitest.dev/guide/cli — CLI reference for --coverage flag
- Direct codebase inspection: `packages/lsp29/src/schemas.ts`, `packages/lsp29/src/*.test.ts`
- Direct test execution: `pnpm test` output confirming 10 failures in lsp29

### Secondary (MEDIUM confidence)
- LSP-29-EncryptedAssets.md specification — confirms `images` is required in schema

### Tertiary (LOW confidence)
- pnpm flag forwarding behavior — needs verification at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @vitest/coverage-v8 confirmed from official Vitest docs as default provider
- Architecture: HIGH — root-only coverage confirmed from official docs ("coverage is done for the whole process")
- lsp29 bug analysis: HIGH — confirmed by reading source code and running tests with actual error output
- Script wiring: MEDIUM — pnpm flag forwarding needs verification during implementation
- Pitfalls: HIGH — derived from official documentation warnings and monorepo patterns

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable; Vitest 4.x is current)
