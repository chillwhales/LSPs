# Codebase Structure

**Analysis Date:** 2026-02-27

## Directory Layout

```
LSPs/
├── .editorconfig           # Editor settings (2-space indent, LF, UTF-8)
├── .gitignore              # Ignores node_modules/, dist/, .turbo/, *.tsbuildinfo
├── .planning/              # Planning and analysis documents
├── package.json            # Root workspace config (@chillwhales/lsps)
├── pnpm-lock.yaml          # Lockfile
├── pnpm-workspace.yaml     # Workspace definition: packages/*
├── tsconfig.base.json      # Shared TypeScript config (ES2022, strict, ESNext modules)
├── README.md               # Project overview and package table
└── packages/
    ├── utils/              # @chillwhales/utils — generic helpers
    ├── lsp2/               # @chillwhales/lsp2 — ERC725Y JSON Schema primitives
    ├── lsp3/               # @chillwhales/lsp3 — Universal Profile Metadata
    ├── lsp4/               # @chillwhales/lsp4 — Digital Asset Metadata
    ├── lsp6/               # @chillwhales/lsp6 — Key Manager permissions
    ├── lsp23/              # @chillwhales/lsp23 — Linked Contracts Factory
    ├── lsp29/              # @chillwhales/lsp29 — Encrypted Assets
    └── lsp30/              # @chillwhales/lsp30 — Multi-Storage URI
```

## Package Internal Layout (identical across all 8 packages)

```
packages/<name>/
├── build.config.ts         # unbuild config (ESM + CJS, declarations)
├── package.json            # Package manifest with exports map
├── tsconfig.json           # Extends ../../tsconfig.base.json
├── vitest.config.ts        # Vitest config (globals: true, node environment)
├── src/
│   ├── index.ts            # Barrel file — re-exports all public API
│   ├── constants.ts        # Enums, data key prefixes, contract addresses
│   ├── schemas.ts          # Zod validation schemas (single source of truth)
│   ├── types.ts            # TypeScript types via z.infer<typeof schema>
│   ├── guards.ts           # Runtime type guard functions (isFoo)
│   ├── *.ts                # Domain-specific utilities (encode, decode, etc.)
│   └── *.test.ts           # Co-located test files
└── dist/                   # Build output (git-ignored)
    ├── index.mjs           # ESM bundle
    ├── index.cjs           # CJS bundle
    └── index.d.ts          # Type declarations
```

## Directory Purposes

**`packages/utils/`:**
- Purpose: Generic utility functions with zero LUKSO-specific dependencies
- Contains: String comparison (`isEqual`), numeric validation (`isNumeric`)
- Key files: `src/strings.ts`, `src/numbers.ts`

**`packages/lsp2/`:**
- Purpose: Foundation schemas and VerifiableURI encoding shared across all LSP packages
- Contains: EVM primitive schemas (address, bytes32, bytes), metadata primitive schemas (image, asset, link, verification), VerifiableURI encode/decode/parse, image resolution utilities
- Key files: `src/schemas.ts`, `src/verifiable-uri.ts`, `src/image-utils.ts`, `src/constants.ts`

**`packages/lsp3/`:**
- Purpose: Universal Profile metadata validation and utility functions
- Contains: Profile metadata schema, profile image URL extraction, display name helper
- Key files: `src/schemas.ts`, `src/profile-utils.ts`

**`packages/lsp4/`:**
- Purpose: Digital Asset (LSP7/LSP8 token) metadata validation and utility functions
- Contains: Attribute schema (string/number/boolean discriminated union), asset metadata schema, image URL extraction, display name helper
- Key files: `src/schemas.ts`, `src/asset-utils.ts`

**`packages/lsp6/`:**
- Purpose: Key Manager permission key building and CompactBytesArray parsing
- Contains: Permission name schema from `@lukso/lsp6-contracts`, ERC725Y data key builders, CompactBytesArray/AllowedCalls parsers, allowed call wildcard matching
- Key files: `src/key-builders.ts`, `src/parsers.ts`, `src/schemas.ts`

**`packages/lsp23/`:**
- Purpose: Universal Profile deployment parameter encoding for the LSP23 factory
- Contains: LUKSO mainnet contract addresses, deployment parameter schemas, `generateDeployParams()` function
- Key files: `src/deploy.ts`, `src/constants.ts`, `src/schemas.ts`

**`packages/lsp29/`:**
- Purpose: Encrypted asset metadata standard — schemas, encode/decode, ERC725Y key computation
- Contains: File metadata schema, per-backend chunk schemas, encryption parameter discriminated unions, encrypted asset schema (v2.0.0), data key computation functions, metadata decode
- Key files: `src/schemas.ts`, `src/encode.ts`, `src/decode.ts`, `src/constants.ts`, `src/types.ts`
- Extra files: `LSP-29-EncryptedAssets.md` (specification document)

**`packages/lsp30/`:**
- Purpose: Multi-storage URI standard — encode, decode, and resolve multi-backend content references
- Contains: Backend-specific entry schemas (IPFS, S3, Lumera, Arweave), URI encoding/decoding with verification hash, backend selection and URL resolution
- Key files: `src/schemas.ts`, `src/encode.ts`, `src/decode.ts`, `src/resolve.ts`, `src/constants.ts`
- Extra files: `LSP-30-MultiStorageURI.md` (specification document)

