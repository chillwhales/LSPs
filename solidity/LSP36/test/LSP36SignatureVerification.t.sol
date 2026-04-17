// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SignedAuthorization} from "../src/ILSP36SignatureVerification.sol";
import {LSP36SignatureVerification} from "../src/LSP36SignatureVerification.sol";
import {SIGNED_AUTHORIZATION_TYPEHASH} from "../src/LSP36Constants.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

bytes32 constant _EIP712_DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
bytes32 constant _NAME_HASH = keccak256("LSP36SignedAuthorization");
bytes32 constant _VERSION_HASH = keccak256("1");

uint256 constant SECP256K1_ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

contract LSP36Harness {
    using LSP36SignatureVerification for *;

    function computeStructHash(SignedAuthorization calldata auth) external pure returns (bytes32) {
        return LSP36SignatureVerification.computeStructHash(auth);
    }

    function computeDomainSeparator(address verifyingContract) external view returns (bytes32) {
        return LSP36SignatureVerification.computeDomainSeparator(verifyingContract);
    }

    function verifySignature(
        SignedAuthorization calldata auth,
        bytes calldata signature,
        address verifyingContract
    ) external view returns (bool) {
        return LSP36SignatureVerification.verifySignature(auth, signature, verifyingContract);
    }

    function verifyTimeBounds(uint48 validAfter, uint48 validBefore) external view returns (bool) {
        return LSP36SignatureVerification.verifyTimeBounds(validAfter, validBefore);
    }

    function verifyTarget(address authTarget, address actualTarget) external pure returns (bool) {
        return LSP36SignatureVerification.verifyTarget(authTarget, actualTarget);
    }

    function verifyParams(
        bytes32[] calldata paramValues,
        uint256 paramWildcards,
        uint256 paramDynamicMask,
        bytes calldata actualCalldata
    ) external pure returns (bool) {
        return LSP36SignatureVerification.verifyParams(paramValues, paramWildcards, paramDynamicMask, actualCalldata);
    }

    function verifyValue(bool valueIsWildcard, uint256 expectedValue, uint256 actualValue) external pure returns (bool) {
        return LSP36SignatureVerification.verifyValue(valueIsWildcard, expectedValue, actualValue);
    }
}

