# Architecture

**Analysis Date:** 2026-02-27

## Pattern Overview

**Overall:** Monorepo of independent, schema-driven library packages

**Key Characteristics:**
- pnpm workspace monorepo with 8 independently publishable npm packages
- Each package follows an identical internal structure: constants → schemas → types → guards → utilities
- Zod schemas are the single source of truth for both runtime validation and TypeScript types (via `z.infer`)
- Pure function design — no classes, no stateful singletons, no side effects
- Packages form a layered dependency graph: `utils` and `lsp2` are foundational; higher-numbered LSPs depend on them

## Layers

**Foundation Layer (`@chillwhales/utils`, `@chillwhales/lsp2`):**
- Purpose: Shared primitives consumed by all other packages
- Location: `packages/utils/src/`, `packages/lsp2/src/`
- Contains:
  - `utils`: Generic helpers (`isEqual`, `isNumeric`)
  - `lsp2`: EVM-primitive Zod schemas (`addressSchema`, `bytes32Schema`, `bytesSchema`), shared metadata schemas (`imageSchema`, `assetSchema`, `linkSchema`, `verificationSchema`), VerifiableURI encode/decode, image utilities
- Depends on: `viem` (peer), `zod`
- Used by: All other LSP packages

**Metadata Layer (`@chillwhales/lsp3`, `@chillwhales/lsp4`):**
- Purpose: Domain-specific metadata schemas and utility functions for Universal Profiles and Digital Assets
- Location: `packages/lsp3/src/`, `packages/lsp4/src/`
- Contains: Profile/asset Zod schemas, type guards, display name helpers, image URL extraction
- Depends on: `@chillwhales/lsp2`, `@chillwhales/utils` (lsp4 only), `zod`
- Used by: Consumer applications

**Permission Layer (`@chillwhales/lsp6`):**
- Purpose: ERC725Y key building and CompactBytesArray parsing for LSP6 Key Manager permissions
- Location: `packages/lsp6/src/`
- Contains: Permission schemas, key builders (`buildPermissionsKey`, `buildAllowedCallsKey`), parsers (`parseCompactBytesArray`, `parseAllowedCalls`, `allowedCallMatches`)
- Depends on: `@chillwhales/utils`, `@erc725/erc725.js`, `@lukso/lsp6-contracts`, `viem` (peer), `zod`
- Used by: Consumer applications

**Deployment Layer (`@chillwhales/lsp23`):**
- Purpose: Encoding deployment parameters for Universal Profile creation via LSP23 Linked Contracts Factory
- Location: `packages/lsp23/src/`
- Contains: Mainnet contract address constants, deployment parameter schemas, `generateDeployParams()` function
- Depends on: `@chillwhales/lsp2`, `@erc725/erc725.js`, `@lukso/universalprofile-contracts`, `viem` (peer), `zod`
- Used by: Consumer applications

**Encrypted Content Layer (`@chillwhales/lsp29`):**
- Purpose: Encrypted asset metadata — schemas, types, encode/decode for on-chain encrypted content references
- Location: `packages/lsp29/src/`
- Contains: ERC725Y data key computation, encryption parameter schemas (provider-first architecture), asset metadata schema, encode/decode functions
- Depends on: `@chillwhales/lsp2`, `viem` (peer), `zod`
- Used by: Consumer applications

**Multi-Storage Layer (`@chillwhales/lsp30`):**
- Purpose: Multi-backend content URI encoding/decoding/resolution
- Location: `packages/lsp30/src/`
- Contains: Backend-specific entry schemas (IPFS, S3, Lumera, Arweave), URI encoding/decoding, backend selection/URL resolution
- Depends on: `viem` (peer), `zod`
- Used by: Consumer applications

## Dependency Graph

```
                  ┌────────────┐
                  │   utils     │
                  └──────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌───▼────┐    │
         │  lsp4  │ │  lsp6  │    │
         └────┬───┘ └────────┘    │
              │                    │
         ┌────▼───┐               │
         │  lsp2  │◄──────────────┘
         └────┬───┘
              │
    ┌─────────┼──────────┬──────────┐
    │         │          │          │
┌───▼──┐ ┌───▼───┐ ┌───▼────┐    │
│ lsp3 │ │ lsp23 │ │ lsp29  │    │
└──────┘ └───────┘ └────────┘    │
                                  │
                           ┌──────▼──┐
                           │  lsp30  │ (standalone, no workspace deps)
                           └─────────┘
```

## Data Flow

**Schema Validation Flow (all packages):**

1. Raw data enters as `unknown`
2. Zod schema validates structure via `.safeParse()` (guards) or `.parse()` (decode functions)
3. On success: returns typed data via `z.infer<typeof schema>`
4. On failure: returns `{ success: false }` (guards) or throws `ZodError` (parse)

**VerifiableURI Encode Flow (`@chillwhales/lsp2`):**

1. Caller provides JSON data + IPFS URL → `encodeVerifiableUri(data, ipfsUrl)`
2. JSON is stringified and hashed with keccak256
3. Reserved prefix + method ID + hash length + hash + URL hex are concatenated
4. Returns `Hex` string for ERC725Y `setData`

**VerifiableURI Decode Flow (`@chillwhales/lsp2`):**