## Key File Locations

**Entry Points:**
- `packages/*/src/index.ts`: Package barrel files — all public exports
- `package.json` (root): Workspace scripts (`build`, `test`, `clean`)

**Configuration:**
- `tsconfig.base.json`: Shared TypeScript config — ES2022 target, ESNext modules, strict mode, bundler resolution
- `packages/*/tsconfig.json`: Per-package TypeScript config — extends base, sets `outDir`/`rootDir`
- `packages/*/build.config.ts`: unbuild config — ESM + CJS dual output, declaration generation
- `packages/*/vitest.config.ts`: Vitest config — globals enabled, node environment
- `pnpm-workspace.yaml`: Workspace definition
- `.editorconfig`: 2-space indentation, LF line endings, UTF-8

**Core Logic (per package pattern):**
- `packages/*/src/schemas.ts`: Zod schemas (the authoritative data definitions)
- `packages/*/src/types.ts`: TypeScript types inferred from schemas
- `packages/*/src/guards.ts`: Runtime type guard functions
- `packages/*/src/constants.ts`: ERC725Y data keys, contract addresses, enums
- `packages/*/src/encode.ts`: Data key computation / URI encoding (lsp29, lsp30)
- `packages/*/src/decode.ts`: URI decoding and validation (lsp29, lsp30)

**Testing:**
- `packages/*/src/*.test.ts`: Co-located test files alongside source

## Naming Conventions

**Files:**
- `kebab-case.ts`: All source files use kebab-case (e.g., `verifiable-uri.ts`, `key-builders.ts`, `asset-utils.ts`, `profile-utils.ts`)
- `*.test.ts`: Test files use same base name with `.test.ts` suffix (e.g., `schemas.test.ts`, `guards.test.ts`)
- `index.ts`: Barrel file in every package `src/`

**Directories:**
- `packages/lsp{N}`: Named after the LUKSO Standard Proposal number
- `packages/utils`: Shared utility package
- `src/`: Source directory in every package
- `dist/`: Build output in every package (git-ignored)

**Exports (TypeScript):**
- Schemas: `camelCase` ending in `Schema` (e.g., `imageSchema`, `lsp3ProfileSchema`, `lsp4MetadataSchema`, `lsp29EncryptedAssetSchema`)
- Types: `PascalCase` (e.g., `Image`, `LSP3Profile`, `LSP4Metadata`, `AllowedCall`, `Lsp30Entry`)
- Guards: `camelCase` starting with `is` (e.g., `isImageSchema`, `isLsp3ProfileSchema`, `isLsp29Asset`, `isLsp30Uri`)
- Functions: `camelCase` verb-first (e.g., `encodeVerifiableUri`, `parseVerifiableUri`, `buildPermissionsKey`, `generateDeployParams`, `selectBackend`, `resolveUrl`)
- Constants: `UPPER_SNAKE_CASE` or `PascalCase` objects (e.g., `VERIFICATION_METHODS`, `LSP29DataKeys`, `IMPLEMENTATIONS`, `LSP30_RESERVED_PREFIX`)

**Package Names:**
- npm scope: `@chillwhales/`
- Pattern: `@chillwhales/lsp{N}` or `@chillwhales/utils`

## Where to Add New Code

**New LSP Package (e.g., lsp31):**
1. Create `packages/lsp31/` with the standard package structure
2. Copy `build.config.ts`, `vitest.config.ts`, `tsconfig.json` from an existing package
3. Create `package.json` following the existing pattern (same exports map, scripts, unbuild/vitest devDeps)
4. Create `src/index.ts` as barrel file
5. Add source files following the pattern: `constants.ts` → `schemas.ts` → `types.ts` → `guards.ts` → domain utilities
6. Co-locate tests as `*.test.ts` alongside source files
7. The package is auto-discovered by pnpm-workspace.yaml (`packages/*`)

**New Schema in Existing Package:**
- Define in `packages/<name>/src/schemas.ts`
- Add inferred type in `packages/<name>/src/types.ts`: `export type Foo = z.infer<typeof fooSchema>;`
- Add type guard in `packages/<name>/src/guards.ts`: `export function isFoo(obj: unknown): obj is Foo { ... }`
- Export from `packages/<name>/src/index.ts` (usually already handled by `export *`)

**New Utility Function:**
- If LUKSO-specific: add to the relevant `packages/lsp*/src/` as a new file (e.g., `my-utils.ts`)
- If generic/shared: add to `packages/utils/src/` and export from `packages/utils/src/index.ts`

**New Encode/Decode Function:**
- Add to `packages/<name>/src/encode.ts` or `packages/<name>/src/decode.ts`
- Follow the existing pattern: parse hex by byte offsets using `viem` utilities, validate with Zod schemas

**New Test:**
- Create `packages/<name>/src/<module>.test.ts` alongside the source file
- Use Vitest with globals enabled (no imports needed for `describe`, `it`, `expect`)

## Special Directories

**`dist/`:**
- Purpose: Build output from unbuild (ESM `.mjs`, CJS `.cjs`, declarations `.d.ts`)
- Generated: Yes (by `pnpm build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Package dependencies (per-package via pnpm workspace hoisting)
- Generated: Yes (by `pnpm install`)
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: Architecture analysis and planning documents
- Generated: No (manually created)
- Committed: Yes

---

*Structure analysis: 2026-02-27*
