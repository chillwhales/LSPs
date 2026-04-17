# LSP-36: Signed Authorizations

| | |
|---|---|
| **LSP** | 36 |
| **Title** | Signed Authorizations |
| **Author** | b00ste |
| **Status** | Draft |
| **Type** | LSP |
| **Created** | 2026-04-17 |
| **Requires** | EIP-712, EIP-1271 |

## Abstract

LSP-36 defines a protocol for off-chain signed authorizations that allow a signer to grant permission for a third party to execute specific function calls on a target smart contract on their behalf. Each authorization is an EIP-712 typed data structure covering the target address, function selector, parameter constraints (with per-parameter wildcarding), value constraints, temporal bounds, and a unique signature ID for replay protection. Authorizations are appended as trailing bytes to standard calldata, preserving existing function signatures without ABI modifications.

## Motivation

Smart accounts on LUKSO (Universal Profiles) require flexible delegation mechanisms. A profile owner may want to authorize a relayer, automation service, or another account to execute specific operations — such as token transfers, permission changes, or metadata updates — without giving blanket access to the account.

Existing approaches either require on-chain transactions to set up permissions (expensive and slow) or use overly broad delegation mechanisms that cannot constrain individual parameters. LSP-36 solves both problems:

1. **Off-chain signing**: The signer creates and signs an authorization off-chain. No on-chain transaction is needed to grant permission.
2. **Fine-grained constraints**: Each authorization specifies exactly which function, which parameters (or wildcards for flexibility), what value, and during what time window the authorization is valid.
3. **Two-phase execution**: A gas-heavy signature verification can be performed once (pre-approval), after which subsequent executions use only the cheap pre-approved path (~7k gas vs 30-50k+).
4. **No ABI changes**: Authorization data is appended as trailing bytes to standard calldata. The target function's ABI remains unchanged — callers invoke functions normally.

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

### EIP-712 Domain Separator

Implementations MUST use the following EIP-712 domain:

| Field | Type | Value |
|---|---|---|
| `name` | `string` | `"LSP36SignedAuthorization"` |
| `version` | `string` | `"1"` |
| `chainId` | `uint256` | The chain ID of the network |
| `verifyingContract` | `address` | The address of the contract performing verification |

The domain separator is computed as:

```
DOMAIN_SEPARATOR = keccak256(
    abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256("LSP36SignedAuthorization"),
        keccak256("1"),
        chainId,
        verifyingContract
    )
)
```

### SignedAuthorization Type Definition

The EIP-712 type hash is:

```
SIGNED_AUTHORIZATION_TYPEHASH = keccak256(
    "SignedAuthorization(address signer,address target,bytes4 selector,bytes32[] paramValues,uint256 paramWildcards,uint256 paramDynamicMask,bool valueIsWildcard,uint256 value,bytes32 signatureId,uint48 validAfter,uint48 validBefore,uint256 nonce)"
)
```

The `SignedAuthorization` struct contains the following 12 fields:

| # | Field | Solidity Type | Description |
|---|---|---|---|
| 1 | `signer` | `address` | The account authorizing the action. For EOAs, this is the ECDSA signer. For smart contracts, this is the account whose `isValidSignature` (EIP-1271) is called. |
| 2 | `target` | `address` | The contract address on which the authorized function call is permitted. |
| 3 | `selector` | `bytes4` | The 4-byte function selector of the authorized function. |
| 4 | `paramValues` | `bytes32[]` | The expected values for each function parameter, encoded as 32-byte words. See [Parameter Encoding Rules](#parameter-encoding-rules). |
| 5 | `paramWildcards` | `uint256` | Bitmask indicating which parameters are wildcards (any value accepted). Bit `i` set means `paramValues[i]` is ignored during verification. |
| 6 | `paramDynamicMask` | `uint256` | Bitmask indicating which parameters are dynamic types. Bit `i` set means `paramValues[i]` is a `keccak256` hash of the ABI-encoded dynamic data, not a raw value. |
| 7 | `valueIsWildcard` | `bool` | If `true`, the `msg.value` of the call is not constrained. If `false`, `msg.value` MUST equal `value`. |
| 8 | `value` | `uint256` | The exact `msg.value` required for the call when `valueIsWildcard` is `false`. Ignored when `valueIsWildcard` is `true`. |
| 9 | `signatureId` | `bytes32` | A unique identifier for replay protection. See [Signature ID Semantics](#signature-id-semantics). |
| 10 | `validAfter` | `uint48` | Unix timestamp (seconds). The authorization is NOT valid before this time. Set to `0` for no lower bound. |
| 11 | `validBefore` | `uint48` | Unix timestamp (seconds). The authorization is NOT valid at or after this time. Set to `type(uint48).max` for no upper bound. |
| 12 | `nonce` | `uint256` | A nonce scoped to the verifying contract. Allows multiple authorizations with different nonces for the same logical operation. |

### Parameter Encoding Rules

Each function parameter is encoded as a single `bytes32` word in the `paramValues` array. The encoding depends on the parameter's Solidity type:

#### Static Types

Static types (types whose ABI encoding occupies exactly 32 bytes) are stored directly as left-padded or right-padded 32-byte words, matching their ABI encoding:

| Type | Encoding | Example |
|---|---|---|
| `address` | Left-padded to 32 bytes | `0x000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045` |
| `uint256` | Direct 32-byte big-endian | `0x0000000000000000000000000000000000000000000000000000000000000064` (100) |
| `uint8`–`uint248` | Left-padded to 32 bytes | Same as ABI encoding |
| `int8`–`int256` | Left-padded to 32 bytes (sign-extended) | Same as ABI encoding |
| `bool` | `0x00...00` (false) or `0x00...01` (true) | Same as ABI encoding |
| `bytes1`–`bytes32` | Right-padded to 32 bytes | Same as ABI encoding |

#### Dynamic Types

Dynamic types (`bytes`, `string`, arrays, nested tuples with dynamic members) MUST be encoded as the `keccak256` hash of their ABI-encoded packed representation:

```
paramValues[i] = keccak256(abi.encodePacked(dynamicData))
```

When a parameter at index `i` is a dynamic type, the corresponding bit in `paramDynamicMask` MUST be set:

```
paramDynamicMask |= (1 << i)
```

During verification, dynamic parameters are compared by hashing the actual calldata's dynamic segment and comparing the hash to `paramValues[i]`.

#### Array Parameters

For fixed-length arrays of static types (e.g., `uint256[3]`), each element occupies one slot in `paramValues`. The first element is at the index corresponding to the parameter's position in the function signature, and subsequent elements follow contiguously.

For dynamic arrays and nested dynamic types, use the dynamic encoding rule above (hash the entire encoded segment).

### Wildcard Semantics

Wildcards allow an authorization to accept any value for specific parameters, the call value, or the sender address.

#### Parameter Wildcards (`paramWildcards`)

The `paramWildcards` field is a `uint256` bitmask. If bit `i` is set (`paramWildcards & (1 << i) != 0`), then `paramValues[i]` is ignored during verification — any value is accepted for that parameter.

Example: To wildcard the second parameter (index 1) of a 3-parameter function:

```
paramWildcards = 0x0000000000000000000000000000000000000000000000000000000000000002
                 // bit 1 is set: parameter at index 1 is wildcarded
```

#### Value Wildcard (`valueIsWildcard`)

When `valueIsWildcard` is `true`, the authorization permits any `msg.value`. When `false`, `msg.value` MUST exactly equal the `value` field.

#### Sender Wildcard

When `signer` is set to `address(0)` (`0x0000000000000000000000000000000000000000`), the authorization is valid for **any sender**. This is useful for publicly executable authorizations where the signer wants to allow anyone to trigger the authorized action.

> **Warning**: A sender wildcard combined with parameter wildcards can create overly permissive authorizations. See [Security Considerations](#security-considerations).

### Trailing Bytes Format

Authorization data is appended to the original function calldata as trailing bytes, following the LSP17-style encoding. The format varies based on the mode flag:

```
[original calldata][authorization payload][mode flag (1 byte)]
```

The **mode flag** is always the last byte of `msg.data`. Implementations MUST read the mode flag first to determine the payload layout.

#### Mode `0x00` — Full Verification

The full verification payload contains the complete `SignedAuthorization` struct and a signature:

```
Offset (from end of msg.data):
  -1            mode flag: 0x00
  -1-65         signature (65 bytes: r[32] || s[32] || v[1])
  -66-N         ABI-encoded SignedAuthorization struct
```

Layout (reading from the end of `msg.data`):

| Component | Size | Description |
|---|---|---|
| Mode flag | 1 byte | `0x00` |
| Signature | 65 bytes | ECDSA signature: `r` (32 bytes) \|\| `s` (32 bytes) \|\| `v` (1 byte) |
| SignedAuthorization | Variable | ABI-encoded `SignedAuthorization` struct |

The verifier MUST:
1. Extract the mode flag from the last byte
2. Extract the 65-byte signature
3. ABI-decode the `SignedAuthorization` struct from the remaining trailing bytes
4. Perform full verification (see [Verification Algorithm](#verification-algorithm))

#### Mode `0x01` — Pre-Approved

The pre-approved payload contains only the `signatureId`:

```
Offset (from end of msg.data):
  -1            mode flag: 0x01
  -1-32         signatureId (32 bytes)
```

Layout:

| Component | Size | Description |
|---|---|---|
| Mode flag | 1 byte | `0x01` |
| signatureId | 32 bytes | The `bytes32` identifier of a previously pre-approved authorization |

The verifier MUST:
1. Extract the mode flag from the last byte
2. Extract the 32-byte `signatureId`
3. Look up the pre-approved authorization by `signatureId`
4. Verify the pre-approval exists, has not expired, and the call parameters match

### Verification Algorithm

The full verification algorithm (mode `0x00`) MUST proceed as follows:

```
function verify(auth: SignedAuthorization, signature: bytes, callContext):
    // Step 1: Validate time bounds
    IF block.timestamp < auth.validAfter:
        REVERT LSP36SignatureNotYetValid(auth.validAfter, block.timestamp)
    IF block.timestamp >= auth.validBefore:
        REVERT LSP36SignatureExpired(auth.validBefore, block.timestamp)

    // Step 2: Validate target
    IF auth.target != address(this):
        REVERT LSP36TargetMismatch(auth.target, address(this))

    // Step 3: Validate signature ID has not been consumed
    IF signatureIds[auth.signatureId] == true:
        REVERT LSP36SignatureIdAlreadyUsed(auth.signatureId)

    // Step 4: Compute EIP-712 digest
    structHash = keccak256(abi.encode(
        SIGNED_AUTHORIZATION_TYPEHASH,
        auth.signer,
        auth.target,
        auth.selector,
        keccak256(abi.encodePacked(auth.paramValues)),
        auth.paramWildcards,
        auth.paramDynamicMask,
        auth.valueIsWildcard,
        auth.value,
        auth.signatureId,
        auth.validAfter,
        auth.validBefore,
        auth.nonce
    ))
    digest = keccak256("\x19\x01" || DOMAIN_SEPARATOR || structHash)

    // Step 5: Verify signature
    IF auth.signer.code.length > 0:
        // Smart contract signer — use EIP-1271
        // Gas cap: 50,000 gas for isValidSignature call
        magicValue = IERC1271(auth.signer).isValidSignature{gas: 50000}(digest, signature)
        IF magicValue != 0x1626ba7e:
            REVERT LSP36InvalidSignature()
    ELSE:
        // EOA signer — use ECDSA ecrecover
        recovered = ecrecover(digest, v, r, s)
        IF recovered == address(0):
            REVERT LSP36InvalidSignature()
        IF recovered != auth.signer:
            REVERT LSP36InvalidSigner(recovered, auth.signer)

    // Step 6: Verify function selector
    IF auth.selector != callContext.selector:
        REVERT  // selector mismatch

    // Step 7: Verify parameters
    FOR i = 0 TO length(auth.paramValues) - 1:
        IF paramWildcards & (1 << i) != 0:
            CONTINUE  // wildcarded — skip check
        IF paramDynamicMask & (1 << i) != 0:
            // Dynamic parameter: hash actual calldata segment and compare
            actualHash = keccak256(abi.encodePacked(callContext.params[i]))
            IF actualHash != auth.paramValues[i]:
                REVERT  // dynamic param mismatch
        ELSE:
            // Static parameter: direct comparison
            IF callContext.params[i] != auth.paramValues[i]:
                REVERT  // static param mismatch

    // Step 8: Verify value
    IF NOT auth.valueIsWildcard:
        IF msg.value != auth.value:
            REVERT  // value mismatch

    // Step 9: Mark signature ID as consumed
    signatureIds[auth.signatureId] = true

    // Verification passed
    RETURN true
```

### Pre-Approval Lifecycle

Pre-approval separates the gas-heavy signature verification from the cheap execution path. The lifecycle consists of four operations:

#### 1. Store Pre-Approval (`preApprove`)

```solidity
function preApprove(SignedAuthorization calldata auth, bytes calldata signature) external
```

- Performs full signature verification (Steps 1-5 of the verification algorithm)
- Stores the authorization indexed by `signatureId`
- Emits `PreApprovalStored(signatureId, signer)`
- Does NOT mark the `signatureId` as consumed — it can be executed later

#### 2. Execute Pre-Approved (`mode 0x01`)

When a call arrives with mode flag `0x01`:

1. Extract `signatureId` from trailing bytes
2. Look up stored authorization by `signatureId`
3. If not found: `REVERT LSP36PreApprovalNotFound(signatureId)`
4. Validate time bounds (Steps 1 of verification algorithm)
5. Verify call parameters match stored authorization (Steps 6-8)
6. Mark `signatureId` as consumed
7. Execute the call

#### 3. Revoke Pre-Approval (`revokePreApproval`)

```solidity
function revokePreApproval(bytes32 signatureId) external
```

- Removes the stored pre-approval for the given `signatureId`
- MUST only be callable by the original `signer` of the authorization
- Emits `PreApprovalRevoked(signatureId)`

#### 4. Clear Expired Pre-Approval (`clearExpiredPreApproval`)

```solidity
function clearExpiredPreApproval(bytes32 signatureId) external
```

- Removes a pre-approval whose `validBefore` timestamp has passed
- Callable by anyone (garbage collection)
- Emits `PreApprovalCleared(signatureId)`

#### Query

```solidity
function isPreApproved(bytes32 signatureId) external view returns (bool)
```

- Returns `true` if a valid (not expired, not revoked, not consumed) pre-approval exists for `signatureId`

### Signature ID Semantics

The `signatureId` field (`bytes32`) serves as the primary replay protection mechanism.

#### Uniqueness

Each `signatureId` can only be consumed once per verifying contract. After consumption (either through full verification mode `0x00` or pre-approved execution mode `0x01`), the `signatureId` is permanently marked as used.

#### Nonce Relationship

The `signatureId` and `nonce` serve different purposes:
- `signatureId`: A globally unique identifier for replay protection. Once consumed, it cannot be reused.
- `nonce`: Allows differentiation of multiple authorizations that may share logical grouping. The nonce is part of the signed data but is not independently tracked on-chain.

#### Shared Signature IDs

Multiple `SignedAuthorization` structs MAY reference the same `signatureId`. When the first authorization with a given `signatureId` is consumed, all other authorizations sharing that `signatureId` become invalid ("first-execution-burns-all"). This enables:

- **Mutual exclusion**: Create multiple authorizations for alternative actions, only one of which can be executed.
- **Batch invalidation**: Revoking or consuming one authorization in a group invalidates the entire group.

## Security Considerations

### Replay Protection via Signature ID Consumption

Each `signatureId` is permanently consumed after use. Implementations MUST store consumed `signatureId` values in a mapping and check this mapping before accepting any authorization. The storage MUST be per-contract (scoped to `verifyingContract`) to prevent cross-contract replay.

Cross-chain replay is prevented by the `chainId` in the EIP-712 domain separator. An authorization signed for chain A cannot be replayed on chain B.

### ECDSA Malleability (s-value Enforcement)

ECDSA signatures have a malleability issue: for any valid signature `(r, s, v)`, the signature `(r, n - s, v ^ 1)` is also valid (where `n` is the curve order). Implementations MUST enforce that the `s` value is in the lower half of the curve order:

```
require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0)
```

This follows the convention established by EIP-2 and used by OpenZeppelin's ECDSA library.

### Reentrancy on EIP-1271 Calls

When verifying signatures from smart contract signers via EIP-1271's `isValidSignature`, the verifier makes an external call to an untrusted contract. This introduces a reentrancy vector.

Implementations MUST follow the Checks-Effects-Interactions (CEI) pattern:
1. **Checks**: Validate time bounds, target, and all non-signature checks first
2. **Effects**: Mark the `signatureId` as consumed BEFORE the external call
3. **Interactions**: Call `isValidSignature` last

This ensures that even if the EIP-1271 contract reenters the verifier, the `signatureId` is already consumed, preventing double-use.

### Time Bounds and Block Timestamp Manipulation

The `validAfter` and `validBefore` fields rely on `block.timestamp`, which validators can manipulate within a bounded range (typically ±15 seconds on Ethereum-like chains).

Signers SHOULD:
- Add a buffer of at least 30 seconds to `validAfter` to account for timestamp variance
- Not rely on sub-minute precision for authorization windows
- Use `validBefore` as a coarse expiration (hours/days), not a precise cutoff

Implementations MUST use strict comparisons:
- `block.timestamp < validAfter` means NOT YET VALID
- `block.timestamp >= validBefore` means EXPIRED

### EIP-1271 Gas Cap

The `isValidSignature` call to smart contract signers MUST be gas-capped at **50,000 gas**. This prevents:

- Griefing attacks where a malicious signer contract consumes excessive gas
- Denial-of-service via gas exhaustion in the verification path
- Unbounded computation in untrusted external calls

If the `isValidSignature` call runs out of gas or reverts, the verification MUST fail with `LSP36InvalidSignature()`.

### Wildcard Risks

Overly permissive authorizations can create security vulnerabilities:

| Wildcard Configuration | Risk | Mitigation |
|---|---|---|
| All parameters wildcarded | Signer authorizes any call to the function with any arguments | Minimize wildcarded parameters; constrain critical params (e.g., recipient address) |
| `valueIsWildcard = true` | Signer authorizes any ETH/LYX value to be sent | Only use when value is genuinely unconstrained |
| `signer = address(0)` | Anyone can use the authorization | Combine with tight parameter constraints and short time windows |
| Long `validBefore` window | Authorization remains usable for extended period | Use the shortest viable window; prefer pre-approval for long-lived authorizations |
| All of the above combined | Unrestricted call to target function by anyone for extended duration | NEVER combine all wildcards — always constrain at least one dimension |

Signer interfaces SHOULD warn users when creating authorizations with multiple wildcards active simultaneously.

## Rationale

### Per-Parameter Values with Bitmask Wildcarding (D001, D005)

The protocol uses an array of 32-byte words (`paramValues`) where each entry corresponds to a function parameter, combined with explicit bitmasks for wildcarding (`paramWildcards`) and dynamic type indication (`paramDynamicMask`).

**Why not raw ABI-encoded bytes comparison?** When wildcarding dynamic parameters, the ABI encoding offsets of subsequent parameters shift, making byte-level comparison unreliable. Per-parameter encoding isolates each parameter's value.

**Why bitmasks instead of sentinel values?** Zero-value sentinels (e.g., `address(0)` means wildcard) are ambiguous — `address(0)` is a valid address, `0` is a valid `uint256`. Explicit bitmasks eliminate all ambiguity at the cost of two additional `uint256` fields.

### Pure Library + Abstract Base Architecture (D002)

Verification logic lives in a pure library (`LSP36SignatureVerification`) that any contract can call. An abstract base contract (`LSP36SignatureConsumer`) provides the standard integration with storage management.

**Why not a singleton verifier contract?** Per-contract signature ID scoping is the correct semantic — the `verifyingContract` in the EIP-712 domain already scopes to the verifying contract. A singleton adds a shared trust assumption for no benefit.

### LSP17-Style Trailing Bytes (D003)

Authorization data is appended after the original calldata rather than modifying the function signature.

**Why?** This preserves function selectors — callers invoke functions normally without ABI changes. Existing tools, indexers, and UIs continue to work. The 1-byte mode flag at the end allows the contract to detect and extract the authorization payload efficiently.

### Two-Transaction Pre-Approval (D004)

The protocol supports a 2-TX flow: TX1 verifies the signature and stores a pre-approval, TX2 executes with only a 32-byte `signatureId` in the trailing bytes.

**Why?** Full signature verification is gas-heavy (30-50k+ gas, especially with EIP-1271 and dynamic parameter hashing). The pre-approved execution path costs ~7k gas. For authorizations that will be executed multiple times or where gas cost is critical, the 2-TX pattern amortizes the verification cost.

### Foundry Build Framework (D006)

The reference implementation uses Foundry (`forge build`, `forge test`) for compilation and testing.

**Why?** Foundry provides native Solidity tests, built-in fuzzing for the large input space of signature verification, and fast compilation. It is already available in the development environment.

## Backwards Compatibility

LSP-36 introduces a new standard and does not modify any existing LSP or EIP interfaces. The trailing bytes encoding is additive — contracts that do not implement LSP-36 will ignore the trailing bytes (or revert if they perform strict calldata length checks).

Contracts implementing LSP-36 MUST handle both cases:
1. Calls **with** trailing bytes (mode `0x00` or `0x01`)
2. Calls **without** trailing bytes (standard calls, no authorization required)

## Encoding Example

This example demonstrates encoding a `SignedAuthorization` for a `transfer(address,uint256)` call.

### Scenario

- **Signer**: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- **Target contract**: `0x1234567890AbcdEF1234567890aBcdef12345678`
- **Function**: `transfer(address to, uint256 amount)`
- **Selector**: `0xa9059cbb`
- **Authorized recipient (`to`)**: `0xABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD`
- **Amount**: Wildcarded (any amount allowed)
- **Value**: 0 (no ETH/LYX sent)
- **Signature ID**: `0x0000000000000000000000000000000000000000000000000000000000000001`
- **Valid window**: Timestamp 1700000000 to 1700086400 (24 hours)
- **Nonce**: 0

### Authorization Fields

```
signer:          0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
target:          0x1234567890AbcdEF1234567890aBcdef12345678
selector:        0xa9059cbb
paramValues:     [
                   0x000000000000000000000000ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD,  // to (index 0)
                   0x0000000000000000000000000000000000000000000000000000000000000000   // amount (index 1, ignored — wildcarded)
                 ]
paramWildcards:  0x0000000000000000000000000000000000000000000000000000000000000002
                 // bit 1 set: amount (index 1) is wildcarded
paramDynamicMask:0x0000000000000000000000000000000000000000000000000000000000000000
                 // no dynamic params — both address and uint256 are static
valueIsWildcard: false
value:           0x0000000000000000000000000000000000000000000000000000000000000000
signatureId:     0x0000000000000000000000000000000000000000000000000000000000000001
validAfter:      1700000000  (0x6553F100 as uint48)
validBefore:     1700086400  (0x65554A80 as uint48)
nonce:           0x0000000000000000000000000000000000000000000000000000000000000000
```

### EIP-712 Struct Hash

```
structHash = keccak256(abi.encode(
    SIGNED_AUTHORIZATION_TYPEHASH,
    0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045,              // signer
    0x1234567890AbcdEF1234567890aBcdef12345678,              // target
    0xa9059cbb00000000000000000000000000000000000000000000000000000000, // selector (bytes4, right-padded)
    keccak256(abi.encodePacked(
        0x000000000000000000000000ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD,
        0x0000000000000000000000000000000000000000000000000000000000000000
    )),                                                       // keccak256 of paramValues array
    0x0000000000000000000000000000000000000000000000000000000000000002, // paramWildcards
    0x0000000000000000000000000000000000000000000000000000000000000000, // paramDynamicMask
    0x0000000000000000000000000000000000000000000000000000000000000000, // valueIsWildcard (false)
    0x0000000000000000000000000000000000000000000000000000000000000000, // value
    0x0000000000000000000000000000000000000000000000000000000000000001, // signatureId
    0x000000000000000000000000000000000000000000000000000000006553F100, // validAfter
    0x0000000000000000000000000000000000000000000000000000000065554A80, // validBefore
    0x0000000000000000000000000000000000000000000000000000000000000000  // nonce
))
```

### Digest

```
digest = keccak256("\x19\x01" || DOMAIN_SEPARATOR || structHash)
```

The signer signs this `digest` with their private key, producing signature `(r, s, v)`.

### Trailing Bytes (Mode 0x00 — Full Verification)

The final `msg.data` sent to the target contract:

```
[transfer(address,uint256) calldata]                    // original ABI-encoded call
[ABI-encoded SignedAuthorization struct]                 // authorization data
[r (32 bytes) || s (32 bytes) || v (1 byte)]            // ECDSA signature (65 bytes)
[0x00]                                                  // mode flag: full verification
```

### Trailing Bytes (Mode 0x01 — Pre-Approved)

After the authorization has been pre-approved via `preApprove()`, subsequent calls use:

```
[transfer(address,uint256) calldata]                    // original ABI-encoded call
[0x0000000000000000000000000000000000000000000000000000000000000001] // signatureId (32 bytes)
[0x01]                                                  // mode flag: pre-approved
```

Total overhead: 33 bytes appended to calldata.

## Custom Errors

The protocol defines the following custom errors for clear failure diagnostics:

| Error | Parameters | Condition |
|---|---|---|
| `LSP36SignatureIdAlreadyUsed` | `bytes32 signatureId` | The `signatureId` has already been consumed |
| `LSP36InvalidSignature` | — | ECDSA recovery returned `address(0)` or EIP-1271 returned wrong magic value |
| `LSP36SignatureExpired` | `uint48 validBefore, uint256 blockTimestamp` | `block.timestamp >= validBefore` |
| `LSP36SignatureNotYetValid` | `uint48 validAfter, uint256 blockTimestamp` | `block.timestamp < validAfter` |
| `LSP36InvalidSigner` | `address recovered, address expected` | ECDSA-recovered address does not match `auth.signer` |
| `LSP36TargetMismatch` | `address target, address actual` | `auth.target` does not match `address(this)` |
| `LSP36PreApprovalNotFound` | `bytes32 signatureId` | No pre-approval exists for the given `signatureId` |
| `LSP36InvalidMode` | `uint8 mode` | Mode flag is not `0x00` or `0x01` |

## Reference Implementation

The reference implementation is located in this repository:

- **Solidity contracts**: `solidity/LSP36/` — Foundry project with interfaces, constants, errors, and implementation
- **TypeScript SDK**: `packages/lsp36/` — Encoding, signing, and verification utilities

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
