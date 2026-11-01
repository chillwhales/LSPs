# LUKSO Standards Packages

TypeScript schemas, encoders, data-key utilities and deployment helpers for
[LUKSO Standard Proposals (LSPs)](https://docs.lukso.tech/standards/introduction),
published as individual `@chillwhales/*` packages.

## Install and use

Choose the package for the standard you need. For example, validate Universal Profile metadata
with `@chillwhales/lsp3`:

```bash
pnpm add @chillwhales/lsp3
```

```typescript
import { lsp3ProfileSchema } from "@chillwhales/lsp3";

const profile = lsp3ProfileSchema.parse({
  name: "Alice",
  description: "Builder on LUKSO",
  tags: [],
  links: [],
  avatar: [],
  profileImage: [],
  backgroundImage: [],
});
```

The example validates the profile metadata object after it has been fetched and decoded.
It does not fetch on-chain data. See the [LSP3 package guide](./packages/lsp3/README.md)
for its schema and display helpers.

Packages use ESM imports. The LSP3 package declares Node.js 22 or newer; check each package's
manifest for its runtime requirements. Node.js 22 or newer is also required for repository development.

## Packages

The catalog distinguishes metadata validation/encoding, key and type-ID registries, and
deployment-address helpers. Each package directory contains its source and manifest; package
guides provide usage examples where available. The private root and config workspaces are not
consumer packages.

| Package                                  | Description                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| [@chillwhales/erc725](./packages/erc725) | ERC725Y data key registry — bidirectional name/hex lookup                        |
| [@chillwhales/lsp1](./packages/lsp1)     | UniversalReceiver — type ID registry with bidirectional lookup                   |
| [@chillwhales/lsp2](./packages/lsp2)     | ERC725Y JSON Schema — shared primitives, VerifiableURI, image utilities          |
| [@chillwhales/lsp3](./packages/lsp3)     | Universal Profile Metadata — schemas and utilities                               |
| [@chillwhales/lsp4](./packages/lsp4)     | Digital Asset Metadata — schemas and utilities                                   |
| [@chillwhales/lsp6](./packages/lsp6)     | Key Manager — permissions, key builders, parsers                                 |
| [@chillwhales/lsp7](./packages/lsp7)     | Digital Asset — LSP7MintableInit deployment addresses                            |
| [@chillwhales/lsp8](./packages/lsp8)     | Identifiable Digital Asset — LSP8MintableInit deployment addresses               |
| [@chillwhales/lsp17](./packages/lsp17)   | Contract Extension — key builders, selectors, interfaces                         |
| [@chillwhales/lsp23](./packages/lsp23)   | Linked Contracts Factory — deployment encoding                                   |
| [@chillwhales/lsp26](./packages/lsp26)   | Follower System — on-chain follower/following deployment address                 |
| [@chillwhales/lsp29](./packages/lsp29)   | Encrypted Assets — schemas, types, and encode/decode utilities                   |
| [@chillwhales/lsp31](./packages/lsp31)   | Multi-Storage URI — encode, decode, and resolve multi-backend content references |
| [@chillwhales/up](./packages/up)         | Universal Profile — UniversalProfileInit deployment addresses                    |
| [@chillwhales/utils](./packages/utils)   | Shared utility functions for the @chillwhales LUKSO Standards Packages           |

## Development

Use the pnpm version pinned in [package.json](./package.json), and preserve the committed lockfile.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm typecheck
pnpm test
```

`pnpm check` runs Biome, workspace consistency, unused-code and circular-dependency checks.
`pnpm test:coverage` runs the tests with coverage.

## Versioning and contributions

Packages are versioned independently with [Changesets](./.changeset/README.md). When changing a
consumer-facing API, add a changeset with `pnpm changeset` describing the affected packages and
the appropriate version bump. Consult each package's changelog for its release history.

Bug reports and pull requests are welcome. Include a focused reproduction or example and update
the relevant package guide when behavior changes.

## License

[MIT](./LICENSE)