1. Raw hex from ERC725Y `getData` → `parseVerifiableUri(value)`
2. Prefix validated, method/hash/URL extracted by byte offsets
3. If content verification needed → `decodeVerifiableUri(value, jsonContent, schema?)`
4. Content hash recomputed and compared against embedded hash
5. Optional Zod schema validation on parsed JSON

**LSP30 Multi-Storage URI Flow (`@chillwhales/lsp30`):**

1. Encode: entries array + verification hash → `encodeLsp30Uri(entries, hash)` → hex with `0x0030` prefix
2. Parse: hex value → `parseLsp30Uri(value)` → `{ verificationMethod, verificationData, entries }`
3. Decode+Verify: hex + content bytes → `decodeLsp30Uri(value, content)` → verified entries
4. Resolve: entries + preference → `selectBackend(entries, pref)` → ordered entries → `resolveUrl(entry)` → URL string

**LSP23 Deployment Flow (`@chillwhales/lsp23`):**

1. Caller provides salt + controller address → `generateDeployParams({ salt, controllerAddress })`
2. Universal Profile init struct built with implementation address and `initialize()` calldata
3. Key Manager init struct built with implementation address and function selector
4. ERC725 data keys/values encoded for permissions (URD + controller) via `@erc725/erc725.js`
5. All encoded as ABI parameters → returns `DeployParams` for factory contract call

**State Management:**
- No runtime state — all packages export pure functions
- State lives in the consumer application and on-chain (ERC725Y storage)

## Key Abstractions

**Zod Schemas (core abstraction across all packages):**
- Purpose: Define data structure, provide runtime validation, and generate TypeScript types
- Examples: `packages/lsp2/src/schemas.ts`, `packages/lsp3/src/schemas.ts`, `packages/lsp4/src/schemas.ts`, `packages/lsp29/src/schemas.ts`, `packages/lsp30/src/schemas.ts`
- Pattern: Schema defined → type inferred via `z.infer<typeof schema>` in `types.ts` → guard function wraps `.safeParse()` in `guards.ts`

**Type Guards (runtime type narrowing):**
- Purpose: Boolean type predicates for safe runtime type checking
- Examples: `packages/lsp2/src/guards.ts`, `packages/lsp3/src/guards.ts`, `packages/lsp29/src/guards.ts`, `packages/lsp30/src/guards.ts`
- Pattern: `function isXxx(obj: unknown): obj is T { return schema.safeParse(obj).success; }`

**Encode/Decode Functions (byte-level serialization):**
- Purpose: Convert between structured TypeScript objects and on-chain hex representations
- Examples: `packages/lsp2/src/verifiable-uri.ts`, `packages/lsp29/src/encode.ts`, `packages/lsp29/src/decode.ts`, `packages/lsp30/src/encode.ts`, `packages/lsp30/src/decode.ts`
- Pattern: Pure functions operating on `Hex` values from `viem`, using `concat`/`slice`/`keccak256` for byte manipulation

**Constants (ERC725Y data keys and contract addresses):**
- Purpose: Canonical references for on-chain key construction and contract interaction
- Examples: `packages/lsp2/src/constants.ts`, `packages/lsp23/src/constants.ts`, `packages/lsp29/src/constants.ts`, `packages/lsp30/src/constants.ts`
- Pattern: `as const` typed string literals and enums

## Entry Points

**Package Entry Points (all identical pattern):**
- Location: `packages/*/src/index.ts`
- Triggers: npm `import` / `require` via `exports` field in `package.json`
- Responsibilities: Barrel file re-exporting all public API from sibling modules
- Built output: `packages/*/dist/index.mjs` (ESM), `packages/*/dist/index.cjs` (CJS), `packages/*/dist/index.d.ts` (types)

**Root Workspace Scripts:**
- Location: `package.json` (root)
- `pnpm build` → runs `unbuild` in all packages
- `pnpm test` → runs `vitest run` in all packages
- `pnpm clean` → removes `dist/` in all packages

## Error Handling

**Strategy:** Fail-fast with descriptive errors for encode/decode; graceful empty-return for parsers

**Patterns:**
- Schema validation errors: Zod's `ZodError` with detailed path/message (thrown by `.parse()`, or returned via `.safeParse()` in guards)
- Encode/decode errors: Custom `Error` with descriptive messages (e.g., `"Invalid VerifiableURI: value too short"`, `"VerifiableURI hash mismatch"`)
- Parser errors in lsp6: `try/catch` wrapping `ERC725.decodeData()` — returns empty array `[]` on any failure, never throws
- Guard functions: Always return `boolean`, never throw — use `safeParse` internally
- lsp6 `parseAllowedCalls`: Per-entry error handling with `continue` — skips malformed entries rather than failing the batch

## Cross-Cutting Concerns

**Logging:** None — library packages have no logging. Consumer applications handle logging.

**Validation:** Zod schemas are the universal validation mechanism. Every package has `schemas.ts` with Zod definitions. Runtime validation happens via type guards (`guards.ts`) or direct `.parse()` calls in encode/decode functions.

**Authentication:** Not applicable — these are pure data encoding/decoding libraries. Authentication is handled by the consumer application and the LUKSO blockchain.

**Hex/Byte Manipulation:** `viem` library provides all hex/byte utilities (`concat`, `slice`, `keccak256`, `stringToHex`, `hexToString`, `encodePacked`, `encodeAbiParameters`, `getAddress`). Used as a peer dependency in packages that need it.

---

*Architecture analysis: 2026-02-27*
