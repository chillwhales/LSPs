# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript ^5.9.3 (installed: 5.9.3) - All source code across all packages

**Secondary:**
- JSON - Configuration files, ERC725Y schema definitions

## Runtime

**Environment:**
- Node.js >= 18 (specified in `package.json` `engines` field)

**Package Manager:**
- pnpm 10.30.2 (declared via `packageManager` field in root and all package `package.json` files)
- Lockfile: `pnpm-lock.yaml` present
- Workspace: `pnpm-workspace.yaml` — monorepo with `packages/*` glob

## Frameworks

**Core:**
- viem ^2.0.0 (installed: 2.46.3) - Ethereum/LUKSO blockchain interaction library (hex utils, ABI encoding, keccak256 hashing, address utilities). Peer dependency in `lsp2`, `lsp6`, `lsp23`, `lsp29`, `lsp30`.
- Zod ^3.24.1 (installed: 3.25.76) - Runtime schema validation and type inference. Used in every package except `utils`.

**Testing:**
- Vitest ^4.0.17 (installed: 4.0.18) - Test runner. Config: `vitest.config.ts` per package with `globals: true`, `environment: "node"`.

**Build/Dev:**
- unbuild ^3.6.1 (installed: 3.6.1) - Build tool using Rollup under the hood. Config: `build.config.ts` per package.
  - Outputs: ESM (`.mjs`), CJS (`.cjs`), declarations (`.d.ts`, `.d.ts.map`)
  - Entry: `src/index` in each package
  - `declaration: "compatible"`, `rollup.emitCJS: true`, `failOnWarn: false`

## Key Dependencies

**Critical (Production):**
- `zod` ^3.24.1 - Schema validation backbone; all types inferred via `z.infer<>`. Every package (except `utils`) depends on it.
- `viem` ^2.0.0 - Ethereum primitives (`Hex`, `Address`, `keccak256`, `concat`, `slice`, `encodeFunctionData`, `encodeAbiParameters`). Peer dep for `lsp2`, `lsp6`, `lsp23`, `lsp29`, `lsp30`.

**LUKSO Ecosystem:**
- `@erc725/erc725.js` ^0.28.2 (installed: 0.28.2) - ERC725Y data decoding, schema-based `encodeData`/`decodeData`. Used in `lsp6` and `lsp23`.
- `@lukso/lsp6-contracts` ^0.15.5 (installed: 0.15.5) - LSP6 Key Manager constants (`LSP6DataKeys`, `PERMISSIONS`). Used in `lsp6`.
- `@lukso/universalprofile-contracts` ^0.15.5 (installed: 0.15.5) - Universal Profile ABI (`universalProfileInitAbi`). Used in `lsp23`.

**Dev-only:**
- `@biomejs/biome` ^2.4.4 - Unified linter and formatter (replaces ESLint + Prettier)
- `typescript` ^5.9.3 - Type checking (not used for build output, unbuild handles compilation)
- `unbuild` ^3.6.1 - Build tool
- `vitest` ^4.0.17 - Test runner

## Monorepo Structure

**Workspace Packages:**

| Package | Dependencies (runtime) | Peer Deps |
|---------|----------------------|-----------|
| `@chillwhales/utils` | (none) | (none) |
| `@chillwhales/lsp2` | zod | viem ^2.0.0 |
| `@chillwhales/lsp3` | @chillwhales/lsp2, zod | (none) |
| `@chillwhales/lsp4` | @chillwhales/utils, @chillwhales/lsp2, zod | (none) |
| `@chillwhales/lsp6` | @chillwhales/utils, @erc725/erc725.js, @lukso/lsp6-contracts, zod | viem ^2.0.0 |
| `@chillwhales/lsp23` | @chillwhales/lsp2, @erc725/erc725.js, @lukso/universalprofile-contracts, zod | viem ^2.0.0 |
| `@chillwhales/lsp29` | @chillwhales/lsp2, zod | viem ^2.0.0 |
| `@chillwhales/lsp30` | zod | viem ^2.0.0 |

**Internal dependency graph:**
```
utils ─────────────────────── lsp4
  └─────────────────────────── lsp6
lsp2 ──── lsp3
  ├─────── lsp4
  ├─────── lsp23
  └─────── lsp29
lsp30 (standalone, no internal deps)
```

## Configuration

**TypeScript:**
- Base config: `tsconfig.base.json` — `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`
- Per-package: `packages/*/tsconfig.json` extends base, sets `outDir: ./dist`, `rootDir: ./src`
- Excludes: `node_modules`, `dist`, `**/*.test.ts`

**Build:**
- Per-package: `packages/*/build.config.ts` — identical template across all packages
- Output formats: ESM + CJS with TypeScript declarations
- Entry point: `src/index` (always)

**Linting & Formatting:**
- `biome.json` — Single root config for all packages. Recommended rules, VCS integration, noExplicitAny off for test files.
- Scripts: `pnpm check` (lint+format check), `pnpm check:fix` (auto-fix)

**Editor:**
- `.editorconfig` — Tabs, LF line endings, UTF-8, trim trailing whitespace, final newline

**Package Export Map:**
Each package uses conditional exports in `package.json`:
```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

## Platform Requirements

**Development:**
- Node.js >= 18
- pnpm 10.30.2 (enforced via `packageManager` field)
- No `.env` files required — pure library packages with no runtime secrets

**Production:**
- This is a library monorepo — consumed as npm packages, not deployed as services
- Dual ESM/CJS output for maximum compatibility
- `viem` is a peer dependency for consumers that need blockchain interaction

---

*Stack analysis: 2026-02-27*
