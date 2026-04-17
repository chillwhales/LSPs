// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

bytes32 constant SIGNED_AUTHORIZATION_TYPEHASH = keccak256(
    "SignedAuthorization(address signer,address target,bytes4 selector,bytes32[] paramValues,uint256 paramWildcards,uint256 paramDynamicMask,bool valueIsWildcard,uint256 value,bytes32 signatureId,uint48 validAfter,uint48 validBefore,uint256 nonce)"
);

bytes4 constant EIP1271_MAGIC_VALUE = 0x1626ba7e;

uint8 constant MODE_FULL_VERIFICATION = 0x00;
uint8 constant MODE_PRE_APPROVED = 0x01;
