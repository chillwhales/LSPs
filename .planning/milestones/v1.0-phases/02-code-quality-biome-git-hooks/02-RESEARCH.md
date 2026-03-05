# Phase 2: Code Quality — Biome & Git Hooks - Research

**Researched:** 2026-02-27
**Domain:** Linting, formatting, git hooks, commit conventions (pnpm monorepo)
**Confidence:** HIGH

## Summary

This phase sets up Biome for linting/formatting, simple-git-hooks for pre-commit/commit-msg hooks, and commitlint for conventional commit enforcement in a pnpm monorepo with 8 packages. Research confirms all three tools are well-suited for this use case.

Biome v2 has excellent monorepo support with a single root `biome.json`. The `--staged` flag works with `--write` for auto-formatting staged files, and `git update-index --again` re-stages fixed files. The `formatter.useEditorconfig` option exists but should NOT be used — instead, update `.editorconfig` to match Biome's tab-based defaults to avoid conflicting sources of truth. simple-git-hooks v2.13.x is configured via `package.json` and requires running `npx simple-git-hooks` after config changes. commitlint with `@commitlint/config-conventional` provides the exact conventional commit types requested.

**Primary recommendation:** Use Biome v2 with a minimal `biome.json` (all formatting defaults match the locked decisions), configure simple-git-hooks in root `package.json` with a `postinstall` script via pnpm, and use `commitlint.config.js` with ES module export.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Biome's `recommended` rule set only — no nursery or experimental rules
- Auto-fix safe violations (imports, sorting), manually review anything that changes logic — done in one pass before enabling enforcement
- Standard excludes only: `node_modules`, `dist`, build output, lockfiles
- All lint rule violations are errors — no warnings, no ambiguity
- Tabs for indentation (Biome default)
- 80 character line width
- Double quotes for strings
- Trailing commas everywhere (`all`)
- All four settings are Biome defaults — minimal `biome.json` config needed
- Pre-commit hook checks staged files only (not the entire repo)
- Auto-fix formatting issues on commit, block on lint errors — formatting is mechanical, lint errors deserve a human look
- Use simple-git-hooks for hook management (aligned with roadmap decision)
- Use Biome's built-in `--staged` flag instead of lint-staged — no extra dependency
- Hook script must `git add` fixed files after Biome auto-formats to re-stage them
- Standard conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`
- Scopes are optional but encouraged — no required scope, no allowed-list enforcement
- Use `@commitlint/config-conventional` preset with zero custom overrides
- Enforce via commit-msg hook (simple-git-hooks) locally AND CI (Phase 5) as safety net

### Claude's Discretion
- Exact Biome rule overrides if specific recommended rules conflict with the codebase
- Hook script implementation details (shell commands, error messages)
- Order of operations for the initial format/lint fix commit
- commitlint configuration file format (`.commitlintrc`, `commitlint.config.js`, etc.)

### Deferred Ideas (OUT OF SCOPE)
- CI enforcement (Phase 5)
- Any new code quality tools beyond Biome and commitlint
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@biomejs/biome` | ^2.4.4 | Linting + formatting | Single tool replaces ESLint + Prettier; native monorepo support in v2 |
| `simple-git-hooks` | ^2.13.1 | Git hook management | Zero-dependency, 10.9kB, ideal for small-to-medium projects |
| `@commitlint/cli` | latest | Commit message linting | Standard tool for conventional commit enforcement |
| `@commitlint/config-conventional` | latest | Commitlint preset | Provides the exact conventional commit type set requested |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | — | `--staged` replaces lint-staged; no extra dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| simple-git-hooks | husky v9 | Husky needs `.husky/` directory + `prepare` script; simple-git-hooks is simpler for single-command hooks |
| simple-git-hooks | lefthook | More powerful but overkill for 2 hooks |
| Biome `--staged` | lint-staged | lint-staged gives per-file-type commands; unnecessary here since Biome handles all file types natively |

**Installation:**
```bash
pnpm add -D @biomejs/biome simple-git-hooks @commitlint/cli @commitlint/config-conventional
```

## Architecture Patterns

