---
lip: 29
title: Encrypted Assets
author: b00ste
discussions-to:
status: Draft
type: LSP
created: 2025-01-08
requires: ERC725Y, LSP2, LSP30
---

## Simple Summary

A standard for storing encrypted digital assets in [ERC725Y] smart contracts, enabling creators to manage token-gated content directly on their Universal Profile.

## Abstract

This standard defines a set of [ERC725Y] data keys for storing references to encrypted digital assets. Encrypted content chunks are stored across multiple backends (IPFS, Lumera, S3, Arweave), while metadata is referenced on-chain via [MultiStorageURI] (LSP30). The standard supports versioning, allowing creators to update content while preserving full revision history.

## Specification

### ERC725Y Data Keys

#### LSP29EncryptedAssets[]

An [LSP2 Array] of [MultiStorageURI] values, each pointing to an encrypted asset's JSON metadata.

```json
{
  "name": "LSP29EncryptedAssets[]",
  "key": "0x1965f98377ddff08e78c93d820cc8de4eeb331e684b7724bce0debb1958386c3",
  "keyType": "Array",
  "valueType": "bytes",
  "valueContent": "MultiStorageURI"
}
```

#### LSP29EncryptedAssetsMap

An [LSP2 Mapping] from a content identifier hash to the array index. Supports two lookup patterns:

- **Latest version**: `keccak256(contentId)` → most recent revision (updated on each new version)
- **Specific version**: `keccak256(abi.encodePacked(contentId, uint32(revision)))` → immutable pointer

```json
{
  "name": "LSP29EncryptedAssetsMap:<bytes20>",
  "key": "0x2b9a7a38a67cedc507c20000<bytes20>",
  "keyType": "Mapping",
  "valueType": "uint128",
  "valueContent": "Number"
}
```

#### LSP29EncryptedAssetRevisionCount

An [LSP2 Mapping] from content identifier hash to total revision count.

```json
{
  "name": "LSP29EncryptedAssetRevisionCount:<bytes20>",
  "key": "0xb41f63e335c22bded8140000<bytes20>",
  "keyType": "Mapping",
  "valueType": "uint128",
  "valueContent": "Number"
}
```

### JSON Schema

The [MultiStorageURI] stored in the array MUST point to a JSON file conforming to:

```json
{
  "LSP29EncryptedAsset": {
    "version": "2.0.0",
    "id": "<string>",
    "title": "<string>",
    "description": "<string>",
    "revision": "<number>",
    "createdAt": "<string>",
    "file": {
      "type": "<string>",
      "name": "<string>",
      "size": "<number>",
      "lastModified": "<number>",
      "hash": "<string>"
    },
    "encryption": {
      "provider": "<string>",
      "method": "<string>",
      "params": "<object>",
      "condition": "<unknown>",
      "encryptedKey": "<object>"
    },
    "chunks": {
      "ipfs": { "cids": ["<string>"] },
      "lumera": { "actionIds": ["<string>"] },
      "s3": { "keys": ["<string>"], "bucket": "<string>", "region": "<string>" },
      "arweave": { "transactionIds": ["<string>"] },
      "iv": "<string>",
      "totalSize": "<number>"
    }
  }
}
```

#### encryption

| Key            | Type    | Required | Description                                     |
| -------------- | ------- | -------- | ----------------------------------------------- |
| `provider`     | string  | Yes      | Encryption provider (`taco`, `lit`)             |
| `method`       | string  | Yes      | Access control method (provider-agnostic)       |
| `params`       | object  | Yes      | Method-specific parameters for verification     |
| `condition`    | unknown | Yes      | Provider-native condition object (stored as-is) |
| `encryptedKey` | object  | Yes      | Provider-specific encrypted key data            |

**Supported methods:**

| Method                  | `params` fields                   |
| ----------------------- | --------------------------------- |
| `digital-asset-balance` | `tokenAddress`, `requiredBalance` |
| `lsp8-ownership`        | `tokenAddress`, `requiredTokenId` |
| `lsp26-follower`        | `followedAddresses`               |
| `time-locked`           | `unlockTimestamp`                 |

#### chunks

Per-backend arrays of chunk references. At least one backend must be present.

| Key         | Type   | Required | Description                    |
| ----------- | ------ | -------- | ------------------------------ |
| `ipfs`      | object | No       | `{ cids: string[] }`           |
| `lumera`    | object | No       | `{ actionIds: string[] }`      |
| `s3`        | object | No       | `{ keys, bucket, region }`     |
| `arweave`   | object | No       | `{ transactionIds: string[] }` |
| `iv`        | string | Yes      | Initialization vector (base64) |
| `totalSize` | number | Yes      | Total encrypted content size   |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

[ERC725Y]: https://github.com/ethereum/ercs/blob/master/ERCS/erc-725.md#erc725y
[LSP2 Array]: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md#array
[LSP2 Mapping]: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md#mapping
[MultiStorageURI]: ../lsp30/LSP-30-MultiStorageURI.md
