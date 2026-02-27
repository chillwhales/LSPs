# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Runner:**
- Vitest ^4.0.17
- Config: `packages/*/vitest.config.ts` (per-package, identical configs)

**Assertion Library:**
- Vitest built-in `expect` (no separate assertion library)

**Run Commands:**
```bash
pnpm test                # Run all tests across all packages
pnpm -r test             # Same (defined in root package.json)
pnpm test --filter=@chillwhales/lsp2  # Run tests for specific package
vitest run               # Run tests in a specific package directory
vitest                   # Watch mode in a specific package directory
```

## Vitest Configuration

All packages use identical Vitest configuration:

```typescript
// packages/*/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

**Key settings:**
- `globals: true` — `describe`, `it`, `expect` available globally (but all files still import them explicitly)
- `environment: "node"` — Node.js test environment (no DOM)
- No coverage configuration
- No test timeout overrides
- No setup files

## Test File Organization

**Location:**
- Co-located with source files in the same `src/` directory
- Test file sits next to the module it tests

**Naming:**
- Pattern: `{module-name}.test.ts`
- Examples: `schemas.test.ts`, `guards.test.ts`, `encode.test.ts`, `decode.test.ts`, `verifiable-uri.test.ts`

**Structure:**
```
packages/{package}/src/
├── schemas.ts
├── schemas.test.ts      # Tests for schemas.ts
├── guards.ts
├── guards.test.ts       # Tests for guards.ts
├── encode.ts
├── encode.test.ts       # Tests for encode.ts
├── decode.ts
├── decode.test.ts       # Tests for decode.ts
└── index.ts             # No test file for barrel exports
```

**Test files per package:**
- `packages/lsp2/src/`: `schemas.test.ts`, `guards.test.ts`, `verifiable-uri.test.ts`, `image-utils.test.ts`
- `packages/lsp3/src/`: `schemas.test.ts`, `guards.test.ts`, `profile-utils.test.ts`
- `packages/lsp4/src/`: `schemas.test.ts`, `guards.test.ts`, `asset-utils.test.ts`
- `packages/lsp6/src/`: `key-builders.test.ts`, `parsers.test.ts`
- `packages/lsp23/src/`: `schemas.test.ts`, `guards.test.ts`, `deploy.test.ts`
- `packages/lsp29/src/`: `schemas.test.ts`, `guards.test.ts`, `encode.test.ts`, `decode.test.ts`
- `packages/lsp30/src/`: `guards.test.ts`, `encode.test.ts`, `decode.test.ts`, `resolve.test.ts`
- `packages/utils/src/`: `strings.test.ts`, `numbers.test.ts`

## Test Structure

**Suite Organization:**
```typescript
// File-level doc comment describing what this file tests
/**
 * LSP2 Schema Validation Tests
 *
 * Tests for LSP2 shared primitive schemas:
 * - Address, bytes32, and bytes validation
 * - Verification, image, asset, link, and tag schemas
 */

import { describe, expect, it } from 'vitest';
import { schemaToTest } from './schemas';

// ============================================================================
// Section Name (matching source file sections)
// ============================================================================

describe('functionOrSchemaName', () => {
  it('should [positive case description]', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should [negative case description]', () => {
    // ...
  });
});
```

**Patterns:**
- Every test file imports `{ describe, expect, it }` from `'vitest'` explicitly (despite globals being enabled)
- Some test files also import `vi` for mock functions: `import { describe, it, expect, vi } from "vitest";`
- Section separators (`// ====`) mirror source file section organization
- Test descriptions use `should` + verb pattern: `'should accept valid...'`, `'should reject invalid...'`, `'should return true for...'`
- Tests are grouped by function/schema name in `describe` blocks
- No `beforeEach`/`afterEach` usage found — test data is defined at module scope or inline

**Test Data Location:**
- Test fixtures defined at the top of each test file under a `// Test Data` or `// Test Fixtures` section separator
- Helper factory functions defined inline: `const createImage = (width, height, url) => ({...})`
- No separate fixture files — all test data is self-contained within each test file

## Testing Approach: Valid/Invalid Pairs