### Recommended Project Structure
```
/                           # Monorepo root
├── biome.json              # Single root Biome config for ALL packages
├── commitlint.config.js    # commitlint config (ESM export)
├── .editorconfig           # Updated: tabs to match Biome
├── package.json            # simple-git-hooks config + scripts
└── packages/
    ├── config/             # No per-package biome.json needed
    ├── lsp2/
    ├── lsp3/
    ├── lsp4/
    ├── lsp6/
    ├── lsp23/
    ├── lsp29/
    ├── lsp30/
    └── utils/
```

### Pattern 1: Single Root Biome Configuration (Monorepo)
**What:** One `biome.json` at the repo root governs all packages. No per-package configs.
**When to use:** When all packages share the same code quality standards (this project).
**Example:**
```json
// Source: https://biomejs.dev/guides/big-projects/#monorepo
// Source: https://biomejs.dev/reference/configuration/
{
  "$schema": "https://biomejs.dev/schemas/2.4.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["**", "!!**/dist"]
  },
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

**Key insight:** All four formatting preferences (tabs, 80 width, double quotes, trailing commas `all`) are Biome's defaults. The `biome.json` needs NO explicit formatter overrides — leaving them out means Biome uses its defaults, which exactly match the locked decisions.

### Pattern 2: Pre-commit Hook with Staged Files
**What:** Use `biome check --write --staged` to format staged files, then `git update-index --again` to re-stage.
**When to use:** Pre-commit hook for auto-formatting.
**Example:**
```bash
#!/bin/sh
# Source: https://biomejs.dev/recipes/git-hooks/#shell-script
set -eu

# Fail if staged files have unstaged changes (partial staging conflict)
if git status --short | grep --quiet '^MM'; then
  printf '%s\n' "ERROR: Some staged files have unstaged changes" >&2
  exit 1;
fi

# Auto-fix formatting + safe lint fixes on staged files
npx @biomejs/biome check --write --staged --files-ignore-unknown=true --no-errors-on-unmatched

