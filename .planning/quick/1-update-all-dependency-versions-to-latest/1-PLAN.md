---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - packages/*/package.json
autonomous: true
requirements: [QUICK-1]

must_haves:
  truths:
    - "All dependencies (root, catalog, workspace packages) are at their latest versions"
    - "pnpm install resolves cleanly with no peer dependency errors"
    - "All packages build successfully"
    - "All tests pass"
  artifacts:
    - path: "pnpm-workspace.yaml"
      provides: "Updated catalog entries with latest versions"
    - path: "package.json"
      provides: "Updated root devDependencies with latest versions"
    - path: "pnpm-lock.yaml"
      provides: "Regenerated lockfile reflecting all updates"
  key_links:
    - from: "pnpm-workspace.yaml (catalog)"
      to: "packages/*/package.json (catalog: references)"
      via: "pnpm catalog protocol"
      pattern: "catalog:"
---

<objective>
Update all dependency versions across the monorepo to their latest releases.

Purpose: Keep the project current with latest bug fixes, security patches, and features across all 16 packages and the root workspace.
Output: Updated package.json files, pnpm-workspace.yaml catalog, and regenerated lockfile.
</objective>

<execution_context>
@/home/coder/.config/Claude/get-shit-done/workflows/execute-plan.md
@/home/coder/.config/Claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@package.json
@pnpm-workspace.yaml
@packages/config/package.json

This is a pnpm monorepo with 16 packages under `packages/*`. Dependencies are managed via:
- **Root `package.json`**: devDependencies for tooling (biome, vitest, knip, sherif, etc.)
- **`pnpm-workspace.yaml` catalog**: shared version pins (typescript, unbuild, vitest, zod, viem, @lukso/*, @erc725/erc725.js)
- **Package-level `package.json`**: mix of `catalog:` references and `workspace:*` links

Key constraint: Vitest v4 has known ESM compat issues on Node <22 — the project already requires `node >= 22`, so this shouldn't block updates. But watch for any Vitest major version jump (v4 → v5) that could change config format.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update all dependencies to latest versions</name>
  <files>package.json, pnpm-workspace.yaml, pnpm-lock.yaml, packages/*/package.json</files>
  <action>
Update all dependencies across the monorepo using pnpm's built-in update commands:

1. **Update catalog entries** in `pnpm-workspace.yaml`:
   Run `pnpm up --latest -r` to update all workspace package dependencies to latest.
   Then manually check `pnpm-workspace.yaml` catalog entries — `pnpm up` may not update catalog versions automatically. For each catalog entry, look up the latest version on npm and update the version range:
   - `typescript`, `unbuild`, `vitest`, `zod`, `viem`
   - All `@lukso/*` packages
   - `@erc725/erc725.js`
   
   Use `npm view <package> version` to check latest for each catalog entry.

2. **Update root devDependencies** in `package.json`:
   Run `pnpm up --latest -w` to update root workspace dependencies.
   Verify these are updated: `@arethetypeswrong/cli`, `@biomejs/biome`, `@changesets/*`, `@commitlint/*`, `@vitest/coverage-v8`, `knip`, `madge`, `only-allow`, `publint`, `sherif`, `simple-git-hooks`.

3. **Update non-catalog package dependencies**:
   Check each `packages/*/package.json` for any non-catalog, non-workspace deps (e.g., `@types/node` in `packages/utils`). Update those with `pnpm up --latest --filter <package>`.

4. **Regenerate lockfile**: Run `pnpm install` to regenerate `pnpm-lock.yaml` with all updates.

5. **Check for peer dependency warnings**: Review `pnpm install` output for any peer dep conflicts. Resolve by adjusting version ranges if needed.

Important: Do NOT change `workspace:*` references — those are internal monorepo links. Only update version numbers for external packages.
  </action>
  <verify>
    <automated>pnpm install --frozen-lockfile 2>&1 | tail -5</automated>
  </verify>
  <done>All dependency version ranges in package.json, pnpm-workspace.yaml catalog, and sub-package package.json files point to the latest available versions. pnpm install resolves cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Verify build, lint, and tests pass with updated dependencies</name>
  <files>none (verification only)</files>
  <action>
Run the full validation suite to confirm nothing breaks with the updated dependencies:

1. **Build all packages**: `pnpm build` — all 16 packages must build via unbuild without errors.

2. **Run linting**: `pnpm check:lint` — biome check must pass (if biome had a major update, config format may need adjusting in `biome.json`).

3. **Run tests**: `pnpm test` — all vitest tests must pass.

4. **Run monorepo checks**: `pnpm sherif` and `pnpm knip` — no new warnings from updated tooling.

5. **Run typecheck**: `pnpm typecheck` — TypeScript compilation must succeed.

If any step fails due to breaking changes in updated dependencies:
- For biome config changes: update `biome.json` to match new schema
- For vitest config changes: update `vitest.config.ts` and `packages/config/src/vitest.ts`
- For TypeScript breaking changes: fix type errors in affected packages
- For @lukso/* contract interface changes: update affected imports/types in packages that use them
- For unbuild config changes: update `packages/config/src/build.ts`

Fix issues iteratively until all checks pass.
  </action>
  <verify>
    <automated>pnpm build && pnpm check:lint && pnpm test && pnpm sherif && pnpm typecheck</automated>
  </verify>
  <done>All packages build, lint passes, all tests pass, sherif/knip clean, typecheck passes. The monorepo is fully functional with updated dependencies.</done>
</task>

</tasks>

<verification>
- `pnpm install` resolves without errors or peer dep warnings
- `pnpm build` succeeds for all packages
- `pnpm test` passes all test suites
- `pnpm check:lint` passes
- `pnpm sherif` passes
- `pnpm typecheck` passes
- No `catalog:` references point to outdated versions
</verification>

<success_criteria>
All dependency versions across root package.json, pnpm-workspace.yaml catalog, and all 16 sub-package package.json files are updated to their latest available versions. The full CI validation suite (build, lint, test, typecheck, sherif) passes without errors.
</success_criteria>

<output>
After completion, create `.planning/quick/1-update-all-dependency-versions-to-latest/1-SUMMARY.md`
</output>
