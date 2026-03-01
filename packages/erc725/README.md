# @chillwhales/erc725

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

ERC725Y data-key building, array key computation, and contract storage reading utilities.

## Install

```bash
pnpm add @chillwhales/erc725
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import {
  computeSingletonKey,
  computeArrayKey,
  computeArrayElementKey,
  computeMappingKey,
  extractArrayIndex,
} from "@chillwhales/erc725";

// Compute a Singleton key
const lsp3ProfileKey = computeSingletonKey("LSP3Profile");
// 0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5

// Compute an Array length key
const receivedAssetsKey = computeArrayKey("LSP5ReceivedAssets[]");

// Compute an Array element key (index 0)
const firstAssetKey = computeArrayElementKey("LSP5ReceivedAssets[]", 0);

// Compute a Mapping key with an address
const mappingKey = computeMappingKey(
  "LSP5ReceivedAssetsMap",
  "0x1234567890abcdef1234567890abcdef12345678",
);

// Extract array index from element key (roundtrip)
const index = extractArrayIndex(firstAssetKey); // 0n
```

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