# Re-stage files that were auto-formatted
git update-index --again
```

### Pattern 3: Two-Step Hook — Format Then Lint Check
**What:** The user wants auto-fix for formatting but blocking on lint errors. Biome's `check --write` does both formatting and safe lint fixes. Unsafe lint fixes are NOT applied (no `--unsafe` flag). If lint errors remain after safe fixes, the hook exits non-zero and blocks the commit.
**When to use:** When formatting should auto-fix but lint errors should block.

**Important nuance:** `biome check --write` applies formatting AND safe lint fixes. It returns a non-zero exit code if there are remaining lint errors that couldn't be auto-fixed. This matches the locked decision exactly: formatting is auto-fixed, lint errors that need human attention block the commit.

### Anti-Patterns to Avoid
- **Per-package biome.json files:** Creates maintenance overhead. All packages share the same standards; use a single root config.
- **Using `formatter.useEditorconfig: true`:** Creates two sources of truth. Better to update `.editorconfig` to match Biome and keep Biome as the authority.
- **Using lint-staged alongside Biome's `--staged`:** Redundant dependency. Biome's `--staged` flag handles everything.
- **Setting formatting options explicitly in biome.json when they match defaults:** Adds noise. Only set options that deviate from defaults.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Staged file detection | Custom `git diff --cached` scripts | `biome check --staged` | Biome natively understands git staging area |
| Re-staging after format | Complex git stash/unstash workflows | `git update-index --again` | Simple one-liner that re-adds already-tracked changed files |
| Commit message parsing | Regex-based commit msg validation | commitlint + config-conventional | Handles edge cases (merge commits, reverts, scoped types) |
| Hook management | Manual `.git/hooks/` scripts | simple-git-hooks | Keeps hooks in version control via package.json |
| Import sorting | Custom import organization | Biome's built-in import sorting (part of `check`) | Biome's `assist` handles import organization automatically |

**Key insight:** Biome's `check` command combines formatting, linting, AND import sorting in a single pass. No need for separate tools or multiple hook steps.

## Common Pitfalls

### Pitfall 1: Partial Staging Conflicts
**What goes wrong:** When a file is partially staged (some changes staged, some unstaged), `--write` modifies the working tree version but the staged version is what gets committed. After auto-format, `git update-index --again` would stage ALL changes including the unstaged ones.
**Why it happens:** Git's index (staging area) and working tree can diverge. `--write` modifies the working tree.
**How to avoid:** Check for partially staged files (`git status --short | grep '^MM'`) and abort if found. The Biome docs recommend this exact pattern.
**Warning signs:** Files showing `MM` in `git status --short` output.

### Pitfall 2: .editorconfig Conflict with Biome Tabs
**What goes wrong:** Current `.editorconfig` specifies `indent_style = space` and `indent_size = 2`. Biome defaults to tabs. If `.editorconfig` is left unchanged AND an IDE respects `.editorconfig`, developers will write code with spaces that Biome immediately reformats to tabs.
**Why it happens:** `.editorconfig` and `biome.json` are separate systems that don't communicate.
**How to avoid:** Update `.editorconfig` to `indent_style = tab` to match Biome's default. Keep `end_of_line = lf`, `charset = utf-8`, `trim_trailing_whitespace = true`, `insert_final_newline = true` (all compatible with Biome defaults).
**Warning signs:** Every commit shows indentation changes from spaces to tabs.

### Pitfall 3: simple-git-hooks Not Activated After Clone/Install
**What goes wrong:** simple-git-hooks configs live in `package.json` but aren't applied to `.git/hooks/` until `npx simple-git-hooks` is explicitly run. New clones won't have hooks until this runs.
**Why it happens:** Git hooks live in `.git/hooks/` which is not version controlled. simple-git-hooks needs to be invoked to write the hook files.
**How to avoid:** Add a `"prepare": "simple-git-hooks"` script in root `package.json`. pnpm runs `prepare` after `pnpm install`. This auto-installs hooks on fresh clones.
**Warning signs:** Contributors can push commits that don't pass lint/format checks.

**IMPORTANT pnpm caveat:** In pnpm, `prepare` scripts in the root `package.json` run correctly after `pnpm install`. However, simple-git-hooks must be run from the root (not from a package). This works because the `prepare` script runs in the repo root context.

### Pitfall 4: Forgetting to Run `npx simple-git-hooks` After Config Changes
**What goes wrong:** You update the hook command in `package.json` but the actual `.git/hooks/` files still contain the old command.
**Why it happens:** simple-git-hooks requires manual re-execution after config changes. It does NOT watch for changes.
**How to avoid:** Always run `npx simple-git-hooks` after changing hook configuration. Document this in contributing guidelines. The `prepare` script handles fresh installs but NOT config updates.
**Warning signs:** Hook behavior doesn't match the `package.json` configuration.

### Pitfall 5: Large Initial Formatting Diff
**What goes wrong:** Switching from 2-space indent to tabs across all files creates a massive diff that's hard to review and may break `git blame`.
**Why it happens:** Every `.ts`, `.json`, and config file changes indentation.
**How to avoid:** 
1. Do the formatting change in a dedicated commit with a clear message like `style: apply biome formatting to entire codebase`
2. Add a `.git-blame-ignore-revs` file with that commit hash so `git blame` skips it
3. Configure git: `git config blame.ignoreRevsFile .git-blame-ignore-revs`
**Warning signs:** `git blame` showing the formatting commit for every line.

### Pitfall 6: commitlint Fails to Load Config with ESM
**What goes wrong:** commitlint config file uses `export default` but Node.js treats it as CJS, failing with a syntax error.
**Why it happens:** The project's `package.json` does not have `"type": "module"`, so `.js` files default to CJS.
**How to avoid:** Either:
- Use `commitlint.config.mjs` (explicit ESM) — **recommended**
- Or use `commitlint.config.cjs` with `module.exports`
- Or add `"type": "module"` to `package.json` (may affect other tooling)

**Recommendation:** Use `commitlint.config.mjs` since the project doesn't have `"type": "module"` in its root `package.json`.

### Pitfall 7: Biome Checking Non-Source Files
**What goes wrong:** Biome tries to lint/format lockfiles, build output, or `node_modules`.
**Why it happens:** Without proper excludes, Biome processes everything.
**How to avoid:** 
- `node_modules` is automatically excluded by Biome (always ignored regardless of config)
- Use `files.includes` with force-ignore syntax `!!**/dist` to exclude build output from the scanner entirely
- Enable `vcs.useIgnoreFile: true` to respect `.gitignore` patterns (which already exclude `node_modules/`, `dist/`, `*.tsbuildinfo`)
**Warning signs:** Biome errors on lockfile parsing or very slow runs.

## Code Examples

### biome.json — Minimal Root Configuration
```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["**", "!!**/dist"]
  },
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

