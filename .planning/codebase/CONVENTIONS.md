# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- Source files use `kebab-case.ts`: `verifiable-uri.ts`, `image-utils.ts`, `key-builders.ts`, `asset-utils.ts`, `profile-utils.ts`
- Test files are co-located and use `{name}.test.ts` suffix: `schemas.test.ts`, `guards.test.ts`, `encode.test.ts`
- Module files by concern: `schemas.ts`, `types.ts`, `guards.ts`, `constants.ts`, `index.ts`
- Config files: `vitest.config.ts`, `build.config.ts`, `tsconfig.json` per package

**Functions:**
- Use `camelCase` for all functions: `encodeVerifiableUri`, `parseVerifiableUri`, `findBestImage`, `computeContentHash`
- Type guards use `is` prefix: `isImageSchema`, `isLsp3ProfileSchema`, `isLsp29Asset`, `isLsp30Uri`, `isVerifiableUri`
- Builder functions use `build` prefix: `buildPermissionsKey`, `buildAllowedCallsKey`, `buildAllowedDataKeysKey`
- Encode/decode functions use verb prefix: `encodeLsp30Uri`, `decodeLsp30Uri`, `parseLsp30Uri`
- Getter functions use `get` prefix: `getProfileImageUrl`, `getProfileDisplayName`, `getAssetDisplayName`, `getImageUrl`

**Variables:**
- `camelCase` for local variables and parameters: `controllerAddress`, `verificationHash`, `testContent`
- `UPPER_SNAKE_CASE` for constants: `VERIFICATION_METHODS`, `KECCAK256_BYTES_METHOD_ID`, `RESERVED_PREFIX`, `MIN_VERIFIABLE_URI_LENGTH`
- `UPPER_SNAKE_CASE` for constant objects/arrays: `LSP29DataKeys`, `LSP29_PROVIDERS`, `LSP29_METHODS`, `LSP30_BACKENDS`

**Types:**
- `PascalCase` for types and interfaces: `Verification`, `Image`, `AllowedCall`, `ParsedVerifiableUri`, `DecodedVerifiableUri`
- Types inferred from Zod schemas use `z.infer<typeof schema>`: `type LSP3Profile = z.infer<typeof lsp3ProfileSchema>`
- LSP-specific types prefixed with `LSP{N}`: `LSP6Permission`, `LSP29EncryptedAsset`, `Lsp30Entry`
- Note: lsp29 uses `LSP29` prefix (all caps), lsp30 uses `Lsp30` prefix (PascalCase) — inconsistent

**Schemas (Zod):**
- `camelCase` suffixed with `Schema`: `addressSchema`, `imageSchema`, `lsp3ProfileSchema`, `lsp4MetadataSchema`
- Backend-specific schemas: `lsp30IpfsEntrySchema`, `lsp30S3EntrySchema`, `lsp29EncryptedAssetSchema`

**Enums:**
- `UPPER_SNAKE_CASE` for enum names: `VERIFICATION_METHODS`
- `PascalCase` or `UPPER_SNAKE_CASE` for enum members

## Code Style

**Formatting:**
- EditorConfig enforced (`.editorconfig`):
  - 2-space indentation (spaces, not tabs)
  - LF line endings
  - UTF-8 charset
  - Trailing whitespace trimmed
  - Final newline inserted
- No Prettier or ESLint configured — formatting relies on EditorConfig only
- Both single quotes and double quotes are used across the codebase (no enforced rule)
  - `packages/lsp30`, `packages/lsp29`: single quotes in source files
  - `packages/lsp2`, `packages/lsp6`, `packages/lsp23`: double quotes in source files

