# @chillwhales/lsp2

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

LSP2 ERC725Y JSON Schema — shared primitives, VerifiableURI encoding/decoding, and image utilities for LUKSO dApps.

## Install

```bash
pnpm add @chillwhales/lsp2
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import { encodeVerifiableUri, parseVerifiableUri } from "@chillwhales/lsp2";

// Encode metadata as a VerifiableURI for on-chain storage
const metadata = {
  LSP4Metadata: { name: "My Token", description: "A LUKSO token" },
};
const encoded = encodeVerifiableUri(metadata, "ipfs://QmYwAPJz...");
// encoded is a hex string ready for setData()

// Later, read back from on-chain and parse the components
const { verificationMethod, verificationData, url } =
  parseVerifiableUri(encoded);
console.log(url); // "ipfs://QmYwAPJz..."
```

> **Spec:** [LSP-2 ERC725Y JSON Schema](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md)

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