**Why so minimal:** All four locked formatting preferences (tabs, 80 width, double quotes, trailing commas `all`) are Biome v2 defaults. `linter.rules.recommended: true` is also the default but worth being explicit about since it's a key decision. The `vcs` integration respects `.gitignore` so `node_modules`, `dist`, `.tsbuildinfo` etc are automatically excluded.

### package.json — Hook Configuration
```json
{
  "scripts": {
    "check": "biome check",
    "check:fix": "biome check --write",
    "prepare": "simple-git-hooks"
  },
  "simple-git-hooks": {
    "pre-commit": "npx @biomejs/biome check --write --staged --files-ignore-unknown=true --no-errors-on-unmatched && git update-index --again",
    "commit-msg": "npx commitlint --edit $1"
  }
}
```

### Pre-commit Hook Script (Alternative: Shell Script)
If the one-liner in package.json becomes too complex, use a shell script:

```bash
#!/bin/sh
# .githooks/pre-commit (referenced from simple-git-hooks config)
set -eu

# Abort if partially staged files exist (prevents staging unstaged changes)
if git status --short | grep --quiet '^MM'; then
  echo "ERROR: Partially staged files detected. Please stage all changes or stash unstaged changes." >&2
  exit 1
fi

# Format + safe lint fixes on staged files only
npx @biomejs/biome check --write --staged --files-ignore-unknown=true --no-errors-on-unmatched

# Re-stage files modified by Biome
git update-index --again
```

### commitlint.config.mjs
```javascript
// Source: https://commitlint.js.org/reference/configuration.html
export default { extends: ["@commitlint/config-conventional"] };
```

This provides the standard conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`. No custom overrides needed — the preset matches the locked decisions exactly.

### Updated .editorconfig
```ini
root = true

[*]
indent_style = tab
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

Note: `indent_size` is removed since it's not applicable when `indent_style = tab`. Some editors interpret `tab_width` differently, but Biome is the authority for formatting.

