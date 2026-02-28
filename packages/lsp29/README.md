# @chillwhales/lsp29

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

LSP29 Encrypted Assets — schemas, types, constants, and encode/decode utilities for storing and retrieving encrypted content on Universal Profiles.

## Install

```bash
pnpm add @chillwhales/lsp29
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import {
  computeLsp29MapKey,
  computeLsp29ArrayIndexKey,
  decodeLsp29Metadata,
} from "@chillwhales/lsp29";

// Compute the ERC725Y data key that maps a content ID to its array index
const mapKey = computeLsp29MapKey("premium-content");
// Use with getData() to look up the array index for this content

// Compute the array element key for a specific index
const elementKey = computeLsp29ArrayIndexKey(0);
// Use with getData() to retrieve the VerifiableURI at this index

// Decode and validate LSP29 metadata JSON (e.g. fetched from IPFS)
const metadata = decodeLsp29Metadata(jsonString);
console.log(metadata.LSP29EncryptedAsset.title);
console.log(metadata.LSP29EncryptedAsset.encryption.provider);
```

> **Spec:** See `LSP-29-EncryptedAssets.md` in the repository for the full specification.

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](../../LICENSE)
