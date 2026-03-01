# @chillwhales/lsp31

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

LSP31 Multi-Storage URI — encode, decode, and resolve multi-backend content references for redundant storage on LUKSO Universal Profiles.

## Install

```bash
pnpm add @chillwhales/lsp31
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import {
  encodeLsp31Uri,
  parseLsp31Uri,
  computeContentHash,
} from "@chillwhales/lsp31";

// Define storage entries (minimum 2 backends for redundancy)
const entries = [
  { backend: "ipfs" as const, cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" },
  { backend: "arweave" as const, id: "abcdef1234567890abcdef1234567890abcdef123456" },
];

// Encode with a verification hash of the content bytes
const contentBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
const hash = computeContentHash(contentBytes);
const encoded = encodeLsp31Uri(entries, hash);
// encoded is a hex string ready for setData()

// Later, parse the on-chain value back into structured entries
const { verificationData, entries: decoded } = parseLsp31Uri(encoded);
console.log(decoded[0].backend); // "ipfs"
```

> **Spec:** See `LSP-31-MultiStorageURI.md` in the repository for the full specification.

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
