# @chillwhales/lsp4

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

LSP4 Digital Asset Metadata — schemas, types, and utilities for reading and validating LSP7/LSP8 token metadata on LUKSO.

## Install

```bash
pnpm add @chillwhales/lsp4
```

## Usage

```typescript
import { lsp4MetadataSchema, getAssetDisplayName } from "@chillwhales/lsp4";

// Validate raw token metadata fetched from IPFS / on-chain
const raw = {
  name: "Chillwhale #42",
  description: "A chill whale living on LUKSO",
  category: "Collectible",
  links: [],
  icon: [{ url: "ipfs://QmIcon...", width: 64, height: 64 }],
  images: [[{ url: "ipfs://QmFull...", width: 1024, height: 1024 }]],
  assets: [],
  attributes: [
    { key: "Background", value: "Ocean", type: "string" },
    { key: "Rarity", value: "42", type: "number" },
  ],
};

const metadata = lsp4MetadataSchema.parse(raw);
const name = getAssetDisplayName(metadata); // "Chillwhale #42"
```

> **Spec:** [LSP-4 Digital Asset Metadata](https://docs.lukso.tech/standards/tokens/LSP4-Digital-Asset-Metadata)

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](../../LICENSE)
