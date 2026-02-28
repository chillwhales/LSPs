# @chillwhales/lsp6

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

LSP6 Key Manager — permission key builders, CompactBytesArray parsers, and schemas for managing controller permissions on LUKSO Universal Profiles.

## Install

```bash
pnpm add @chillwhales/lsp6
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import {
  buildPermissionsKey,
  buildAllowedCallsKey,
} from "@chillwhales/lsp6";
import type { Address } from "viem";

// Build ERC725Y data keys for a controller's permissions
const controller: Address = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

// Permissions key — use with setData to grant/revoke permissions
const permissionsKey = buildPermissionsKey(controller);
// "0x4b80742de2bf82acb3630000ab5801a7d398351b8be11c439e05c5b3259aec9b"

// Allowed calls key — use with setData to restrict callable contracts
const allowedCallsKey = buildAllowedCallsKey(controller);
```

> **Spec:** [LSP-6 Key Manager](https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager)

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
