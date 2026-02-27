# Codebase Concerns

**Analysis Date:** 2026-02-27

## Tech Debt

**Duplicated Constants Across Packages:**
- Issue: `KECCAK256_BYTES_METHOD_ID` and `HASH_LENGTH_PREFIX` are independently defined in both `@chillwhales/lsp2` and `@chillwhales/lsp30`. `MAPPING_SEPARATOR` is independently defined in both `@chillwhales/lsp2` and `@chillwhales/lsp29`. The `LSP29_BACKENDS` and `LSP30_BACKENDS` constants contain identical values (`['ipfs', 's3', 'lumera', 'arweave']`) but are defined separately with no shared source.
- Files: `packages/lsp2/src/constants.ts`, `packages/lsp30/src/constants.ts`, `packages/lsp29/src/constants.ts`
- Impact: If a constant value changes (e.g., adding a new backend or verification method), updates must be made in multiple places. Forgetting one leads to silent behavioral divergence. The `lsp30` package explicitly comments it duplicates to "avoid external dependencies" — this is a deliberate tradeoff but creates maintenance risk.
- Fix approach: Consider creating a shared `@chillwhales/lsp-constants` package or exporting these common constants from `@chillwhales/lsp2` (which is already a dependency of lsp29 and lsp23). For backends, create a single `STORAGE_BACKENDS` constant in a shared location.

**Build Warnings Suppressed Globally:**
- Issue: Every package sets `failOnWarn: false` in its `build.config.ts`. This silences all unbuild warnings during compilation, hiding potential issues (circular dependencies, missing externals, deprecated APIs).
- Files: `packages/*/build.config.ts` (all 8 packages)
- Impact: Build problems are invisible. Downstream consumers may receive bundles with subtle issues. Warnings exist for a reason — suppressing them globally prevents catching regressions.
- Fix approach: Set `failOnWarn: true` and fix any warnings. If specific warnings need suppression, handle them individually rather than blanket-disabling.

**No Linter or Formatter Configuration:**
- Issue: The project has only `.editorconfig` for basic whitespace rules. There is no ESLint, Prettier, Biome, or any other linter/formatter configured. No lint scripts in any `package.json`.
- Files: `package.json`, `.editorconfig`
- Impact: Code style is enforced only by convention and editor settings. Inconsistencies already exist — some packages use single quotes (`lsp29`, `lsp30`), others use double quotes (`lsp2`, `lsp3`, `lsp4`, `lsp6`, `lsp23`, `utils`). No automated enforcement of best practices (unused imports, type safety patterns, etc.).
- Fix approach: Add Biome or ESLint + Prettier at the workspace root with a shared config. Add `lint` and `format` scripts to the root `package.json`.

**Missing `viem` Peer Dependency in lsp3 and lsp4:**
- Issue: `@chillwhales/lsp3` and `@chillwhales/lsp4` depend on `@chillwhales/lsp2` which requires `viem` as a peer dependency. However, `lsp3` and `lsp4` do not declare `viem` as a peer dependency themselves, and `lsp4` imports `Image` type from `@chillwhales/lsp2` (which re-exports `viem` types like `Hex`).
- Files: `packages/lsp3/package.json`, `packages/lsp4/package.json`
- Impact: Consumers who install `@chillwhales/lsp3` or `@chillwhales/lsp4` without `viem` in their project may get cryptic type errors or runtime failures. The transitive peer dependency is not surfaced.
- Fix approach: Add `"viem": "^2.0.0"` to `peerDependencies` in both `packages/lsp3/package.json` and `packages/lsp4/package.json`.

**Inconsistent Quote Style Across Packages:**
- Issue: `lsp29` and `lsp30` use single quotes throughout their source files, while all other packages (`lsp2`, `lsp3`, `lsp4`, `lsp6`, `lsp23`, `utils`) use double quotes. No enforced formatting rule exists.
- Files: `packages/lsp29/src/*.ts`, `packages/lsp30/src/*.ts` vs `packages/lsp2/src/*.ts` (etc.)
- Impact: Cosmetic inconsistency that makes the codebase feel disjointed. PRs touching multiple packages may introduce further inconsistency.
- Fix approach: Adopt a formatter (Biome/Prettier) with a workspace-wide quote preference and reformat all files.

## Known Bugs

No explicit bugs identified. No TODO/FIXME/HACK comments exist in the codebase — this is clean.

## Security Considerations

**Hardcoded LUKSO Mainnet Contract Addresses:**
- Risk: `packages/lsp23/src/constants.ts` hardcodes LUKSO mainnet contract addresses for the LSP23 factory, post-deployment module, Universal Receiver Delegate, and implementation contracts. These cannot be overridden without modifying source code. If these contracts are ever compromised, upgraded, or if testnet/other network support is needed, the hardcoded addresses are a blocker.
- Files: `packages/lsp23/src/constants.ts`
- Current mitigation: None — the `generateDeployParams` function in `packages/lsp23/src/deploy.ts` uses these constants directly with no override mechanism.
- Recommendations: Accept the addresses as defaults but allow `generateDeployParams` to accept optional address overrides. Export the constants so consumers can verify them.