contract LSP36SignatureVerificationTest is Test {
    LSP36Harness harness;

    function setUp() public {
        harness = new LSP36Harness();
    }

    function _buildAndSign(
        uint256 privateKey
    ) internal view returns (SignedAuthorization memory auth, bytes memory signature) {
        address signer = vm.addr(privateKey);
        bytes32[] memory paramValues = new bytes32[](0);

        auth = SignedAuthorization({
            signer: signer,
            target: address(this),
            selector: bytes4(0xdeadbeef),
            paramValues: paramValues,
            paramWildcards: 0,
            paramDynamicMask: 0,
            valueIsWildcard: false,
            value: 0,
            signatureId: bytes32(uint256(1)),
            validAfter: 0,
            validBefore: type(uint48).max,
            nonce: 0
        });

        bytes32 structHash = harness.computeStructHash(auth);
        bytes32 domainSep = harness.computeDomainSeparator(address(this));
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSep, structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function _boundPrivateKey(uint256 pk) internal pure returns (uint256) {
        return bound(pk, 1, SECP256K1_ORDER - 1);
    }

    // 1. Valid EOA signature
    function testFuzz_verifySignature_validEOA(uint256 privateKey) public view {
        privateKey = _boundPrivateKey(privateKey);
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSign(privateKey);
        assertTrue(harness.verifySignature(auth, sig, address(this)));
    }

    // 2. Wrong signer
    function testFuzz_verifySignature_wrongSigner(uint256 pk1, uint256 pk2) public view {
        pk1 = _boundPrivateKey(pk1);
        pk2 = _boundPrivateKey(pk2);
        vm.assume(pk1 != pk2);

        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSign(pk1);
        auth.signer = vm.addr(pk2);
        assertFalse(harness.verifySignature(auth, sig, address(this)));
    }

    // 3. Malleable S (high s-value)
    function testFuzz_verifySignature_malleableS(uint256 privateKey) public view {
        privateKey = _boundPrivateKey(privateKey);
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSign(privateKey);

        // Extract r, s, v and flip s to high value
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        bytes32 flippedS = bytes32(SECP256K1_ORDER - uint256(s));
        uint8 flippedV = v == 27 ? 28 : 27;
        bytes memory malleableSig = abi.encodePacked(r, flippedS, flippedV);

        assertFalse(harness.verifySignature(auth, malleableSig, address(this)));
    }

    // 4. Time bounds
    function testFuzz_verifyTimeBounds(uint48 validAfter, uint48 validBefore, uint48 timestamp) public {
        vm.warp(timestamp);
        bool expected = (timestamp >= validAfter && timestamp < validBefore);
        assertEq(harness.verifyTimeBounds(validAfter, validBefore), expected);
    }

    // 5. Target verification
    function testFuzz_verifyTarget(address authTarget, address actualTarget) public view {
        assertEq(harness.verifyTarget(authTarget, actualTarget), authTarget == actualTarget);
    }

    // 6. Value verification
    function testFuzz_verifyValue(bool isWildcard, uint256 expected, uint256 actual) public view {
        assertEq(harness.verifyValue(isWildcard, expected, actual), isWildcard || expected == actual);
    }

    // 7. Static params with wildcards
    function testFuzz_verifyParams_static(bytes32[4] memory values, uint8 wildcardBits) public view {
        wildcardBits = wildcardBits & 0x0F; // mask to 4 bits

        bytes32[] memory paramValues = new bytes32[](4);
        for (uint256 i; i < 4; ++i) {
            paramValues[i] = values[i];
        }

        bytes memory callData = abi.encodePacked(bytes4(0xaabbccdd), values[0], values[1], values[2], values[3]);

        // Matching calldata should return true
        assertTrue(harness.verifyParams(paramValues, uint256(wildcardBits), 0, callData));

        // Find a non-wildcarded param to mutate
        uint256 mutateIdx = type(uint256).max;
        for (uint256 i; i < 4; ++i) {
            if ((wildcardBits >> i) & 1 == 0) {
                mutateIdx = i;
                break;
            }
        }

        if (mutateIdx < 4) {
            // Mutate one non-wildcarded param
            bytes32 mutated = bytes32(uint256(values[mutateIdx]) ^ 1);
            bytes memory badCallData;
            if (mutateIdx == 0) {
                badCallData = abi.encodePacked(bytes4(0xaabbccdd), mutated, values[1], values[2], values[3]);
            } else if (mutateIdx == 1) {
                badCallData = abi.encodePacked(bytes4(0xaabbccdd), values[0], mutated, values[2], values[3]);
            } else if (mutateIdx == 2) {
                badCallData = abi.encodePacked(bytes4(0xaabbccdd), values[0], values[1], mutated, values[3]);
            } else {
                badCallData = abi.encodePacked(bytes4(0xaabbccdd), values[0], values[1], values[2], mutated);
            }
            assertFalse(harness.verifyParams(paramValues, uint256(wildcardBits), 0, badCallData));
        }
    }

    // 8. Empty params
    function testFuzz_verifyParams_emptyParams(bytes memory callData) public view {
        bytes32[] memory empty = new bytes32[](0);
        assertTrue(harness.verifyParams(empty, 0, 0, callData));
    }

    // 9. Struct hash determinism
    function test_computeStructHash_deterministic() public view {
        bytes32[] memory paramValues = new bytes32[](1);
        paramValues[0] = bytes32(uint256(42));

        SignedAuthorization memory auth1 = SignedAuthorization({
            signer: address(0x1),
            target: address(0x2),
            selector: bytes4(0x11223344),
            paramValues: paramValues,
            paramWildcards: 0,
            paramDynamicMask: 0,
            valueIsWildcard: false,
            value: 100,
            signatureId: bytes32(uint256(1)),
            validAfter: 0,
            validBefore: type(uint48).max,
            nonce: 0
        });

        SignedAuthorization memory auth2 = SignedAuthorization({
            signer: address(0x1),
            target: address(0x2),
            selector: bytes4(0x11223344),
            paramValues: paramValues,
            paramWildcards: 0,
            paramDynamicMask: 0,
            valueIsWildcard: false,
            value: 100,
            signatureId: bytes32(uint256(1)),
            validAfter: 0,
            validBefore: type(uint48).max,
            nonce: 0
        });

        assertEq(harness.computeStructHash(auth1), harness.computeStructHash(auth2));

        // Change one field — hash must differ
        auth2.nonce = 999;
        assertTrue(harness.computeStructHash(auth1) != harness.computeStructHash(auth2));
    }

    // 10. Domain separator encodes chainId
    function test_computeDomainSeparator_chainId() public view {
        bytes32 actual = harness.computeDomainSeparator(address(this));
        bytes32 expected = keccak256(
            abi.encode(_EIP712_DOMAIN_TYPEHASH, _NAME_HASH, _VERSION_HASH, block.chainid, address(this))
        );
        assertEq(actual, expected);
    }
}
