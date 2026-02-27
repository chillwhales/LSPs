# LUKSO Standards Packages

TypeScript implementations of [LUKSO Standard Proposals (LSPs)](https://docs.lukso.tech/standards/introduction).

## Packages

| Package                                | Description                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| [@chillwhales/lsp2](./packages/lsp2)   | ERC725Y JSON Schema — shared primitives, VerifiableURI, image utilities          |
| [@chillwhales/lsp3](./packages/lsp3)   | Universal Profile Metadata — schemas and utilities                               |
| [@chillwhales/lsp4](./packages/lsp4)   | Digital Asset Metadata — schemas and utilities                                   |
| [@chillwhales/lsp6](./packages/lsp6)   | Key Manager — permissions, key builders, parsers                                 |
| [@chillwhales/lsp23](./packages/lsp23) | Linked Contracts Factory — deployment encoding                                   |
| [@chillwhales/lsp29](./packages/lsp29) | Encrypted Assets — schemas, types, and encode/decode utilities                   |
| [@chillwhales/lsp30](./packages/lsp30) | Multi-Storage URI — encode, decode, and resolve multi-backend content references |
| [@chillwhales/utils](./packages/utils) | Multi-Storage URI — encode, decode, and resolve multi-backend content references |

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
