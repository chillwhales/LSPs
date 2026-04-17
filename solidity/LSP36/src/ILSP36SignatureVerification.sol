// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

struct SignedAuthorization {
    address signer;
    address target;
    bytes4 selector;
    bytes32[] paramValues;
    uint256 paramWildcards;
    uint256 paramDynamicMask;
    bool valueIsWildcard;
    uint256 value;
    bytes32 signatureId;
    uint48 validAfter;
    uint48 validBefore;
    uint256 nonce;
}

interface ILSP36SignatureVerification {
    function verifySignedAuthorization(
        SignedAuthorization calldata auth,
        bytes calldata signature
    ) external view returns (bool);
}
