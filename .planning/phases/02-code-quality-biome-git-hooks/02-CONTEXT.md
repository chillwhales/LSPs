# Phase 2: Code Quality — Biome & Git Hooks - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Every file in the monorepo is consistently linted and formatted by Biome from a single root configuration, enforced automatically before each commit via git hooks. Commits follow conventional commit format enforced by commitlint. This phase does NOT add CI enforcement (Phase 5) or any new code quality tools beyond Biome and commitlint.

</domain>

<decisions>
## Implementation Decisions

### Biome rule strictness
- Use Biome's `recommended` rule set only — no nursery or experimental rules
- Auto-fix safe violations (imports, sorting), manually review anything that changes logic — done in one pass before enabling enforcement
- Standard excludes only: `node_modules`, `dist`, build output, lockfiles
- All lint rule violations are errors — no warnings, no ambiguity

### Formatting style
- Tabs for indentation (Biome default)
- 80 character line width
- Double quotes for strings
- Trailing commas everywhere (`all`)
- All four settings are Biome defaults — minimal `biome.json` config needed

### Hook behavior
- Pre-commit hook checks staged files only (not the entire repo)
- Auto-fix formatting issues on commit, block on lint errors — formatting is mechanical, lint errors deserve a human look
- Use simple-git-hooks for hook management (aligned with roadmap decision)
- Use Biome's built-in `--staged` flag instead of lint-staged — no extra dependency
- Hook script must `git add` fixed files after Biome auto-formats to re-stage them

### Commit message conventions
- Standard conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`
- Scopes are optional but encouraged — no required scope, no allowed-list enforcement
- Use `@commitlint/config-conventional` preset with zero custom overrides
- Enforce via commit-msg hook (simple-git-hooks) locally AND CI (Phase 5) as safety net

### Claude's Discretion
- Exact Biome rule overrides if specific recommended rules conflict with the codebase
- Hook script implementation details (shell commands, error messages)
- Order of operations for the initial format/lint fix commit
- commitlint configuration file format (`.commitlintrc`, `commitlint.config.js`, etc.)

</decisions>

<specifics>
## Specific Ideas

- Formatting settings are all Biome defaults — the goal is minimal `biome.json` config, not a heavily customized setup
- The initial cleanup should be auto-fix safe + manual review, done as one clean pass (not incremental suppression)
- No lint-staged — Biome's `--staged` flag plus a `git add` line in the hook script handles staged file filtering

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-code-quality-biome-git-hooks*
*Context gathered: 2026-02-27*