The dominant test pattern validates both positive and negative cases for every schema/guard:

**Schema Validation Tests:**
```typescript
describe('addressSchema', () => {
  it('should accept valid Ethereum addresses', () => {
    const validAddresses = [
      '0x0000000000000000000000000000000000000000',
      '0x1234567890123456789012345678901234567890',
    ];
    for (const address of validAddresses) {
      const result = addressSchema.safeParse(address);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid addresses', () => {
    const invalidAddresses = [
      '0x123',           // too short
      null, undefined,   // non-string types
      123, {},           // wrong types
    ];
    for (const address of invalidAddresses) {
      const result = addressSchema.safeParse(address);
      expect(result.success).toBe(false);
    }
  });

  it('should provide meaningful error messages for invalid types', () => {
    const result = addressSchema.safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid value, not a string');
    }
  });
});
```

**Guard Tests:**
```typescript
describe('isImageSchema', () => {
  it('should return true for valid image objects', () => {
    expect(isImageSchema(validImage)).toBe(true);
  });

  it('should return false for objects missing required fields', () => {
    const missingUrl = { width: 1024, height: 768, verification: valid };
    expect(isImageSchema(missingUrl)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isImageSchema(null)).toBe(false);
    expect(isImageSchema(undefined)).toBe(false);
    expect(isImageSchema('string')).toBe(false);
    expect(isImageSchema(123)).toBe(false);
  });
});
```

## Encode/Decode Round-Trip Tests

Packages with encode/decode functionality include dedicated round-trip test suites:

```typescript
describe('round-trip', () => {
  it('should encode and decode to same data', () => {
    const originalData = { /* complex nested object */ };
    const ipfsUrl = 'ipfs://QmRoundTripTest';
    const jsonString = JSON.stringify(originalData);

    const encoded = encodeVerifiableUri(originalData, ipfsUrl);
    const decoded = decodeVerifiableUri<typeof originalData>(encoded, jsonString);

    expect(decoded.data).toEqual(originalData);
    expect(decoded.url).toBe(ipfsUrl);
  });

  it('should preserve exact JSON structure', () => {
    const data = { a: 1, b: { c: [1, 2, 3] } };
    const jsonString = JSON.stringify(data);
    const encoded = encodeVerifiableUri(data, ipfsUrl);
    const decoded = decodeVerifiableUri<typeof data>(encoded, jsonString);
    expect(JSON.stringify(decoded.data)).toBe(jsonString);
  });
});
```

**Round-trip tests exist in:**
- `packages/lsp2/src/verifiable-uri.test.ts` — encode → decode VerifiableURI
- `packages/lsp30/src/decode.test.ts` — encode → parse/decode LSP30 URI

## Error Case Testing

Error-throwing functions are tested for specific error messages using `.toThrow()`:

```typescript
it('should throw Error on value too short', () => {
  const shortValue = '0x00008019f9b10020' as Hex;
  expect(() => parseVerifiableUri(shortValue)).toThrow(Error);
  expect(() => parseVerifiableUri(shortValue)).toThrow(/too short/);
});

it('should throw Error on hash mismatch', () => {
  const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
  const tamperedJson = JSON.stringify({ name: 'Tampered', value: 999 });
  expect(() => decodeVerifiableUri(encoded, tamperedJson, testSchema)).toThrow(Error);
  expect(() => decodeVerifiableUri(encoded, tamperedJson, testSchema)).toThrow(/hash mismatch/);
});
```

**Pattern:** Two assertions per error test — one for `Error` type, one for message regex match.

## Mocking

**Framework:** Vitest built-in `vi`

**Usage:** Minimal — only found in `packages/lsp3/src/profile-utils.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

const parseUrl = vi.fn((url: string) => `parsed:${url}`);

it('calls parseUrl with first image URL', () => {
  const profile = makeProfile({
    profileImage: [
      { url: 'ipfs://abc', width: 100, height: 100, verification },
    ],
  });
  const result = getProfileImageUrl(profile, parseUrl);
  expect(parseUrl).toHaveBeenCalledWith('ipfs://abc');
  expect(result).toBe('parsed:ipfs://abc');
});
```

