# LUKSO Standards Packages

TypeScript implementations of [LUKSO Standard Proposals (LSPs)](https://docs.lukso.tech/standards/introduction).

## Packages

| Package                                | Description                                                                      | Dependencies                                               | Spec                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| [@chillwhales/lsp2](./packages/lsp2)   | ERC725Y JSON Schema — shared primitives, VerifiableURI, image utilities          | zod, viem                                                  |                                                      |
| [@chillwhales/lsp3](./packages/lsp3)   | Universal Profile Metadata — schemas and utilities                               | @chillwhales/lsp2, zod                                     |                                                      |
| [@chillwhales/lsp4](./packages/lsp4)   | Digital Asset Metadata — schemas and utilities                                   | @chillwhales/lsp2, zod                                     |                                                      |
| [@chillwhales/lsp6](./packages/lsp6)   | Key Manager — permissions, key builders, parsers                                 | @erc725/erc725.js, @lukso/lsp6-contracts, viem, zod        |                                                      |
| [@chillwhales/lsp23](./packages/lsp23) | Linked Contracts Factory — deployment encoding                                   | @erc725/erc725.js, @lukso/universalprofile-contracts, viem |                                                      |
| [@chillwhales/lsp29](./packages/lsp29) | Encrypted Assets — schemas, types, and encode/decode utilities                   | zod, viem                                                  | [LSP-29](./packages/lsp29/LSP-29-EncryptedAssets.md) |
| [@chillwhales/lsp30](./packages/lsp30) | Multi-Storage URI — encode, decode, and resolve multi-backend content references | zod, viem                                                  | [LSP-30](./packages/lsp30/LSP-30-MultiStorageURI.md) |

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
