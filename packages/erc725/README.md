# @chillwhales/erc725

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

ERC725Y data key registry — aggregates all known LUKSO LSP data keys from `@lukso/lsp*-contracts` into a single searchable registry with bidirectional name↔hex lookup and prefix matching support.

## Install

```bash
pnpm add @chillwhales/erc725
```

## Usage

### Resolve Data Keys

```typescript
import {
  resolveDataKeyName,
  resolveDataKeyHex,
  isKnownDataKeyName,
  isKnownDataKeyHex,
} from "@chillwhales/erc725";

// Hex → human-readable name
const name = resolveDataKeyName(
  "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5",
);
// "LSP3Profile"

// Name → hex
const hex = resolveDataKeyHex("LSP3Profile");
// "0x5ef83ad9..."

// Prefix matching for array/mapping keys
const arrayKeyName = resolveDataKeyName("0x6de85eaf5d982b4e00000000000000000000000000000005");
// "LSP5ReceivedAssets[number]"

// Existence checks
isKnownDataKeyName("LSP3Profile"); // true
isKnownDataKeyHex("0x5ef83ad9..."); // true
```

### Access All Data Keys

```typescript
import { ALL_DATA_KEYS, DATA_KEY_NAMES } from "@chillwhales/erc725";

// ALL_DATA_KEYS is a { name: hex } record from LSP1,3,4,5,6,8,9,10,12,17
console.log(ALL_DATA_KEYS.LSP3Profile);
// "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5"

// DATA_KEY_NAMES is a typed tuple of all key names (for z.enum())
console.log(DATA_KEY_NAMES.length); // 30+
```

### Enumerate Registry

```typescript
import {
  getKnownDataKeyNames,
  getKnownDataKeyHexes,
  getDataKeyEntries,
  getDataKeyCount,
} from "@chillwhales/erc725";

getDataKeyCount(); // number of registered keys
getKnownDataKeyNames(); // string[] of all names
getKnownDataKeyHexes(); // string[] of all hex keys
getDataKeyEntries(); // [hex, name][] pairs
```

### Zod Validation

```typescript
import { DataKeyNameSchema } from "@chillwhales/erc725";

DataKeyNameSchema.parse("LSP3Profile"); // OK
DataKeyNameSchema.parse("InvalidKey"); // throws ZodError
```

## API

| Export | Description |
|--------|-------------|
| `ALL_DATA_KEYS` | Merged `{ name: hex }` record from all `@lukso/lsp*-contracts` |
| `DATA_KEY_NAMES` | Non-empty tuple of all key names (for `z.enum()`) |
| `BUILT_IN_DATA_KEYS` | `[name, hex]` pairs array |
| `resolveDataKeyName(hex)` | Hex → name lookup (with prefix matching) |
| `resolveDataKeyHex(name)` | Name → hex lookup (case-insensitive) |
| `isKnownDataKeyName(name)` | Check if name is registered |
| `isKnownDataKeyHex(hex)` | Check if hex is registered (exact match) |
| `getKnownDataKeyNames()` | List all known names |
| `getKnownDataKeyHexes()` | List all known hex keys |
| `getDataKeyCount()` | Count of registered keys |
| `getDataKeyEntries()` | All `[hex, name]` pairs |
| `DataKeyNameSchema` | Zod enum schema for data key names |
| `DataKeyName` | TypeScript union type of data key names |

## License

[MIT](./LICENSE)