### .git-blame-ignore-revs
```
# Biome initial formatting (spaces → tabs, import sorting)
<commit-hash-here>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint + Prettier (separate tools) | Biome (unified linter + formatter) | Biome v1 (2024), v2 (2025) | Single config, 10-100x faster, no config conflicts |
| Biome v1 `ignores` array in `files` | Biome v2 `files.includes` with negation/force-ignore (`!!`) | Biome v2 (2025) | More flexible exclude patterns, `files.ignore` is gone |
| lint-staged for staged file handling | Biome's `--staged` flag | Biome v1.x | Eliminates lint-staged dependency entirely |
| husky (most common) | simple-git-hooks (lighter) | N/A (both current) | simple-git-hooks is zero-dep, simpler for few hooks |
| Biome v1 monorepo: manual config per package | Biome v2 monorepo: `"extends": "//"` for nested configs | Biome v2 (2025) | Not needed here (single root config suffices) |

**Deprecated/outdated:**
- `files.ignore` in biome.json: Replaced by negated patterns in `files.includes` in Biome v2
- `files.experimentalScannerIgnores`: Deprecated, use `!!` force-ignore patterns in `files.includes`
- Biome v1 `organizeImports` top-level config: Now part of `assist` in v2

## Important Version Notes

### Biome v2 vs v1 Differences (Relevant to This Phase)
- **Config schema changed:** v2 uses `files.includes` instead of `files.ignore`
- **Monorepo support:** v2 has native monorepo support with `"extends": "//"` and `"root": false`
- **Import sorting:** Now under `assist.actions` (but `check` still handles it automatically)
- **`recommended: true` is the default** for both linter rules and assist actions

### Biome `--staged` Behavior Details
- `--staged` processes only files in the git staging area (index)
- Combined with `--write`, it modifies the working tree copies of staged files
- After `--write` modifies files, you MUST re-stage them (`git update-index --again`)
- `--staged` is NOT available with `biome ci` (CI should use `--changed` instead)
- Biome requires `vcs.enabled: true` and `vcs.clientKind: "git"` for `--staged` to work

### simple-git-hooks in pnpm Monorepo
- Configure in **root** `package.json` only (hooks are repo-level, not package-level)
- Use `"prepare": "simple-git-hooks"` to auto-install hooks on `pnpm install`
- After changing hook configuration, manually run `npx simple-git-hooks`
- The `preserveUnused` option can be used to keep hooks not defined in config
- Only one command per hook — for complex logic, reference a shell script

### commitlint with commit-msg Hook
- The commit-msg hook receives the path to the commit message file as `$1`
- `commitlint --edit $1` reads the commit message from that file
- `@commitlint/config-conventional` provides all 11 standard types
- Scopes are optional by default in the conventional config (no `scope-enum` rule)
- The conventional config allows any scope — no allowed-list enforcement

## Open Questions

1. **Will any Biome recommended rules conflict with the existing codebase?**
   - What we know: The codebase uses Zod, viem, and standard TypeScript patterns. Most recommended rules should be fine.
   - What's unclear: Until Biome is actually run on the codebase, we can't know which rules will fire.
   - Recommendation: Run `biome check .` first without `--write` to see all violations. Fix safe issues in a formatting commit, then address any lint violations. Use rule-level overrides in `biome.json` only if specific recommended rules are genuinely incompatible.

2. **JSON files with comments (tsconfig.json, etc.)?**
   - What we know: Biome can parse JSONC (JSON with comments) for files with `.jsonc` extension. `tsconfig.json` files are automatically recognized as JSONC by Biome.
   - What's unclear: Whether any `.json` files in the repo contain comments that would cause parse errors.
   - Recommendation: Biome handles `tsconfig.json` as JSONC by default. If other `.json` files have comments, use `json.parser.allowComments: true` or rename them to `.jsonc`.

## Sources

### Primary (HIGH confidence)
- Biome official docs — Configuration reference (https://biomejs.dev/reference/configuration/)
- Biome official docs — VCS integration (https://biomejs.dev/guides/integrate-in-vcs/)
- Biome official docs — Big projects / Monorepo (https://biomejs.dev/guides/big-projects/)
- Biome official docs — Git Hooks recipe (https://biomejs.dev/recipes/git-hooks/)
- Biome official docs — CLI reference (https://biomejs.dev/reference/cli/)
- Biome GitHub releases — v2.4.4 latest (https://github.com/biomejs/biome/releases/tag/@biomejs/biome@2.4.4)
- simple-git-hooks README (https://github.com/toplenboren/simple-git-hooks)
- commitlint official docs — Getting started (https://commitlint.js.org/guides/getting-started.html)
- commitlint official docs — Configuration (https://commitlint.js.org/reference/configuration.html)
- commitlint official docs — Local setup (https://commitlint.js.org/guides/local-setup.html)

### Secondary (MEDIUM confidence)
- None needed — all findings verified with primary sources

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All tools verified via official docs and GitHub releases
- Architecture: HIGH — Biome v2 monorepo pattern documented officially; single root config confirmed
- Biome defaults: HIGH — Verified all four formatting defaults (tab, 80, double quote, trailing comma all) against official configuration reference
- Hook behavior: HIGH — `--staged` + `--write` + `git update-index --again` pattern from official Biome Git Hooks recipe
- commitlint config: HIGH — ESM config format and config-conventional preset verified from official docs
- Pitfalls: HIGH — Partial staging, editorconfig conflict, and ESM issues all documented in official sources

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — all three tools are stable)
