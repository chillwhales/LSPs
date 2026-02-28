# @chillwhales/lsp23

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

LSP23 Linked Contracts Factory — deployment encoding utilities for creating Universal Profiles on LUKSO via the LSP23 factory contract.

## Install

```bash
pnpm add @chillwhales/lsp23
```

> **Peer dependency:** This package requires [`viem`](https://viem.sh) ^2.0.0
>
> ```bash
> pnpm add viem
> ```

## Usage

```typescript
import { generateDeployParams } from "@chillwhales/lsp23";
import type { Address } from "viem";

// Generate deployment parameters for a new Universal Profile
const controller: Address = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

const params = generateDeployParams({
  salt: "0x" + "00".repeat(32),
  controllerAddress: controller,
});

// params.universalProfileInitStruct — UP init calldata
// params.keyManagerInitStruct       — Key Manager init calldata
// params.initializeEncodedBytes     — post-deployment module data

// Pass these to the LSP23 factory contract's deploy function
```

> **Spec:** [LSP-23 Linked Contracts Factory](https://docs.lukso.tech/standards/smart-contracts/lsp23-linked-contracts-factory)

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