**What is Mocked:**
- Callback functions passed as parameters (e.g., `parseUrl`)

**What is NOT Mocked:**
- Zod schemas — tested directly with `safeParse()` and real data
- `viem` functions (`keccak256`, `concat`, `hexToString`, etc.) — used directly, never mocked
- `@erc725/erc725.js` — used directly in integration-style tests
- No module mocking (`vi.mock()`) anywhere in the codebase

**Philosophy:** This is a pure-function library. Most code has no external side effects, so testing is done with real implementations. Mocks are only used for injected callbacks.

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// Top of test file, under section separator
// ============================================================================
// Test Data / Test Fixtures
// ============================================================================

const validVerification = {
  data: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  method: VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
};

const validImage: Image = {
  url: 'https://example.com/image.png',
  width: 1024,
  height: 768,
  verification: validVerification,
};

// Factory helper for parameterized test data
const createImage = (width: number, height: number, url = `image-${width}x${height}.png`): Image => ({
  url,
  width,
  height,
  verification: validVerification,
});
```

**Test Address Pattern:**
```typescript
const TEST_ADDRESS = "0x1234567890AbcdEF1234567890aBcdef12345678" as const;
const VALID_SALT = "0x" + "00".repeat(32);
```

**Location:**
- All fixtures defined within the test file — no shared fixture directory
- Complex test objects built with spread operator: `{ ...validAsset, fieldToOverride: newValue }`
- Factory functions prefixed with `create` or `make`: `createImage()`, `makeProfile()`

## Coverage

**Requirements:** None enforced — no coverage thresholds configured

**Coverage tool:** Not configured in vitest configs. Can be run with:
```bash
vitest run --coverage   # Requires @vitest/coverage-v8 or @vitest/coverage-istanbul
```

## Test Types

**Unit Tests:**
- All tests are unit tests
- Each test file tests a single source module in isolation
- No integration tests spanning multiple packages
- No E2E tests

**Schema Validation Tests:**
- Test `safeParse()` with arrays of valid and invalid inputs
- Test error messages for meaningful user feedback
- Test all discriminated union variants

**Guard Tests:**
- Test `true` returns for valid objects
- Test `false` returns for missing fields, wrong types, non-objects
- Test type narrowing implicitly (guards return type predicates)

**Encode/Decode Tests:**
- Test byte-level output structure (prefix, method ID, hash, payload)
- Test error cases (short input, wrong prefix, hash mismatch)
- Test round-trip preservation of data

**Utility Tests:**
- Test pure function behavior with edge cases
- Comprehensive coverage of boundary conditions (see `numbers.test.ts` — 471 lines for a 23-line function)

## Common Patterns

**Iterating Test Cases:**
```typescript
it('should accept valid Ethereum addresses', () => {
  const validAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x1234567890123456789012345678901234567890',
  ];
  for (const address of validAddresses) {
    const result = addressSchema.safeParse(address);
    expect(result.success).toBe(true);
  }
});
```

**Testing Error Messages:**
```typescript
it('should provide meaningful error messages', () => {
  const result = imageSchema.safeParse({ url: 123 });
  expect(result.success).toBe(false);
  if (!result.success) {
    const errors = result.error.issues.map(issue => issue.message);
    expect(errors).toContain('Invalid value, not a string');
  }
});
```

**Hex Value Testing:**
```typescript
it('should contain correct method ID 0x8019f9b1', () => {
  const encoded = encodeVerifiableUri(simpleData, testIpfsUrl);
  const methodId = encoded.slice(6, 14);
  expect(methodId).toBe('8019f9b1');
});
```

**Async Testing:**
- No async tests in the codebase. All functions are synchronous.

## Known Test Quirk

**`packages/utils/src/strings.test.ts` imports from `../dist` instead of `./strings`:**
```typescript
// This imports from the built output, not the source
import { isEqual } from "../dist";
```
This means the utils/strings tests require a build step before running. All other test files import from source.

---

*Testing analysis: 2026-02-27*
