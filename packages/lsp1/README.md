# @chillwhales/lsp1

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

LSP1 UniversalReceiver — event constants, typeId definitions, and notification type guards for LUKSO Universal Profiles.

## Install

```bash
pnpm add @chillwhales/lsp1
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import { LSP1_TYPE_IDS, isLsp1TypeId } from "@chillwhales/lsp1";

// Check if a typeId is a known LSP1 notification
if (isLsp1TypeId(event.typeId)) {
  console.log("Known LSP1 notification");
}

// Use specific typeId constants
if (event.typeId === LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification) {
  console.log("Received LSP7 tokens");
}

// Check notification categories
import {
  isTokenRecipientNotification,
  isTokenSenderNotification,
  isOwnershipNotification,
} from "@chillwhales/lsp1";

if (isTokenRecipientNotification(event.typeId)) {
  console.log("Token received (LSP7 or LSP8)");
}
```

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