**Linting:**
- No ESLint, Biome, or other linter configured
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.base.json`)
- Relies on TypeScript compiler for type checking

## Import Organization

**Order:**
1. External packages (e.g., `viem`, `zod`, `@erc725/erc725.js`, `@lukso/*`)
2. Workspace packages (e.g., `@chillwhales/lsp2`, `@chillwhales/utils`)
3. Local relative imports (e.g., `./schemas`, `./constants`, `./types`)

**Path Aliases:**
- No path aliases used — all imports are relative (`./`) or package names (`@chillwhales/*`)
- Workspace packages referenced via `workspace:*` in `package.json`

**Import Style:**
- Named imports for specific exports: `import { z } from "zod";`
- Type-only imports where appropriate: `import type { Address, Hex } from "viem";`, `import type { z } from "zod";`
- Default imports for ERC725: `import ERC725 from "@erc725/erc725.js";`
- Barrel re-exports in `index.ts` files using `export * from "./module"` pattern

## Error Handling

**Patterns:**
- **Throw `Error` with descriptive messages** for invalid inputs in encode/decode/parse functions:
  ```typescript
  throw new Error(
    `Invalid VerifiableURI: value too short (${value.length} chars, minimum ${MIN_VERIFIABLE_URI_LENGTH})`,
  );
  ```
- **Return empty arrays** for parser functions that receive malformed data (graceful degradation):
  ```typescript
  // packages/lsp6/src/parsers.ts
  catch {
    // If ERC725.decodeData throws, return empty array
    return [];
  }
  ```
- **Use `safeParse()` in guards** — never throw, always return boolean:
  ```typescript
  export function isLsp29Asset(data: unknown): data is LSP29EncryptedAsset {
    return lsp29EncryptedAssetSchema.safeParse(data).success;
  }
  ```
- **Use `.parse()` for defense-in-depth validation** in encode functions (throws `ZodError` on failure):
  ```typescript
  lsp30EntriesSchema.parse(entries); // throws if entries invalid
  ```
- **Catch blocks use bare `catch` (no error parameter)** when the error details aren't needed:
  ```typescript
  } catch {
    return false;
  }
  ```

**Error Message Format:**
- Include context: what was expected vs. what was received
- Include relevant values (lengths, prefixes, hashes) in the message
- Use template literals for dynamic messages

## Logging

**Framework:** None — no logging framework used
**Patterns:** No `console.log` or logging calls in source code. This is a library codebase.

## Comments

**When to Comment:**
- Every file starts with a JSDoc block describing the module's purpose and linking to specs
- Every exported function has a JSDoc block with `@param`, `@returns`, `@throws`, `@example`
- Section separators use `// ============================================================================` comment blocks
- Inline comments for non-obvious logic (e.g., byte offset calculations, bitwise operations)
- Constants include inline documentation explaining their hex values

**JSDoc Pattern:**
```typescript
/**
 * Brief description of the function
 *
 * Extended description if needed.
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws Error if [condition]
 *
 * @example
 * ```typescript
 * // Usage example
 * ```
 */
```

**Section Separator Pattern:**
```typescript
// ============================================================================
// Section Name
// ============================================================================
```

## Function Design

**Size:** Functions are small and focused (typically 5-30 lines of logic). No function exceeds ~80 lines.

**Parameters:**
- Functions accept typed parameters, often using `viem` types (`Hex`, `Address`)
- Optional parameters use `?` suffix or default values
- Complex parameter sets use object destructuring: `{ salt, controllerAddress }: { salt: string; controllerAddress: Address }`
- Callback functions passed as parameters: `parseUrl: (url: string) => string`

**Return Values:**
- Use union return types: `Image | undefined`, `Image | null`
- Pure data functions return typed objects: `ParsedVerifiableUri`, `DecodedVerifiableUri<T>`
- Guard functions return `boolean` with type predicate: `data is LSP29EncryptedAsset`
- Generics used for flexible typing: `encodeVerifiableUri<T>(data: T, ipfsUrl: string): Hex`

**Purity:** Functions are pure (no side effects) wherever possible. State mutation is absent.

## Module Design

**Exports:**
- Each package has a single `src/index.ts` entry point
- Most packages use wildcard re-exports: `export * from "./schemas";`
- `packages/lsp3` uses selective named exports for a tighter public API:
  ```typescript
  export { lsp3ProfileSchema } from "./schemas";
  export type { LSP3Profile } from "./types";
  ```

**File Organization per Package:**
- `constants.ts` — Hex constants, enums, data keys, configuration values
- `schemas.ts` — Zod validation schemas
- `types.ts` — TypeScript types inferred from Zod schemas via `z.infer`
- `guards.ts` — Runtime type guard functions using `schema.safeParse()`
- `encode.ts` / `decode.ts` — Encoding/decoding utilities (where applicable)
- `{domain}-utils.ts` — Domain-specific utility functions (e.g., `image-utils.ts`, `profile-utils.ts`, `asset-utils.ts`)
- `index.ts` — Barrel file re-exporting all public API

**Barrel Files:**
- Every package has one `src/index.ts`
- No nested barrel files
- All exports flow through the single entry point

## Validation Pattern (Zod)

**Schema-First Design:**
- Zod schemas are the single source of truth for data shapes
- TypeScript types are derived from schemas: `type X = z.infer<typeof xSchema>`
- Schemas live in `schemas.ts`, types in `types.ts`
- This pattern is consistent across all packages

**Discriminated Unions:**
- Used for variant types: `z.discriminatedUnion("method", [...])`, `z.discriminatedUnion("backend", [...])`
- Each variant is defined as a separate schema, then combined

**Exhaustive Checks:**
- Switch statements on discriminated unions include `default: never` for exhaustive checking:
  ```typescript
  default: {
    const _exhaustive: never = entry;
    throw new Error(`Unknown backend: ${(_exhaustive as Lsp30Entry).backend}`);
  }
  ```

## `as const` Pattern

- Constant objects and arrays use `as const` for literal type inference:
  ```typescript
  export const LSP30_BACKENDS = ["ipfs", "s3", "lumera", "arweave"] as const;
  export const KECCAK256_BYTES_METHOD_ID = "0x8019f9b1" as const;
  ```
- Union types derived from `as const` arrays: `type Lsp30Backend = (typeof LSP30_BACKENDS)[number];`

---

*Convention analysis: 2026-02-27*
