// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {SignedAuthorization} from "./ILSP36SignatureVerification.sol";
import {SIGNED_AUTHORIZATION_TYPEHASH, EIP1271_MAGIC_VALUE} from "./LSP36Constants.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

bytes32 constant _EIP712_DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
bytes32 constant _NAME_HASH = keccak256("LSP36SignedAuthorization");
bytes32 constant _VERSION_HASH = keccak256("1");

library LSP36SignatureVerification {
    function computeStructHash(SignedAuthorization calldata auth) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
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
            )
        );
    }

    function computeDomainSeparator(address verifyingContract) internal view returns (bytes32) {
        return keccak256(
            abi.encode(_EIP712_DOMAIN_TYPEHASH, _NAME_HASH, _VERSION_HASH, block.chainid, verifyingContract)
        );
    }

    function verifySignature(
        SignedAuthorization calldata auth,
        bytes calldata signature,
        address verifyingContract
    ) internal view returns (bool) {
        bytes32 structHash = computeStructHash(auth);
        bytes32 domainSeparator = computeDomainSeparator(verifyingContract);
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);

        if (auth.signer.code.length > 0) {
            try IERC1271(auth.signer).isValidSignature{gas: 50_000}(digest, signature) returns (bytes4 magic) {
                return magic == EIP1271_MAGIC_VALUE;
            } catch {
                return false;
            }
        } else {
            (address recovered, ECDSA.RecoverError err,) = ECDSA.tryRecoverCalldata(digest, signature);
            if (err != ECDSA.RecoverError.NoError) return false;
            return recovered == auth.signer;
        }
    }

    function verifyTimeBounds(uint48 validAfter, uint48 validBefore) internal view returns (bool) {
        return block.timestamp >= validAfter && block.timestamp < validBefore;
    }

    function verifyTarget(address authTarget, address actualTarget) internal pure returns (bool) {
        return authTarget == actualTarget;
    }

    function verifyParams(
        bytes32[] calldata paramValues,
        uint256 paramWildcards,
        uint256 paramDynamicMask,
        bytes calldata actualCalldata
    ) internal pure returns (bool) {
        uint256 len = paramValues.length;
        for (uint256 i; i < len; ++i) {
            if ((paramWildcards >> i) & 1 == 1) continue;

            if ((paramDynamicMask >> i) & 1 == 1) {
                // Dynamic parameter: follow ABI offset pointer
                uint256 offsetPos = 4 + i * 32;
                if (offsetPos + 32 > actualCalldata.length) return false;

                uint256 offset = uint256(bytes32(actualCalldata[offsetPos:offsetPos + 32]));
                uint256 dataPos = 4 + offset;
                if (dataPos + 32 > actualCalldata.length) return false;

                uint256 dataLen = uint256(bytes32(actualCalldata[dataPos:dataPos + 32]));
                uint256 dataStart = dataPos + 32;
                if (dataStart + dataLen > actualCalldata.length) return false;

                bytes32 hashed = keccak256(actualCalldata[dataStart:dataStart + dataLen]);
                if (hashed != paramValues[i]) return false;
            } else {
                // Static parameter: direct 32-byte comparison
                uint256 pos = 4 + i * 32;
                if (pos + 32 > actualCalldata.length) return false;

                if (bytes32(actualCalldata[pos:pos + 32]) != paramValues[i]) return false;
            }
        }
        return true;
    }

    function verifyValue(bool valueIsWildcard, uint256 expectedValue, uint256 actualValue) internal pure returns (bool) {
        return valueIsWildcard || expectedValue == actualValue;
    }
}
