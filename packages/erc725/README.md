# @chillwhales/erc725

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

ERC725Y utilities — wraps `@erc725/erc725.js` with viem-typed interfaces for key name ↔ data key mapping, data encoding/decoding, permissions, and on-chain storage reading.

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

### Key Name ↔ Data Key

```typescript
import { encodeKeyName, decodeMappingKey } from "@chillwhales/erc725";

// Singleton key
const lsp3Key = encodeKeyName("LSP3Profile");
// "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5"

// Array element key
const element5 = encodeKeyName("LSP5ReceivedAssets[]", [5]);

// Mapping key with address
const mapKey = encodeKeyName("LSP5ReceivedAssetsMap:<address>", [
  "0xcAfEcAfECAfECaFeCaFecaFecaFECafECafeCaFe",
]);

// Decode a mapping key back to its dynamic parts
const parts = decodeMappingKey(mapKey, "LSP5ReceivedAssetsMap:<address>");
```

### Data Encoding / Decoding

```typescript
import { encodeData, decodeData, encodePermissions } from "@chillwhales/erc725";
import LSP6Schemas from "@erc725/erc725.js/schemas/LSP6KeyManager.json";

const encoded = encodeData(
  [
    {
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: ["0x1234..."],
      value: encodePermissions({ CALL: true, SETDATA: true }),
    },
  ],
  LSP6Schemas,
);
// { keys: ["0x4b80742d..."], values: ["0x0000..."] }
```

### On-Chain Reading (viem)

```typescript
import { createPublicClient, http } from "viem";
import { lukso } from "viem/chains";
import { getData, encodeKeyName } from "@chillwhales/erc725";

const client = createPublicClient({ chain: lukso, transport: http() });
const value = await getData(client, "0x1234...", encodeKeyName("LSP3Profile"));
```

### Array Key Utilities

```typescript
import { extractArrayPrefix, extractArrayIndex, encodeKeyName } from "@chillwhales/erc725";

const elementKey = encodeKeyName("LSP5ReceivedAssets[]", [42]);
const prefix = extractArrayPrefix(elementKey); // First 16 bytes
const index = extractArrayIndex(elementKey); // 42n
```

## API

Types are exported and available in your editor via TypeScript IntelliSense.

## License

[MIT](./LICENSE)
