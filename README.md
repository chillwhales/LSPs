# LUKSO Standards Packages

TypeScript implementations of [LUKSO Standard Proposals (LSPs)](https://docs.lukso.tech/standards/introduction).

## Packages

| Package                                | Description                                                                      | Spec                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [@chillwhales/lsp29](./packages/lsp29) | Encrypted Assets — schemas, types, and encode/decode utilities                   | [LSP-29](./packages/lsp29/LSP-29-EncryptedAssets.md) |
| [@chillwhales/lsp30](./packages/lsp30) | Multi-Storage URI — encode, decode, and resolve multi-backend content references | [LSP-30](./packages/lsp30/LSP-30-MultiStorageURI.md) |

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
