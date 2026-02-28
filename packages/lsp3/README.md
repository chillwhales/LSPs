# @chillwhales/lsp3

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

LSP3 Universal Profile Metadata — schemas, types, and utilities for reading and validating profile metadata on LUKSO.

## Install

```bash
pnpm add @chillwhales/lsp3
```

## Usage

```typescript
import {
  lsp3ProfileSchema,
  getProfileDisplayName,
  getProfileImageUrl,
} from "@chillwhales/lsp3";

// Validate raw profile metadata fetched from IPFS / on-chain
const raw = {
  name: "Alice",
  description: "Builder on LUKSO",
  tags: ["developer"],
  links: [{ title: "Website", url: "https://alice.dev" }],
  avatar: [],
  profileImage: [{ url: "ipfs://QmImg...", width: 256, height: 256 }],
  backgroundImage: [],
};

const profile = lsp3ProfileSchema.parse(raw);

// Extract display-ready values
const name = getProfileDisplayName(profile); // "Alice"
const imageUrl = getProfileImageUrl(profile, (url) =>
  url.replace("ipfs://", "https://api.universalprofile.cloud/ipfs/"),
);
```

> **Spec:** [LSP-3 Universal Profile Metadata](https://docs.lukso.tech/standards/universal-profile/lsp3-profile-metadata)

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](../../LICENSE)