**`parseInt` for Hex Parsing in Parsers:**
- Risk: `parseInt(callTypes, 16)` in `packages/lsp6/src/parsers.ts` (lines 182-183) parses hex permission bitmasks using `parseInt`, which returns a JavaScript `number` (max safe integer ~9×10¹⁵). If permission bitmasks ever exceed 53 bits, `parseInt` silently loses precision, potentially granting incorrect permissions.
- Files: `packages/lsp6/src/parsers.ts` (lines 182-183)
- Current mitigation: Current LSP6 permission bitmasks fit within 53 bits.
- Recommendations: Use `BigInt('0x' + value)` instead of `parseInt(value, 16)` for bitmask operations. This is future-proof and eliminates silent precision loss.

**Silent Error Swallowing in LSP6 Parsers:**
- Risk: `parseCompactBytesArray` and `parseAllowedCalls` in `packages/lsp6/src/parsers.ts` catch all exceptions and return empty arrays `[]`. Malformed data, corrupted keys, and genuine errors (network issues if ERC725.js is involved) are all silently treated as "no data." Callers cannot distinguish between "no permissions" and "parsing failed."
- Files: `packages/lsp6/src/parsers.ts` (lines 57-60, 149-152)
- Current mitigation: The functions are documented to return empty arrays on failure.
- Recommendations: Consider returning a `Result` type (`{ ok: true; data: T } | { ok: false; error: string }`) or at minimum logging parse failures. For security-critical permission checks, silent failures that return "no permissions" could mask actual permission data.

**Unsafe `as T` Cast in VerifiableURI Decode:**
- Risk: `decodeVerifiableUri` in `packages/lsp2/src/verifiable-uri.ts` (line 205) casts `parsed as T` when no schema is provided. The caller gets a typed result but the actual runtime shape is unchecked. This could lead to accessing undefined properties on blockchain-sourced data.
- Files: `packages/lsp2/src/verifiable-uri.ts` (line 205)
- Current mitigation: The function accepts an optional Zod schema parameter; when provided, data is validated.
- Recommendations: Document prominently that callers MUST provide a schema for untrusted data. Consider making the schema required and providing a separate `decodeVerifiableUriUnsafe` for the cast path.

## Performance Bottlenecks

**ERC725.js Instantiation in Deploy Params:**
- Problem: `generateDeployParams` in `packages/lsp23/src/deploy.ts` creates a new `ERC725` instance on every call (line 80). This involves importing and processing JSON schemas each time.
- Files: `packages/lsp23/src/deploy.ts` (lines 80-83)
- Cause: The ERC725 instance is constructed inline rather than cached at module level.
- Improvement path: Hoist the `erc725` instance to module scope (singleton pattern). The schemas are static — there's no reason to re-instantiate per call. This matters if `generateDeployParams` is called in a loop (e.g., batch profile creation).

**No significant performance concerns otherwise.** The codebase is a pure utility library with no I/O, no async operations in core logic, and all operations are O(n) or better.

## Fragile Areas

**LSP6 `allowedCallMatches` Return Object:**
- Files: `packages/lsp6/src/parsers.ts` (lines 167-260)
- Why fragile: The function returns an object with 5 boolean flags (`isEqual`, `excessiveAllowedCallTypes`, `excessiveAllowedAddress`, `excessiveAllowedInterfaceId`, `excessiveAllowedFunction`). It has 4 early return points, each constructing a partial result with `false` for fields not yet evaluated. Adding a new field (e.g., a new dimension of allowed calls) requires updating all 4 early returns plus the final return — easy to miss one.
- Safe modification: Define a result type interface. Consider building the result incrementally in a mutable object rather than returning different literals from each branch.
- Test coverage: Tests exist in `packages/lsp6/src/parsers.test.ts` (21 test cases) but should verify each early-return path includes the correct flag values.

**LSP29 Schema-Constants Coupling:**
- Files: `packages/lsp29/src/schemas.ts`, `packages/lsp29/src/constants.ts`
- Why fragile: `lsp29EncryptionSchema` uses `z.enum(LSP29_PROVIDERS)` and `z.enum(LSP29_METHODS)` from constants, while `lsp29EncryptionParamsSchema` uses a `z.discriminatedUnion("method", [...])` with individual schemas. Adding a new encryption method requires updating: (1) `LSP29_METHODS` array, (2) a new params schema, (3) the `lsp29EncryptionParamsSchema` discriminated union, and (4) `ENCRYPTION_METHOD_METADATA`. Missing any one of these silently breaks validation.
- Safe modification: Add integration tests that verify all `LSP29_METHODS` entries have corresponding params schemas and metadata entries. Consider generating the discriminated union from the methods array.
- Test coverage: Schema tests exist (`packages/lsp29/src/schemas.test.ts`) but no test verifies all methods are covered in the discriminated union.

