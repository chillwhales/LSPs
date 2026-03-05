# LUKSO Standards Packages

TypeScript implementations of [LUKSO Standard Proposals (LSPs)](https://docs.lukso.tech/standards/introduction).

## Packages

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

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
