# @chillwhales/utils

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

Shared utility functions for the @chillwhales LUKSO Standards Packages. Provides case-insensitive string comparison and strict numeric string validation.

## Install

```bash
pnpm add @chillwhales/utils
```

## Usage

```typescript
import { isEqual, isNumeric } from "@chillwhales/utils";

// Case-insensitive address comparison (useful for EVM addresses)
const addr1 = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";
const addr2 = "0xab5801a7d398351b8be11c439e05c5b3259aec9b";
isEqual(addr1, addr2); // true

// Strict numeric string validation (for LSP4 number attributes)
isNumeric("42");       // true
isNumeric("3.14");     // true
isNumeric("");         // false
isNumeric("Infinity"); // false
```

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](../../LICENSE)