**LSP30 `parseLsp30Uri` JSON Parsing:**
- Files: `packages/lsp30/src/decode.ts` (lines 69-74)
- Why fragile: The function extracts raw hex bytes, converts to UTF-8 string, then parses as JSON. If the on-chain data contains valid hex that decodes to valid UTF-8 but invalid JSON (or JSON that doesn't match the entries schema), the error message is generic ("entries portion contains invalid JSON"). The subsequent `decodeLsp30Uri` function (line 129) does a separate Zod validation on entries, but `parseLsp30Uri` alone does no schema validation on the parsed JSON — it just returns `Lsp30Entry[]` type without runtime checks.
- Safe modification: Add Zod schema validation inside `parseLsp30Uri` or document that callers must use `decodeLsp30Uri` for validated data.
- Test coverage: Good — `packages/lsp30/src/decode.test.ts` (183 lines) covers malformed data cases.

## Scaling Limits

**No significant scaling limits.** This is a pure TypeScript utility library with no state, no I/O, and no resource management. All functions are stateless and side-effect-free (except ERC725.js schema loading in lsp6/lsp23).

## Dependencies at Risk

**`@erc725/erc725.js` (^0.28.2):**
- Risk: Used by `lsp6` and `lsp23`. This is a LUKSO ecosystem library with a relatively small maintenance team. Major version bumps could break the CompactBytesArray parsing and permission encoding that `lsp6/parsers.ts` and `lsp23/deploy.ts` depend on.
- Impact: `parseCompactBytesArray`, `parseAllowedCalls`, and `generateDeployParams` would break.
- Migration plan: Pin to a specific version rather than caret range. Add integration tests that verify ERC725.js decode/encode behavior for key use cases so breakage is caught immediately on upgrade.

**`@lukso/universalprofile-contracts` (^0.15.5) and `@lukso/lsp6-contracts` (^0.15.5):**
- Risk: ABI imports and permission constant imports from LUKSO contract packages. These are pre-1.0 packages — breaking changes are expected.
- Impact: `lsp23/deploy.ts` imports `universalProfileInitAbi`; `lsp6/key-builders.ts` imports `LSP6DataKeys`; `lsp6/schemas.ts` imports `PERMISSIONS` and `LSP6PermissionName`.
- Migration plan: Pin versions. Consider vendoring the specific ABIs and data key constants to decouple from upstream release cadence.

## Missing Critical Features

**No CI/CD Pipeline:**
- Problem: No GitHub Actions workflow, no automated testing on push/PR, no automated publishing.
- Blocks: Contributors cannot verify their changes pass tests without running locally. No automated quality gate. No automated npm publishing flow.

**No Changesets or Versioning Strategy:**
- Problem: All packages are at `0.1.0` with no changeset tool (e.g., `@changesets/cli`) configured. No `CHANGELOG.md` files exist.
- Blocks: Cannot coordinate multi-package version bumps. No audit trail of breaking changes.

**No Package Publishing Configuration:**
- Problem: While packages have `"files": ["dist", "package.json"]` configured, there's no `publishConfig`, no npm registry configuration, and no publish scripts.
- Blocks: Publishing to npm requires manual setup steps not documented anywhere.

## Test Coverage Gaps

**LSP6 Key Builders Have Limited Edge Case Testing:**
- What's not tested: `packages/lsp6/src/key-builders.ts` has 8 test cases but no tests for edge cases like `Address` with mixed case, or verifying the exact byte layout matches the LSP6 specification.
- Files: `packages/lsp6/src/key-builders.ts`, `packages/lsp6/src/key-builders.test.ts`
- Risk: Key builder producing incorrect data keys would cause permission data to be written to wrong storage slots on-chain — potentially catastrophic for profile security.
- Priority: High

**No Cross-Package Integration Tests:**
- What's not tested: There are no tests verifying that data produced by one package can be consumed by another. For example: lsp2's `encodeVerifiableUri` output being correctly consumed by lsp2's `decodeVerifiableUri`, or lsp29's schemas validating data produced by lsp29's encode functions when combined with lsp30 backend references.
- Files: No integration test directory or cross-package test infrastructure exists.
- Risk: Packages could drift apart — e.g., lsp29's chunk schema could accept a backend that lsp30 rejects.
- Priority: Medium

**LSP23 Deploy Test Doesn't Verify On-Chain Compatibility:**
- What's not tested: `packages/lsp23/src/deploy.test.ts` has 9 test cases that verify the output structure of `generateDeployParams` but cannot verify the encoded ABI data would actually succeed when sent to the LSP23 factory contract. The hardcoded mainnet addresses are not validated against any source.
- Files: `packages/lsp23/src/deploy.test.ts`, `packages/lsp23/src/deploy.ts`
- Risk: ABI encoding bugs or address changes would pass tests but fail on-chain.
- Priority: Medium

**LSP3/LSP4 Utility Functions Have Minimal Negative Testing:**
- What's not tested: `getProfileImageUrl`, `getProfileDisplayName`, `getImageUrl`, `getAssetDisplayName` in utility files don't test malformed URLs, XSS-style URL payloads, or very large image arrays.
- Files: `packages/lsp3/src/profile-utils.ts`, `packages/lsp4/src/asset-utils.ts`
- Risk: These are UI-facing utilities. Malformed URLs from on-chain data could propagate to frontends.
- Priority: Low

---

*Concerns audit: 2026-02-27*
