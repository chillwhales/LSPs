# External Integrations

**Analysis Date:** 2026-02-27

## APIs & External Services

**LUKSO Blockchain (EVM):**
This is a library monorepo that produces utilities for interacting with LUKSO smart contracts. The libraries themselves do not make network calls — consumers provide the blockchain interaction layer.

- **viem** (peer dependency) - Consumers use viem to read/write on-chain data
  - Package: `viem` ^2.0.0
  - Used for: Hex encoding/decoding, keccak256 hashing, ABI encoding, address checksumming
  - Files using viem directly:
    - `packages/lsp2/src/verifiable-uri.ts` — `concat`, `Hex`, `hexToString`, `keccak256`, `slice`, `stringToHex`
    - `packages/lsp6/src/key-builders.ts` — `Address`, `concat`, `Hex`
    - `packages/lsp6/src/parsers.ts` — `Address`, `getAddress`, `Hex`, `isHex`
    - `packages/lsp23/src/deploy.ts` — `Address`, `encodeAbiParameters`, `encodeFunctionData`, `getAddress`, `isHex`, `toFunctionSelector`, `toHex`
    - `packages/lsp29/src/encode.ts` — `concat`, `encodePacked`, `Hex`, `keccak256`, `slice`, `toHex`
    - `packages/lsp30/src/encode.ts` — `Hex`, `concat`, `keccak256`, `stringToHex`
    - `packages/lsp30/src/decode.ts` — `Hex`, `hexToString`, `keccak256`, `slice`
    - `packages/lsp30/src/types.ts` — `Hex` type import

**ERC725.js SDK:**
- SDK/Client: `@erc725/erc725.js` ^0.28.2
- Purpose: Decode/encode ERC725Y data key-value pairs using LUKSO schema definitions
- Used in:
  - `packages/lsp6/src/parsers.ts` — `ERC725.decodeData()` for parsing CompactBytesArray (AllowedCalls, AllowedERC725YDataKeys)
  - `packages/lsp23/src/deploy.ts` — `new ERC725()`, `erc725.encodeData()`, `erc725.encodePermissions()` for deployment parameter encoding
- Schema imports:
  - `@erc725/erc725.js/schemas/LSP6KeyManager.json` — LSP6 permission schemas
  - `@erc725/erc725.js/schemas/LSP1UniversalReceiverDelegate.json` — URD schemas

## Smart Contract ABIs & Constants

**@lukso/lsp6-contracts ^0.15.5:**
- Purpose: LSP6 Key Manager data key prefixes and permission constants
- Used in: `packages/lsp6/src/key-builders.ts`, `packages/lsp6/src/schemas.ts`
- Imports: `LSP6DataKeys`, `PERMISSIONS`, `LSP6PermissionName`

**@lukso/universalprofile-contracts ^0.15.5:**
- Purpose: Universal Profile ABI for initialization encoding
- Used in: `packages/lsp23/src/deploy.ts`
- Imports: `universalProfileInitAbi`

## On-Chain Contract Addresses (LUKSO Mainnet)

Hardcoded contract addresses in `packages/lsp23/src/constants.ts`:

| Constant | Address | Purpose |
|----------|---------|---------|
| `LSP23_FACTORY_ADDRESS` | `0x2300000A84D25dF63081feAa37ba6b62C4c89a30` | LSP23 Linked Contracts Factory |
| `LSP23_POST_DEPLOYMENT_MODULE` | `0x000000000066093407b6704B89793beFfD0D8F00` | Post-deployment module |
| `UNIVERSAL_RECEIVER_ADDRESS` | `0x7870C5B8BC9572A8001C3f96f7ff59961B23500D` | Universal Receiver Delegate |
| `IMPLEMENTATIONS.UNIVERSAL_PROFILE` | `0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F` | UP implementation (proxy pattern) |
| `IMPLEMENTATIONS.LSP6_KEY_MANAGER` | `0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4` | Key Manager implementation |

## Data Storage

**Databases:**
- None — this is a pure library monorepo with no database dependencies

**File Storage:**
- Not applicable — libraries produce data for on-chain storage (ERC725Y key-value stores)
- Storage backends referenced in schemas (not implemented):
  - IPFS (CID-based)
  - AWS S3 (bucket/key/region)
  - Lumera/Pastel Cascade (action IDs)
  - Arweave (transaction IDs)
- These appear in `packages/lsp29/src/schemas.ts` and `packages/lsp30/src/schemas.ts` as validation schemas for chunk/entry references

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Not applicable — no auth flows in the library
- LSP6 package provides permission encoding/parsing for LUKSO's on-chain Key Manager permission system
  - Permission types: `CHANGEOWNER`, `ADDCONTROLLER`, `EDITPERMISSIONS`, `SUPER_TRANSFERVALUE`, `CALL`, `SETDATA`, `ENCRYPT`, `DECRYPT`, `SIGN`, etc.
  - Implementation: `packages/lsp6/src/key-builders.ts`, `packages/lsp6/src/parsers.ts`

## Encryption Providers (Referenced, Not Implemented)

LSP29 defines schemas for encryption providers — the library validates metadata but does not perform encryption:

- **TACo (Threshold Access Control)** — Primary provider referenced in `packages/lsp29/src/constants.ts`
- **Lit Protocol** — Legacy provider (no longer active), still in schema for backward compatibility
- Access control methods defined: `digital-asset-balance`, `lsp8-ownership`, `lsp26-follower`, `time-locked`

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- None — pure functions throw errors on invalid input, no logging framework

## CI/CD & Deployment

**Hosting:**
- No `.github/` directory detected — no CI/CD configuration present
- No deployment config — library is intended for npm publishing

**CI Pipeline:**
- None configured in the repository

## Environment Configuration

**Required env vars:**
- None — this is a pure library monorepo with zero runtime secrets

**Secrets location:**
- No `.env` files exist or are needed
- No secrets management — all configuration is hardcoded constants (contract addresses on LUKSO mainnet)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Third-Party Standards Referenced

| Standard | Package(s) | Purpose |
|----------|-----------|---------|
| LSP2 (ERC725Y JSON Schema) | lsp2 | Shared primitives, VerifiableURI encoding |
| LSP3 (Universal Profile Metadata) | lsp3 | Profile metadata schemas |
| LSP4 (Digital Asset Metadata) | lsp4 | Token metadata schemas (LSP7/LSP8) |
| LSP6 (Key Manager) | lsp6 | Permission encoding/parsing |
| LSP23 (Linked Contracts Factory) | lsp23 | Universal Profile deployment encoding |
| LSP29 (Encrypted Assets) | lsp29 | Encrypted content metadata schemas |
| LSP30 (Multi-Storage URI) | lsp30 | Multi-backend content reference encoding |
| ERC725Y | lsp2, lsp6, lsp23 | On-chain key-value storage standard |

---

*Integration audit: 2026-02-27*
